import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { withUniwind } from "uniwind";

import type {
    CampoFicha,
    ModeloFichaDetalhe,
    TipoCampoFicha,
} from "@te-inscreve/schemas";
import { aceitaAlternativas } from "@te-inscreve/schemas";

import type {
    EtapaFicha,
    TrechoDaFolha,
    ValorCampo,
    ValoresFicha,
} from "../lib/formulario-ficha-mock";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/utils/cn";
import { useTokens } from "~/utils/use-tokens";
import {
    folhaDaRevisao,
    formatarDecimal,
    resumoDoValor,
    tetoDoCampo,
} from "../lib/formulario-ficha-mock";
import { SeloModificador } from "./selo-modificador";

/*
 * MOCK (TE-82): a revisão como a folha do modelo de ficha do web
 * (`apps/web/.../ficha-avaliativa/folha-modelo-ficha.tsx`) — prancheta com o
 * prendedor, campos gerais em linhas pontilhadas, cada agrupamento na faixa
 * verde com a grade por baixo —, mas preenchida com as respostas, e cada
 * trecho tocável para voltar à etapa dele.
 */

const Aviso = withUniwind(WarningCircleIcon);

/** A coluna do número da ocorrência, o `w-10` do web. */
const LARGURA_NUMERO = 40;

// Os rótulos do web (`editor-modelo-ficha/lib/campo-exibido.ts`).
const ROTULO_TIPO: Record<TipoCampoFicha, string> = {
    NUMERICO: "Numérico",
    ALTERNATIVA_UNICA: "Alternativa única",
    ALTERNATIVA_MULTIPLA: "Alternativa múltipla",
    DESCRITIVO: "Descritivo",
    OBSERVACAO: "Observação",
};

/** O prendedor da prancheta, o mesmo desenho do `Prendedor` do web. */
function Prendedor() {
    const { primary } = useTokens();

    return (
        <View
            aria-hidden
            pointerEvents="none"
            className="absolute inset-x-0 -top-2.5 items-center"
        >
            <Svg width={64} height={16} viewBox="0 0 64 16">
                <Path
                    fillRule="evenodd"
                    fill={primary}
                    d="M0 9Q0 6 3 6H15Q17.5 6 18.2 3.4Q19 0 22.5 0H41.5Q45 0 45.8 3.4Q46.5 6 49 6H61Q64 6 64 9V13Q64 16 61 16H3Q0 16 0 13ZM28.5 3.5Q27 3.5 27 5Q27 6.5 28.5 6.5H35.5Q37 6.5 37 5Q37 3.5 35.5 3.5Z"
                />
            </Svg>
        </View>
    );
}

function Obrigatorio() {
    return (
        <Text className="text-destructive" aria-label="(obrigatório)">
            {" *"}
        </Text>
    );
}

/** Sem resposta: um traço, como a célula em branco do web. */
function Traco() {
    return (
        <Text className="text-muted-foreground" aria-label="sem resposta">
            —
        </Text>
    );
}

/**
 * A nota com o teto ao lado, como "8 / 10": o mesmo do campo na etapa e da
 * folha do web. Sem resposta, o traço no lugar da nota; sem teto, só a nota.
 */
function NotaComTeto({
    campo,
    resumo,
}: {
    campo: CampoFicha;
    resumo: string | null;
}) {
    const teto = tetoDoCampo(campo);
    return (
        <Text
            className={cn(
                "text-sm",
                resumo ? "text-foreground font-bold" : "text-muted-foreground",
            )}
        >
            {resumo ?? "—"}
            {teto !== null && (
                <Text className="text-muted-foreground font-normal">
                    {` / ${formatarDecimal(teto)}`}
                </Text>
            )}
        </Text>
    );
}

/**
 * O lugar de um número que a ficha ainda não calcula — o total da linha, a
 * nota final. A fórmula está em aberto no mapa do Linear (TE-95), então o mock
 * só reserva o espaço.
 */
function ACalcular({ className }: { className?: string }) {
    return (
        <Text
            aria-label="a calcular"
            className={cn("text-muted-foreground font-bold", className)}
        >
            —
        </Text>
    );
}

