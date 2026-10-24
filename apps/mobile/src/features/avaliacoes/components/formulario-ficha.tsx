import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type {
    EnvioAvaliacao,
    ModeloFichaDetalhe,
    ValoresFicha,
} from "@te-inscreve/schemas";
import {
    formatarDecimal,
    montarFormularioFicha,
    payloadDoFormulario,
} from "@te-inscreve/schemas";

import type { InscricaoAvaliada } from "../lib/rota-ficha-inscricao";
import { Button } from "~/components/ui/button";
import {
    abaDoTrecho,
    chavesDoTrecho,
    notaDaFicha,
    resumoDoValor,
    trechosDaFicha,
} from "../lib/formulario-ficha";
import { EdicaoTrecho } from "./edicao-trecho";
import { FolhaFicha } from "./folha-ficha";
import { SucessoAvaliacao } from "./sucesso-avaliacao";

/**
 * O formulário de avaliação como a ficha inteira, em branco, de
 * entrada. O avaliador vê tudo antes e preenche aos poucos, na ordem que
 * quiser, uma aba por vez: os campos gerais se preenchem na própria ficha, e
 * cada ocorrência de um agrupamento abre o seu trecho numa folha inferior.
 * "Aplicar" valida o trecho e só fecha a folha sem erros; arrastar, o fundo e
 * o voltar fecham sempre, validando sem barrar, e a ficha marca o que ficou
 * com erro. "Salvar" valida tudo e vai à aba do primeiro trecho com pendência.
 * O nome de cada ocorrência se edita no título da folha.
 *
 * O formulário é o da avaliação atual (TE-74): abre com `valoresIniciais`, o
 * payload guardado convertido, e devolve o payload a `aoMudar` a cada
 * mudança, agrupadas em meio segundo, e ao sair da tela. O "Salvar"
 * confirmado entrega o payload final a `aoSalvar`, que põe a avaliação na
 * fila; o "Cancelar" confirmado chama `aoCancelar`, que a descarta.
 *
 * `inscricao` é quem a tela de sucesso mostra como avaliado.
 */
