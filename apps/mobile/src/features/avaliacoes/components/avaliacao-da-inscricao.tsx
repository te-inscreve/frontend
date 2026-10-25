import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { EnvioAvaliacao, ModeloFichaDetalhe } from "@te-inscreve/schemas";
import { formatarDecimal, formularioDoPayload } from "@te-inscreve/schemas";

import type { AlvoDaAvaliacao, AvaliacaoLocal } from "../lib/avaliacoes-locais";
import type {
    InscricaoAvaliada,
    OrigemDaFicha,
} from "../lib/rota-ficha-inscricao";
import { Button } from "~/components/ui/button";
import {
    avaliacaoAtualDoAvaliador,
    comecarAvaliacaoAtual,
    congelarAvaliacaoAtual,
    descartar,
    enfileirar,
    guardarAvaliacaoAtual,
    tirarDaFila,
    useAvaliacaoLocal,
} from "../lib/avaliacoes-locais";
import { notaDaFicha, trechosDaFicha } from "../lib/formulario-ficha";
import { rotaDaAvaliacaoLocal } from "../lib/rota-ficha-inscricao";
import { avisarQueSalvou } from "../lib/use-motor-fila";
import { useSaidasDaFicha } from "../lib/use-saidas-da-ficha";
import { FolhaFichaSkeleton } from "./folha-ficha";
import { FormularioFicha } from "./formulario-ficha";

/**
 * O modelo da categoria como o aparelho o baixou (TE-107). Sem download, só
 * a avaliação já começada abre: ela tem a própria cópia do modelo.
 */
export type ModeloAtual =
    | { tipo: "carregando" }
    | { tipo: "nao-baixado"; baixar: () => void }
    | { tipo: "sem-modelo" }
    | { tipo: "pronto"; modelo: ModeloFichaDetalhe };

/**
 * A avaliação de uma inscrição, pelo que o aparelho tem dela (TE-74):
 *
 * - **atual**: o formulário, a partir do payload e da cópia do modelo
 *   guardados — abre sem rede. Se o modelo da categoria mudou de versão, a
 *   avaliação atual congela;
 * - **na fila, com erro ou sincronizada**: o estado, sem edição;
 * - **nada**: começa a avaliação atual com o modelo atual, depois de
 *   perguntar se o avaliador já tem outra avaliação atual.
 */
export function AvaliacaoDaInscricao({
    alvo,
    inscricao,
    modeloAtual,
    origem,
}: {
    alvo: AlvoDaAvaliacao;
    inscricao: InscricaoAvaliada;
    modeloAtual: ModeloAtual;
    /** De onde a ficha foi aberta, para o "Voltar" (`useSaidasDaFicha`). */
    origem?: OrigemDaFicha;
}) {
    const { data, updatedAt } = useAvaliacaoLocal(
        alvo.avaliadorId,
        alvo.inscricaoId,
    );
    const local = data[0];
    // Depois de salvar, o formulário segue montado para mostrar o sucesso,
    // mesmo com a avaliação já na fila.
    const [acabouDeSalvar, setAcabouDeSalvar] = useState(false);
    // Cancelada, a tela só espera sair: sem a linha no banco, ela começaria
    // uma avaliação nova durante a animação de volta.
    const [cancelada, setCancelada] = useState(false);
    const router = useRouter();
    const { voltar, concluir } = useSaidasDaFicha(alvo.categoriaId, origem);

    // Pelo id, não pela linha: cada gravação devolve uma linha nova da
    // consulta, e um `aoMudar` novo gravaria de novo, sem fim.
    const localId = local?.id;
    const aoMudar = useCallback(
        (payload: EnvioAvaliacao) => {
            if (localId) void guardarAvaliacaoAtual(localId, payload);
        },
        [localId],
    );

    const versaoMudou =
        local?.estado === "atual" &&
        !local.motivoCongelado &&
        modeloAtual.tipo === "pronto" &&
        modeloAtual.modelo.id !== local.modelo.id;

    useEffect(() => {
        if (versaoMudou && localId)
            void congelarAvaliacaoAtual(
                localId,
                "O modelo de ficha desta categoria mudou depois que esta avaliação começou.",
            );
    }, [versaoMudou, localId]);

    // A primeira leitura do banco ainda não voltou.
    if (updatedAt === undefined || cancelada) return <FolhaFichaSkeleton />;

    if (local && (acabouDeSalvar || local.estado === "atual")) {
        if (local.motivoCongelado && !acabouDeSalvar)
            return <AvaliacaoAtualCongelada avaliacao={local} />;
        return (
            <FormularioDaAvaliacaoAtual
                avaliacao={local}
                inscricao={inscricao}
                aoMudar={aoMudar}
                aoSalvar={async (payload) => {
                    setAcabouDeSalvar(true);
                    try {
                        await enfileirar(local.id, payload);
                    } catch (erro) {
                        setAcabouDeSalvar(false);
                        throw erro;
                    }
                    avisarQueSalvou();
                }}
                aoCancelar={async () => {
                    setCancelada(true);
                    try {
                        await descartar(local.id);
                    } catch (erro) {
                        setCancelada(false);
                        throw erro;
                    }
                    router.back();
                }}
                aoConcluir={() => void concluir()}
            />
        );
    }

    if (local) return <EstadoDaAvaliacao avaliacao={local} aoVoltar={voltar} />;

    return (
        <NovaAvaliacaoAtual
            alvo={alvo}
            inscricao={inscricao}
            modeloAtual={modeloAtual}
        />
    );
}