/** As alternativas em chips, com a marcada preenchida. */
function Alternativas({
    campo,
    valor,
}: {
    campo: CampoFicha;
    valor: ValorCampo;
}) {
    const alternativas = [...(campo.alternativas ?? [])].sort(
        (a, b) => a.ordem - b.ordem,
    );
    if (!alternativas.length) return null;

    const multipla = campo.tipo === "ALTERNATIVA_MULTIPLA";
    const marcadas = Array.isArray(valor) ? valor : [valor];

    return (
        <View className="bg-muted flex-row flex-wrap gap-x-4 gap-y-1 self-start rounded-md px-4 py-2">
            {alternativas.map((alternativa) => {
                const marcada = marcadas.includes(alternativa.id);
                return (
                    <View
                        key={alternativa.id}
                        aria-label={`${alternativa.nome}${marcada ? ", marcada" : ""}`}
                        className="flex-row items-center gap-1.5"
                    >
                        <View
                            aria-hidden
                            className={cn(
                                "size-2.5 border",
                                multipla ? "rounded-[2px]" : "rounded-full",
                                marcada
                                    ? "bg-primary border-primary"
                                    : "bg-card border-border",
                            )}
                        />
                        <Text
                            className={cn(
                                "text-xs",
                                marcada
                                    ? "text-foreground font-semibold"
                                    : "text-muted-foreground",
                            )}
                        >
                            {alternativa.nome}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

/**
 * Um campo geral como a linha da folha: nome, teto, pontilhado até a nota ou
 * o tipo, e por baixo as alternativas, o texto respondido e a ajuda.
 */
function LinhaCampo({
    campo,
    valor,
}: {
    campo: CampoFicha;
    valor: ValorCampo;
}) {
    const teto = tetoDoCampo(campo);
    const resumo = resumoDoValor(campo, valor);
    const texto = campo.tipo === "DESCRITIVO" || campo.tipo === "OBSERVACAO";

    return (
        <View className="gap-1">
            <View className="flex-row items-end gap-2">
                <Text className="text-foreground shrink text-sm font-medium">
                    {campo.nome}
                    {campo.obrigatorio && <Obrigatorio />}
                </Text>
                {teto !== null && (
                    <Text className="text-muted-foreground text-xs">
                        (0 - {formatarDecimal(teto)})
                    </Text>
                )}
                <View
                    aria-hidden
                    className="border-foreground/15 mb-1 min-w-4 flex-1 border-b border-dotted"
                />
                {campo.tipo === "NUMERICO" ? (
                    <View className="flex-row items-center gap-2">
                        {campo.modificadorNota && (
                            <SeloModificador
                                modificador={campo.modificadorNota}
                            />
                        )}
                        <NotaComTeto campo={campo} resumo={resumo} />
                    </View>
                ) : (
                    <Badge variant="secondary">{ROTULO_TIPO[campo.tipo]}</Badge>
                )}
            </View>

            {aceitaAlternativas(campo.tipo) && (
                <Alternativas campo={campo} valor={valor} />
            )}
            {texto && (
                <Text
                    className={cn(
                        "text-sm",
                        resumo
                            ? "text-foreground"
                            : "text-muted-foreground italic",
                    )}
                >
                    {resumo ?? "Sem resposta"}
                </Text>
            )}
            {campo.descricao ? (
                <Text className="text-muted-foreground text-xs">
                    {campo.descricao}
                </Text>
            ) : null}
        </View>
    );
}

/** O campo no topo da coluna: o nome e, por baixo, o que ele aceita. */
function CabecalhoCampo({
    campo,
    largura,
}: {
    campo: CampoFicha;
    largura: number;
}) {
    const teto = tetoDoCampo(campo);
    return (
        <View
            style={{ width: largura }}
            className="border-border justify-end gap-1 border-l px-3 py-2"
        >
            <Text className="text-foreground text-sm leading-tight font-medium">
                {campo.nome}
                {campo.obrigatorio && <Obrigatorio />}
            </Text>
            <View className="flex-row items-center gap-1.5">
                <Text className="text-muted-foreground text-xs">
                    {campo.tipo === "NUMERICO"
                        ? teto !== null
                            ? `0 - ${formatarDecimal(teto)}`
                            : "Numérico"
                        : ROTULO_TIPO[campo.tipo]}
                </Text>
                {campo.modificadorNota && (
                    <SeloModificador modificador={campo.modificadorNota} />
                )}
            </View>
        </View>
    );
}

function Celula({
    campo,
    valor,
    largura,
}: {
    campo: CampoFicha;
    valor: ValorCampo;
    largura: number;
}) {
    const resumo = resumoDoValor(campo, valor);
    return (
        <View
            style={{ width: largura }}
            className="border-border justify-center border-l px-3 py-3"
        >
            {campo.tipo === "NUMERICO" ? (
                <NotaComTeto campo={campo} resumo={resumo} />
            ) : resumo ? (
                <Text numberOfLines={2} className="text-foreground text-sm">
                    {resumo}
                </Text>
            ) : (
                <Traco />
            )}
        </View>
    );
}

/**
 * O agrupamento como a grade do web: uma coluna por campo e uma linha por
 * ocorrência, agora com as respostas. A grade rola de lado quando os campos
 * não cabem; cada linha volta para a etapa da ocorrência.
 */
function TabelaAgrupamento({
    trecho,
    valores,
    comErro,
    aoTocar,
}: {
    trecho: Extract<TrechoDaFolha, { tipo: "agrupamento" }>;
    valores: ValoresFicha;
    comErro: (etapa: number) => boolean;
    aoTocar: (etapa: number) => void;
}) {
    const colunas = trecho.linhas[0]?.campos ?? [];
    // Cabeçalho e linhas são `View`s soltas, não uma tabela: sem a mesma
    // largura em todas, cada linha mediria as colunas pelo próprio conteúdo.
    // As colunas dividem a faixa e, abaixo de 128pt, a grade rola de lado.
    // O total da linha só existe onde há nota a somar.
    const temTotal = colunas.some(({ campo }) => campo.tipo === "NUMERICO");
    const totalDeColunas = colunas.length + (temTotal ? 1 : 0);
    const [faixa, setFaixa] = useState(0);
    const largura = Math.max(
        128,
        totalDeColunas ? (faixa - LARGURA_NUMERO) / totalDeColunas : 0,
    );

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(evento) => setFaixa(evento.nativeEvent.layout.width)}
        >
            <View className="bg-card">
                <View className="border-border flex-row border-b">
                    <View
                        style={{ width: LARGURA_NUMERO }}
                        className="items-center justify-end py-2"
                    >
                        <Text
                            className="text-muted-foreground text-xs"
                            aria-label="Linha"
                        >
                            #
                        </Text>
                    </View>
                    {colunas.map(({ chave, campo }) => (
                        <CabecalhoCampo
                            key={chave}
                            campo={campo}
                            largura={largura}
                        />
                    ))}
                    {temTotal && (
                        <View
                            style={{ width: largura }}
                            className="border-border bg-muted/50 justify-end border-l px-3 py-2"
                        >
                            <Text className="text-foreground text-sm font-semibold">
                                Total
                            </Text>
                        </View>
                    )}
                </View>

                {trecho.linhas.map((linha) => {
                    const erro = comErro(linha.etapa);
                    return (
                        <Pressable
                            key={linha.etapa}
                            role="button"
                            aria-label={`Editar ${trecho.agrupamento.nome} ${linha.ordem}`}
                            onPress={() => aoTocar(linha.etapa)}
                            className={cn(
                                "border-border active:bg-accent flex-row border-b",
                                erro && "bg-destructive/5",
                            )}
                        >
                            <View
                                style={{ width: LARGURA_NUMERO }}
                                className="items-center justify-center"
                            >
                                {erro ? (
                                    <Aviso
                                        size={16}
                                        colorClassName="accent-destructive"
                                        aria-label="Com pendências"
                                    />
                                ) : (
                                    <Text className="text-muted-foreground text-xs">
                                        {linha.ordem}
                                    </Text>
                                )}
                            </View>
                            {linha.campos.map(({ chave, campo }) => (
                                <Celula
                                    key={chave}
                                    campo={campo}
                                    valor={valores[chave] ?? null}
                                    largura={largura}
                                />
                            ))}
                            {temTotal && (
                                <View
                                    style={{ width: largura }}
                                    className="border-border bg-muted/50 justify-center border-l px-3 py-3"
                                >
                                    <ACalcular className="text-sm" />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </ScrollView>
    );
}

function resumoDaFolha(modelo: ModeloFichaDetalhe) {
    const campos = modelo.camposGerais.length;
    const agrupamentos = modelo.agrupamentos.length;
    return [
        `${campos} ${campos === 1 ? "campo geral" : "campos gerais"}`,
        `${agrupamentos} ${agrupamentos === 1 ? "agrupamento" : "agrupamentos"}`,
    ].join(" · ");
}

export function FolhaRevisao({
    modelo,
    etapas,
    valores,
    comErro,
    aoTocar,
}: {
    modelo: ModeloFichaDetalhe;
    etapas: EtapaFicha[];
    valores: ValoresFicha;
    comErro: (etapa: number) => boolean;
    aoTocar: (etapa: number) => void;
}) {
    return (
        <View className="pt-2.5">
            <View className="bg-muted/60 border-border rounded-xl border p-2">
                <Prendedor />

                <View className="bg-card gap-8 rounded-md p-5 shadow-xs">
                    <View className="gap-2">
                        <Text
                            role="heading"
                            className="text-foreground text-2xl leading-tight font-bold tracking-tight"
                        >
                            {modelo.nome}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            {resumoDaFolha(modelo)}
                        </Text>
                    </View>

                    {folhaDaRevisao(etapas).map((trecho) => {
                        if (trecho.tipo === "campos") {
                            const erro = comErro(trecho.etapa);
                            return (
                                <Pressable
                                    key={`campos-${trecho.etapa}`}
                                    role="button"
                                    aria-label="Editar campos gerais"
                                    onPress={() => aoTocar(trecho.etapa)}
                                    className={cn(
                                        "active:bg-accent -mx-2 gap-3 rounded-md px-2 py-1",
                                        erro &&
                                            "border-destructive bg-destructive/5 border",
                                    )}
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-muted-foreground flex-1 text-xs font-semibold tracking-wide uppercase">
                                            Campos gerais
                                        </Text>
                                        {erro && (
                                            <Aviso
                                                size={16}
                                                colorClassName="accent-destructive"
                                                aria-label="Com pendências"
                                            />
                                        )}
                                    </View>
                                    <View className="gap-4">
                                        {trecho.campos.map(
                                            ({ chave, campo }) => (
                                                <LinhaCampo
                                                    key={chave}
                                                    campo={campo}
                                                    valor={
                                                        valores[chave] ?? null
                                                    }
                                                />
                                            ),
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }

                        const { agrupamento } = trecho;
                        return (
                            <View
                                key={`agrupamento-${agrupamento.id}`}
                                className="gap-3"
                            >
                                <View
                                    role="heading"
                                    className="bg-primary flex-row items-center gap-2 rounded-sm px-4 py-1"
                                >
                                    <Text
                                        numberOfLines={1}
                                        className="text-primary-foreground shrink text-sm font-semibold"
                                    >
                                        {agrupamento.nome}
                                    </Text>
                                    <Text
                                        aria-label={`repete ${agrupamento.quantidade}`}
                                        className="text-primary-foreground ml-auto text-sm font-semibold"
                                    >
                                        ×{agrupamento.quantidade}
                                    </Text>
                                </View>
                                <TabelaAgrupamento
                                    trecho={trecho}
                                    valores={valores}
                                    comErro={comErro}
                                    aoTocar={aoTocar}
                                />
                            </View>
                        );
                    })}

                    {/* A nota final fecha a folha, abaixo de tudo. */}
                    <View className="border-foreground/80 gap-1 border-t-2 pt-4">
                        <View className="flex-row items-end gap-2">
                            <Text className="text-foreground text-base font-bold">
                                Nota final
                            </Text>
                            <View
                                aria-hidden
                                className="border-foreground/15 mb-1.5 min-w-4 flex-1 border-b"
                            />
                            <Text>
                                <ACalcular className="text-2xl" />
                                <Text className="text-muted-foreground text-base">
                                    {" / 10"}
                                </Text>
                            </Text>
                        </View>
                        <Text className="text-muted-foreground text-xs">
                            O cálculo da nota ainda será definido.
                        </Text>
                    </View>
                </View>

                <View className="flex-row px-2 pt-2">
                    <Text
                        aria-label={`Versão ${modelo.versao}`}
                        className="text-muted-foreground ml-auto text-xs"
                    >
                        v{modelo.versao}
                    </Text>
                </View>
            </View>
        </View>
    );
}
