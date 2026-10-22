import type { Control } from "react-hook-form";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { withUniwind } from "uniwind";

import type { CampoFicha, ModeloFichaDetalhe } from "@te-inscreve/schemas";

import type {
    AbaDaFicha,
    TrechoFicha,
    ValorCampo,
    ValoresFicha,
} from "../lib/formulario-ficha-mock";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/utils/cn";
import {
    abasDaFicha,
    formatarDecimal,
    resumoDoValor,
    tetoDoCampo,
} from "../lib/formulario-ficha-mock";
import { CampoFichaControlado } from "./campo-ficha";
import { SeloModificador } from "./selo-modificador";

/*
 * MOCK (TE-82): a ficha inteira, a partir do modelo de ficha do web
 * (`apps/web/.../ficha-avaliativa/folha-modelo-ficha.tsx`), preenchida com as
 * respostas e dividida em abas: uma com os campos gerais, que se preenchem ali
 * mesmo, e uma por agrupamento, com um cartão por ocorrência que abre o seu
 * trecho na folha. Os agrupamentos saem da grade do web para os cartões.
 *
 * Três níveis de texto: o título de seção (`text-lg`), o nome do campo ou do
 * cartão (`text-base`) e o apoio — ajuda, valores no cartão — em `text-sm`.
 * O espaço separa as seções; linha, só a borda do cartão.
 */

const Aviso = withUniwind(WarningCircleIcon);
const Lapis = withUniwind(PencilSimpleIcon);

/**
 * A maior parte dos campos é obrigatória: marcar a exceção é menos ruído do
 * que um asterisco em quase todo rótulo.
 */