function FormularioDaAvaliacaoAtual({
    avaliacao,
    inscricao,
    aoMudar,
    aoSalvar,
    aoCancelar,
    aoConcluir,
}: {
    avaliacao: AvaliacaoLocal;
    inscricao: InscricaoAvaliada;
    aoMudar: (payload: EnvioAvaliacao) => void;
    aoSalvar: (payload: EnvioAvaliacao) => Promise<void>;
    aoCancelar: () => Promise<void>;
    aoConcluir: () => void;
}) {
    // Só na montagem: depois, quem manda é o formulário. A linha que volta
    // do banco a cada gravação traz objetos novos, que não podem reiniciá-lo.
    const [modelo] = useState(avaliacao.modelo);
    const [valoresIniciais] = useState(() =>
        formularioDoPayload(avaliacao.modelo, avaliacao.payload),
    );

    return (
        <FormularioFicha
            modelo={modelo}
            inscricao={inscricao}
            valoresIniciais={valoresIniciais}
            aoMudar={aoMudar}
            aoSalvar={aoSalvar}
            aoCancelar={aoCancelar}
            aoConcluir={aoConcluir}
        />
    );
}

/**
 * Começa a avaliação atual, ou pergunta o que fazer com a de outra inscrição.
 */
function NovaAvaliacaoAtual({
    alvo,
    inscricao,
    modeloAtual,
}: {
    alvo: AlvoDaAvaliacao;
    inscricao: InscricaoAvaliada;
    modeloAtual: ModeloAtual;
}) {
    const router = useRouter();
    // `undefined` enquanto procura; `null` quando não há outra atual.
    const [outro, setOutro] = useState<AvaliacaoLocal | null>();
    const modelo = modeloAtual.tipo === "pronto" ? modeloAtual.modelo : null;

    useEffect(() => {
        void avaliacaoAtualDoAvaliador(alvo.avaliadorId).then((atual) =>
            setOutro(atual ?? null),
        );
    }, [alvo.avaliadorId]);

    // Uma criação por montagem: o efeito pode rodar de novo antes de a
    // consulta da tela achar a avaliação, e o índice único recusaria a segunda.
    const criando = useRef(false);
    useEffect(() => {
        if (outro !== null || !modelo || criando.current) return;
        criando.current = true;
        // Ao criar, a consulta da tela acha a avaliação e troca esta tela pelo
        // formulário.
        comecarAvaliacaoAtual(alvo, modelo, inscricao).catch(() => {
            criando.current = false;
        });
    }, [outro, modelo, alvo, inscricao]);

    if (modeloAtual.tipo === "nao-baixado")
        return (
            <Aviso
                titulo="Categoria ainda não baixada"
                texto="Conecte-se à internet para baixar o modelo de ficha desta categoria. Depois, ela pode ser avaliada também sem rede."
            >
                <Button variant="outline" onPress={modeloAtual.baixar}>
                    Baixar agora
                </Button>
            </Aviso>
        );

    if (modeloAtual.tipo === "sem-modelo")
        return (
            <Aviso
                titulo="Sem modelo de ficha"
                texto="A avaliação fica disponível quando a organização vincular um modelo a esta categoria."
            />
        );

    if (!outro) return <FolhaFichaSkeleton />;

    return (
        <Aviso
            titulo="Você já tem uma avaliação atual"
            texto={`A avaliação de ${outro.inscricao.concorrente} (${outro.inscricao.categoria}) ainda não foi salva. Só uma avaliação atual fica no aparelho por vez.`}
        >
            <Button onPress={() => router.replace(rotaDaAvaliacaoLocal(outro))}>
                {`Continuar ${outro.inscricao.concorrente}`}
            </Button>
            <Button
                variant="outline"
                onPress={() =>
                    Alert.alert(
                        "Descartar a avaliação atual?",
                        `O que foi preenchido para ${outro.inscricao.concorrente} será apagado do aparelho.`,
                        [
                            { text: "Cancelar", style: "cancel" },
                            {
                                text: "Descartar",
                                style: "destructive",
                                onPress: () =>
                                    void descartar(outro.id).then(() =>
                                        setOutro(null),
                                    ),
                            },
                        ],
                    )
                }
            >
                Descartar e começar esta
            </Button>
        </Aviso>
    );
}