export function FormularioFicha({
    modelo,
    inscricao,
    valoresIniciais,
    aoMudar,
    aoSalvar,
    aoCancelar,
}: {
    modelo: ModeloFichaDetalhe;
    inscricao: InscricaoAvaliada;
    valoresIniciais: ValoresFicha;
    aoMudar: (payload: EnvioAvaliacao) => void;
    aoSalvar: (payload: EnvioAvaliacao) => Promise<void>;
    aoCancelar: () => Promise<void>;
}) {
    const { schema } = useMemo(() => montarFormularioFicha(modelo), [modelo]);
    const trechos = useMemo(() => trechosDaFicha(modelo), [modelo]);
    const form = useForm<ValoresFicha>({
        resolver: zodResolver(schema),
        defaultValues: valoresIniciais,
    });
    // A ficha mostra as respostas: precisa renderizar a cada mudança.
    const valores = useWatch({ control: form.control }) as ValoresFicha;
    useGuardarAutomatico(modelo, valores, aoMudar);
    // O trecho fica guardado com a folha fechada: ela segue mostrando o último
    // enquanto desliza para baixo.
    const [aberto, setAberto] = useState(0);
    const [visivel, setVisivel] = useState(false);
    // Sem aba de campos gerais, a ficha cai na primeira que houver.
    const [aba, setAba] = useState("gerais");
    const [salva, setSalva] = useState(false);
    const router = useRouter();
    // As respostas do trecho como estavam ao abrir a folha, para o
    // "Cancelar" desfazer o que foi mexido nele.
    const [antes, setAntes] = useState<{
        valores: ValoresFicha;
        comErro: boolean;
    }>({ valores: {}, comErro: false });

    // Com duas casas, como a tela de sucesso mostra.
    const nota = notaDaFicha(trechos, valores);
    const notaFormatada = formatarDecimal(Number(nota.toFixed(2)));

    // Quantos campos já têm resposta, para o rodapé dizer onde o avaliador
    // está sem precisar rolar a ficha nem trocar de aba.
    const campos = trechos.flatMap((trecho) => trecho.campos);
    const preenchidos = campos.filter(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) !== null,
    ).length;

    const erros = form.formState.errors;
    function comErro(indice: number) {
        const trecho = trechos[indice];
        return !!trecho && chavesDoTrecho(trecho).some((chave) => erros[chave]);
    }

    function validarTrecho(indice: number) {
        const trecho = trechos[indice];
        return trecho
            ? form.trigger(chavesDoTrecho(trecho))
            : Promise.resolve(true);
    }

    function abrir(indice: number) {
        const trecho = trechos[indice];
        const chaves = trecho ? chavesDoTrecho(trecho) : [];
        setAntes({
            valores: Object.fromEntries(
                chaves.map((chave) => [chave, form.getValues(chave)]),
            ),
            comErro: comErro(indice),
        });
        setAberto(indice);
        setVisivel(true);
    }

    function cancelar() {
        const chaves = Object.keys(antes.valores);
        Object.entries(antes.valores).forEach(([chave, valor]) =>
            form.setValue(chave, valor),
        );
        // O erro volta a ser o de antes: some o que o avaliador provocou na
        // folha, e o que a ficha já marcava continua marcado.
        form.clearErrors(chaves);
        if (antes.comErro) void form.trigger(chaves);
        Keyboard.dismiss();
        setVisivel(false);
    }

    function fechar() {
        void validarTrecho(aberto);
        Keyboard.dismiss();
        setVisivel(false);
    }

    async function aplicar() {
        if (await validarTrecho(aberto)) {
            Keyboard.dismiss();
            setVisivel(false);
        }
    }

    function cancelarAvaliacao() {
        Keyboard.dismiss();
        Alert.alert(
            "Cancelar a avaliação?",
            `O que foi preenchido para ${inscricao.concorrente} será apagado do aparelho.`,
            [
                { text: "Continuar avaliando", style: "cancel" },
                {
                    text: "Cancelar avaliação",
                    style: "destructive",
                    onPress: () =>
                        void aoCancelar().catch(() =>
                            Alert.alert(
                                "Não foi possível cancelar",
                                "A avaliação continua no aparelho. Tente de novo.",
                            ),
                        ),
                },
            ],
        );
    }

    const salvar = form.handleSubmit(
        // Válida, a avaliação ainda pede confirmação: na fila ela não se
        // edita mais (ADR 0001 usa o `Alert` para confirmar). O sucesso só
        // aparece depois de ela estar na fila.
        (validos) => {
            Keyboard.dismiss();
            Alert.alert(
                "Salvar avaliação?",
                "Ela vai para a fila de envio e não poderá mais ser editada lá.",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Salvar",
                        onPress: () =>
                            void aoSalvar(payloadDoFormulario(modelo, validos))
                                .then(() => setSalva(true))
                                .catch(() =>
                                    Alert.alert(
                                        "Não foi possível salvar",
                                        "Suas respostas continuam guardadas no aparelho. Tente de novo.",
                                    ),
                                ),
                    },
                ],
            );
        },
        (falhas) => {
            // Vai à aba do primeiro erro. Os campos gerais mostram o erro na
            // própria ficha; só a ocorrência precisa da folha para isso.
            const primeiro = trechos.findIndex((trecho) =>
                chavesDoTrecho(trecho).some((chave) => falhas[chave]),
            );
            const trecho = trechos[primeiro];
            if (!trecho) return;
            setAba(abaDoTrecho(trecho));
            if (trecho.ocorrencia) abrir(primeiro);
        },
    );

    return (
        <View className="flex-1">
            <ScrollView contentContainerClassName="grow">
                <FolhaFicha
                    modelo={modelo}
                    inscricao={inscricao}
                    trechos={trechos}
                    valores={valores}
                    comErro={comErro}
                    aoTocar={abrir}
                    aba={aba}
                    aoTrocarAba={setAba}
                    control={form.control}
                    revalidar={form.trigger}
                />
            </ScrollView>

            <View className="bg-card border-border border-t p-4">
                {/* A nota final mora no rodapé fixo, ao lado do "Salvar":
                    vale para a ficha inteira, não para uma aba, e fica à
                    vista enquanto o avaliador preenche. É a prévia do que
                    já foi preenchido (TE-95). */}
                <View className="w-full max-w-[720px] flex-row items-center gap-4 self-center">
                    <View className="flex-1 gap-0.5">
                        <View className="flex-row items-baseline gap-2">
                            <Text className="text-muted-foreground text-sm">
                                Nota final
                            </Text>
                            <Text aria-label={`${notaFormatada} de 10`}>
                                <Text className="text-foreground text-2xl font-bold">
                                    {notaFormatada}
                                </Text>
                                <Text className="text-muted-foreground text-base">
                                    {" / 10"}
                                </Text>
                            </Text>
                        </View>
                        <Text className="text-muted-foreground text-sm">
                            {preenchidos} de {campos.length} preenchidos
                        </Text>
                    </View>
                    <Button variant="outline" onPress={cancelarAvaliacao}>
                        Cancelar
                    </Button>
                    <Button onPress={() => void salvar()}>Salvar</Button>
                </View>
            </View>

            <EdicaoTrecho
                trecho={trechos[aberto]}
                visivel={visivel}
                control={form.control}
                revalidar={form.trigger}
                aoAplicar={() => void aplicar()}
                aoFechar={fechar}
                aoCancelar={cancelar}
            />

            <SucessoAvaliacao
                visivel={salva}
                nota={nota}
                inscricao={inscricao}
                aoConcluir={() => {
                    setSalva(false);
                    router.back();
                }}
            />
        </View>
    );
}

/**
 * Guarda a avaliação atual enquanto o avaliador preenche: meio segundo depois da
 * última mudança e, se algo ficou pendente, ao sair da tela.
 */
function useGuardarAutomatico(
    modelo: ModeloFichaDetalhe,
    valores: ValoresFicha,
    aoMudar: (payload: EnvioAvaliacao) => void,
) {
    const pendente = useRef<ValoresFicha | null>(null);
    // A última versão dos dois, para a saída da tela não guardar com a de
    // quando montou.
    const ultimo = useRef({ modelo, aoMudar });
    useEffect(() => {
        ultimo.current = { modelo, aoMudar };
    }, [modelo, aoMudar]);

    useEffect(() => {
        pendente.current = valores;
        const espera = setTimeout(() => {
            pendente.current = null;
            aoMudar(payloadDoFormulario(modelo, valores));
        }, 500);
        return () => clearTimeout(espera);
    }, [modelo, valores, aoMudar]);

    useEffect(
        () => () => {
            if (!pendente.current) return;
            const { modelo: atual, aoMudar: guardar } = ultimo.current;
            guardar(payloadDoFormulario(atual, pendente.current));
        },
        [],
    );
}