function Opcional() {
    return (
        <Text className="text-muted-foreground font-normal">
            {" (opcional)"}
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
 * A nota com o teto ao lado, como "8 / 10": o mesmo do campo na edição e da
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

/**
 * Uma resposta da ocorrência, na largura toda do cartão: o nome e o selo em
 * cima, o valor embaixo. Sem a ajuda do campo: o cartão é um resumo.
 */
function RespostaDoCartao({
    campo,
    valor,
}: {
    campo: CampoFicha;
    valor: ValorCampo;
}) {
    const resumo = resumoDoValor(campo, valor);

    return (
        <View className="gap-0.5">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <Text className="text-muted-foreground shrink text-sm">
                    {campo.nome}
                    {!campo.obrigatorio && <Opcional />}
                </Text>
                {campo.modificadorNota && (
                    <SeloModificador modificador={campo.modificadorNota} />
                )}
            </View>
            {campo.tipo === "NUMERICO" ? (
                <NotaComTeto campo={campo} resumo={resumo} />
            ) : resumo ? (
                <Text
                    numberOfLines={2}
                    className="text-foreground text-sm font-semibold"
                >
                    {resumo}
                </Text>
            ) : (
                <Traco />
            )}
        </View>
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

/**
 * Uma ocorrência como cartão: o título e o total em faixas `muted`, os campos
 * no meio. Tocar no cartão abre o trecho na folha.
 */
function CartaoOcorrencia({
    aba,
    linha,
    valores,
    erro,
    aoTocar,
}: {
    aba: Extract<AbaDaFicha, { tipo: "agrupamento" }>;
    linha: Extract<AbaDaFicha, { tipo: "agrupamento" }>["linhas"][number];
    valores: ValoresFicha;
    erro: boolean;
    aoTocar: () => void;
}) {
    // O total da ocorrência só existe onde há nota a somar.
    const temTotal = linha.campos.some(
        ({ campo }) => campo.tipo === "NUMERICO",
    );
    const vazia = linha.campos.every(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) === null,
    );

    return (
        <Pressable
            role="button"
            aria-label={`Preencher ${aba.agrupamento.nome} ${linha.ordem}${erro ? ", com erro" : ""}`}
            onPress={aoTocar}
            className="border-border bg-card overflow-hidden rounded-lg border"
        >
            {/* O erro do cartão é só o selo. */}
            <View className="bg-muted flex-row items-center gap-2 px-4 py-2.5">
                <Text className="text-foreground shrink text-base font-semibold">
                    {aba.agrupamento.nome} {linha.ordem}
                </Text>
                {erro && (
                    <Badge
                        variant="destructive"
                        icone={Aviso}
                        className="ml-auto self-center"
                    >
                        Com erro
                    </Badge>
                )}
            </View>

            {/* Em branco, o cartão só convida a preencher: uma lista de
                traços não diz nada. */}
            {vazia ? (
                <View className="flex-row items-center gap-2 p-4">
                    <Lapis
                        size={16}
                        colorClassName="accent-muted-foreground"
                        aria-hidden
                    />
                    <Text className="text-muted-foreground text-sm">
                        Toque para preencher
                    </Text>
                </View>
            ) : (
                <>
                    <View className="gap-3 p-4">
                        {linha.campos.map(({ chave, campo }) => (
                            <RespostaDoCartao
                                key={chave}
                                campo={campo}
                                valor={valores[chave] ?? null}
                            />
                        ))}
                    </View>
                    {temTotal && (
                        <View className="bg-muted flex-row items-center px-4 py-2.5">
                            <Text className="text-foreground text-sm font-semibold">
                                Total
                            </Text>
                            <ACalcular className="ml-auto text-sm" />
                        </View>
                    )}
                </>
            )}
        </Pressable>
    );
}

/**
 * As abas no topo da ficha: rolam de lado quando não cabem, e um ponto
 * vermelho marca a que tem erro, para o avaliador achar sem abrir uma a uma.
 */
function BarraDeAbas({
    abas,
    atual,
    comErro,
    aoTrocar,
}: {
    abas: AbaDaFicha[];
    atual: string;
    comErro: (aba: AbaDaFicha) => boolean;
    aoTrocar: (chave: string) => void;
}) {
    return (
        <View className="border-border border-b">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                role="tablist"
            >
                {abas.map((aba) => {
                    const selecionada = aba.chave === atual;
                    const erro = comErro(aba);
                    return (
                        <Pressable
                            key={aba.chave}
                            role="tab"
                            aria-selected={selecionada}
                            aria-label={`${aba.titulo}${erro ? ", com erro" : ""}`}
                            onPress={() => aoTrocar(aba.chave)}
                            className={cn(
                                // A borda de baixo cobre a da barra: a aba
                                // escolhida fica sublinhada no verde.
                                "-mb-px flex-row items-center gap-1.5 border-b-2 px-4 py-3",
                                selecionada
                                    ? "border-primary"
                                    : "border-transparent",
                            )}
                        >
                            <Text
                                className={cn(
                                    "text-base",
                                    selecionada
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground",
                                )}
                            >
                                {aba.titulo}
                            </Text>
                            {erro && (
                                <View
                                    aria-hidden
                                    className="bg-destructive size-2 rounded-full"
                                />
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export function FolhaFicha({
    modelo,
    trechos,
    valores,
    comErro,
    aoTocar,
    aba,
    aoTrocarAba,
    control,
    revalidar,
}: {
    modelo: ModeloFichaDetalhe;
    trechos: TrechoFicha[];
    valores: ValoresFicha;
    comErro: (trecho: number) => boolean;
    aoTocar: (trecho: number) => void;
    /** A chave da aba aberta (`abaDoTrecho`). */
    aba: string;
    aoTrocarAba: (chave: string) => void;
    control: Control<ValoresFicha>;
    revalidar: (chave: string) => Promise<boolean>;
}) {
    const abas = abasDaFicha(trechos);
    const aberta = abas.find(({ chave }) => chave === aba) ?? abas[0];
    const abaComErro = (alvo: AbaDaFicha) =>
        alvo.linhas.some(({ trecho }) => comErro(trecho));

    return (
        // Sem a prancheta do web. No tablet, a ficha não passa de 720pt e fica
        // no meio: na largura toda, o olho anda demais de um lado ao outro.
        <View className="w-full max-w-[720px] gap-6 self-center">
            <View className="mt-2 gap-1">
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

            {abas.length > 1 && aberta && (
                <BarraDeAbas
                    abas={abas}
                    atual={aberta.chave}
                    comErro={abaComErro}
                    aoTrocar={aoTrocarAba}
                />
            )}

            {aberta?.tipo === "campos" && (
                <View className="gap-8">
                    {aberta.linhas.map(({ chave, campo }) => (
                        <CampoFichaControlado
                            key={chave}
                            chave={chave}
                            campo={campo}
                            control={control}
                            revalidar={revalidar}
                            naFicha
                        />
                    ))}
                </View>
            )}

            {aberta?.tipo === "agrupamento" && (
                <View className="gap-3">
                    <Text className="text-muted-foreground text-sm">
                        {aberta.agrupamento.quantidade === 1
                            ? "1 ocorrência"
                            : `${aberta.agrupamento.quantidade} ocorrências`}
                    </Text>
                    {aberta.linhas.map((linha) => (
                        <CartaoOcorrencia
                            key={linha.trecho}
                            aba={aberta}
                            linha={linha}
                            valores={valores}
                            erro={comErro(linha.trecho)}
                            aoTocar={() => aoTocar(linha.trecho)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