/** A avaliação atual que não se edita mais: só descartar e recomeçar. */
function AvaliacaoAtualCongelada({ avaliacao }: { avaliacao: AvaliacaoLocal }) {
    return (
        <Aviso
            titulo="Avaliação congelada"
            texto={avaliacao.motivoCongelado ?? ""}
        >
            <Button
                variant="destructive"
                onPress={() =>
                    Alert.alert(
                        "Descartar e recomeçar?",
                        "O que foi preenchido será apagado, e a avaliação recomeça no modelo atual.",
                        [
                            { text: "Cancelar", style: "cancel" },
                            {
                                text: "Descartar",
                                style: "destructive",
                                onPress: () => void descartar(avaliacao.id),
                            },
                        ],
                    )
                }
            >
                Descartar e recomeçar
            </Button>
        </Aviso>
    );
}

const TEXTO_DO_ESTADO: Record<
    Exclude<AvaliacaoLocal["estado"], "atual">,
    { titulo: string; texto: string }
> = {
    na_fila: {
        titulo: "Na fila de envio",
        texto: "Esta avaliação foi salva e segue para o servidor quando houver conexão. Para editá-la, ela sai da fila.",
    },
    enviando: {
        titulo: "Enviando",
        texto: "Esta avaliação está sendo enviada ao servidor.",
    },
    com_erro: {
        titulo: "Recusada pelo servidor",
        texto: "O servidor não aceitou esta avaliação.",
    },
    sincronizada: {
        titulo: "Enviada",
        texto: "O servidor aceitou esta avaliação. Ela não muda mais.",
    },
};

/** A avaliação que já foi salva: o estado e a nota. */
function EstadoDaAvaliacao({
    avaliacao,
    aoVoltar,
}: {
    avaliacao: AvaliacaoLocal;
    aoVoltar: () => void;
}) {
    const nota = useMemo(() => {
        // A sincronizada mostra a nota do servidor; as outras, a prévia.
        if (avaliacao.nota) return Number(avaliacao.nota);
        return notaDaFicha(
            trechosDaFicha(avaliacao.modelo),
            formularioDoPayload(avaliacao.modelo, avaliacao.payload),
        );
    }, [avaliacao]);
    const estado = avaliacao.estado === "atual" ? "na_fila" : avaliacao.estado;
    const { titulo, texto } = TEXTO_DO_ESTADO[estado];

    return (
        <Aviso
            titulo={titulo}
            texto={
                avaliacao.erro ? `${texto} ${avaliacao.erro.mensagem}` : texto
            }
        >
            <Text className="text-foreground text-center text-lg">
                {`Nota ${formatarDecimal(Number(nota.toFixed(2)))} / 10`}
            </Text>
            {(avaliacao.estado === "na_fila" ||
                avaliacao.estado === "enviando") && (
                <Button onPress={() => editar(avaliacao)}>Editar</Button>
            )}
            <Button variant="outline" onPress={aoVoltar}>
                Voltar
            </Button>
        </Aviso>
    );
}

/**
 * O "Editar" de uma avaliação na fila: ela sai da fila e volta a ser a
 * avaliação atual, e o app diz isso antes. Em `enviando`, não há o que tirar:
 * o app avisa e espera o resultado.
 */
function editar(avaliacao: AvaliacaoLocal) {
    if (avaliacao.estado === "enviando") {
        avisarEnviando();
        return;
    }
    Alert.alert(
        "Tirar da fila para editar?",
        "A avaliação sai da fila de envio e só volta ao ser salva de novo, no fim da fila.",
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Editar",
                onPress: () =>
                    void tirarDaFila(avaliacao.id).then((resultado) => {
                        if (resultado.ok) return;
                        if (resultado.motivo === "enviando") avisarEnviando();
                        else if (resultado.motivo === "outra_atual")
                            Alert.alert(
                                "Você já tem uma avaliação atual",
                                "Salve ou descarte a avaliação atual antes de editar esta. Só uma avaliação atual fica no aparelho por vez.",
                            );
                    }),
            },
        ],
    );
}

function avisarEnviando() {
    Alert.alert(
        "Já está sendo enviada",
        "Esta avaliação está a caminho do servidor. Espere o resultado do envio.",
    );
}

function Aviso({
    titulo,
    texto,
    children,
}: {
    titulo: string;
    texto: string;
    children?: React.ReactNode;
}) {
    return (
        <View className="flex-1 items-center justify-center gap-6 p-6">
            <View className="w-full max-w-[480px] gap-2">
                <Text
                    role="heading"
                    className="text-foreground text-center text-xl font-bold"
                >
                    {titulo}
                </Text>
                <Text className="text-muted-foreground text-center">
                    {texto}
                </Text>
            </View>
            {children && (
                <View className="w-full max-w-[480px] gap-3">{children}</View>
            )}
        </View>
    );
}
