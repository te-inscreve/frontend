import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { CloudArrowUpIcon } from "phosphor-react-native/src/icons/CloudArrowUp";
import { CloudCheckIcon } from "phosphor-react-native/src/icons/CloudCheck";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { withUniwind } from "uniwind";

import type { MinhaAvaliacao as MinhaAvaliacaoDados } from "@te-inscreve/schemas";
import { formularioDoPayload } from "@te-inscreve/schemas";

import type { SecaoMinhasAvaliacoes } from "../lib/minhas-avaliacoes";
import type { AvaliacaoLocal } from "~/db/schema";
import { cn } from "~/utils/cn";
import { formatDate, formatHora } from "~/utils/format-date";
import { notaPrevia } from "../lib/fila";
import { progressoDaFicha, trechosDaFicha } from "../lib/formulario-ficha";
import { formatarNota, nomeDoAvaliado } from "../lib/minhas-avaliacoes";
import { rotaDaAvaliacaoLocal } from "../lib/rota-ficha-inscricao";

const IconeNaFila = withUniwind(CloudArrowUpIcon);
const IconeComErro = withUniwind(WarningIcon);
const IconeEnviada = withUniwind(CloudCheckIcon);
const IconeAtual = withUniwind(ClipboardTextIcon);
const Seta = withUniwind(CaretRightIcon);

/** O título da categoria sobre as avaliações dela, com o evento embaixo. */
export function CabecalhoSecaoMinhasAvaliacoes({
    secao,
}: {
    secao: Pick<SecaoMinhasAvaliacoes, "titulo" | "eventoNome">;
}) {
    return (
        <View className="bg-background gap-0.5 pt-4 pb-2">
            <Text
                role="heading"
                className="text-foreground text-base leading-tight font-bold"
            >
                {secao.titulo}
            </Text>
            <Text className="text-muted-foreground text-sm">
                {secao.eventoNome}
            </Text>
        </View>
    );
}

/**
 * Uma avaliação aceita pelo servidor: quem se apresentou, de onde, quando foi
 * enviada e a nota que o servidor calculou. Só leitura: o que chegou ao
 * servidor não muda mais.
 */
export function MinhaAvaliacao({
    avaliacao,
}: {
    avaliacao: MinhaAvaliacaoDados;
}) {
    const nome = nomeDoAvaliado(avaliacao);
    const nota = formatarNota(avaliacao.nota);
    const enviada = formatarEnvio(new Date(avaliacao.dataEnvio));

    return (
        <View
            accessible
            aria-label={`${nome}, ${avaliacao.entidade.nome}, nota ${nota} de 10, enviada em ${enviada}`}
            className="border-border bg-card flex-row items-center gap-3 rounded-xl border p-3"
        >
            <View className="flex-1 gap-0.5">
                <Text
                    numberOfLines={1}
                    className="text-card-foreground text-base font-semibold"
                >
                    {nome}
                </Text>
                <Text
                    numberOfLines={1}
                    className="text-muted-foreground text-sm"
                >
                    {`${avaliacao.entidade.nome} · ${avaliacao.entidade.cidade}`}
                </Text>
                <Text className="text-muted-foreground text-sm">
                    {`Enviada em ${enviada}`}
                </Text>
            </View>
            <View className="bg-muted min-w-16 items-center rounded-lg px-3 py-2">
                <Text className="text-foreground text-xl font-bold">
                    {nota}
                </Text>
                <Text className="text-muted-foreground text-xs">de 10</Text>
            </View>
        </View>
    );
}

/**
 * Uma avaliação que ainda não chegou ao servidor: na fila, sendo enviada ou
 * recusada. A borda tracejada diz, de relance, que ela só existe no
 * aparelho; o card não tem fundo, como um lugar reservado para a enviada.
 * A nota é a prévia do app. Tocar abre a ficha, onde ela se edita ou se
 * descarta.
 *
 * A que acabou de sincronizar, antes de a lista do servidor recarregar, já
 * aparece como enviada: borda sólida e a nota do servidor.
 */
export function AvaliacaoDoAparelho({
    avaliacao,
}: {
    avaliacao: AvaliacaoLocal;
}) {
    const router = useRouter();
    const { inscricao } = avaliacao;
    const enviada = avaliacao.estado === "sincronizada";
    const nota = avaliacao.nota
        ? formatarNota(avaliacao.nota)
        : notaPrevia(avaliacao);
    const comErro = avaliacao.estado === "com_erro";
    const situacao = situacaoNoAparelho(avaliacao);

    return (
        <Pressable
            role="button"
            aria-label={
                enviada
                    ? `${inscricao.concorrente}, ${inscricao.entidade}, ${situacao}, nota ${nota} de 10`
                    : `${inscricao.concorrente}, ${inscricao.entidade}, ainda não enviada: ${situacao}. Nota prévia ${nota} de 10`
            }
            aria-hint="Abre a ficha da avaliação"
            onPress={() =>
                router.push(rotaDaAvaliacaoLocal(avaliacao, "avaliacoes"))
            }
            className={cn(
                "flex-row items-center gap-3 rounded-xl p-3 active:opacity-70",
                enviada
                    ? "border-border bg-card border"
                    : "border-2 border-dashed",
                !enviada &&
                    (comErro
                        ? "border-destructive/60"
                        : "border-muted-foreground/40"),
            )}
        >
            <View className="flex-1 gap-0.5">
                <Text
                    numberOfLines={1}
                    className="text-foreground text-base font-semibold"
                >
                    {inscricao.concorrente}
                </Text>
                <Text
                    numberOfLines={1}
                    className="text-muted-foreground text-sm"
                >
                    {inscricao.entidade}
                </Text>
                <View className="flex-row items-center gap-1.5">
                    {enviada ? (
                        <IconeEnviada
                            size={16}
                            weight="bold"
                            colorClassName="accent-primary"
                        />
                    ) : comErro ? (
                        <IconeComErro
                            size={16}
                            weight="bold"
                            colorClassName="accent-destructive"
                        />
                    ) : (
                        <IconeNaFila
                            size={16}
                            weight="bold"
                            colorClassName="accent-muted-foreground"
                        />
                    )}
                    <Text
                        numberOfLines={2}
                        className={cn(
                            "shrink text-sm",
                            comErro
                                ? "text-destructive"
                                : "text-muted-foreground",
                        )}
                    >
                        {situacao}
                    </Text>
                </View>
            </View>
            <View
                className={cn(
                    "min-w-16 items-center rounded-lg px-3 py-2",
                    enviada ? "bg-muted" : "border-border border border-dashed",
                )}
            >
                <Text className="text-foreground text-xl font-bold">
                    {nota}
                </Text>
                <Text className="text-muted-foreground text-xs">
                    {enviada ? "de 10" : "prévia"}
                </Text>
            </View>
        </Pressable>
    );
}

/**
 * A avaliação atual, no topo da lista: a que o avaliador começou e ainda não
 * salvou. Ela não está na fila nem no servidor, então nenhuma seção a mostra;
 * sem o card, quem abre a lista não sabe que deixou uma ficha pela metade.
 * A borda primária a separa das salvas, e o progresso diz quanto falta.
 * Tocar volta à ficha, como a dock do cabeçalho.
 *
 * A congelada (modelo mudou, categoria encerrou) não se preenche mais: o
 * card diz por quê, e a ficha só oferece descartar.
 */
export function AvaliacaoAtual({ avaliacao }: { avaliacao: AvaliacaoLocal }) {
    const router = useRouter();
    const { inscricao } = avaliacao;
    const { preenchidos, total } = progressoDaFicha(
        trechosDaFicha(avaliacao.modelo),
        formularioDoPayload(avaliacao.modelo, avaliacao.payload),
    );
    const nota = notaPrevia(avaliacao);
    const congelada = !!avaliacao.motivoCongelado;
    const progresso = `${preenchidos} de ${total} campos preenchidos`;
    const origem = [inscricao.entidade, inscricao.categoria]
        .filter(Boolean)
        .join(" · ");

    return (
        <Pressable
            role="button"
            aria-label={
                congelada
                    ? `Avaliação em andamento: ${inscricao.concorrente}, ${origem}. Não pode mais ser preenchida: ${avaliacao.motivoCongelado}`
                    : `Avaliação em andamento: ${inscricao.concorrente}, ${origem}. ${progresso}. Nota prévia ${nota} de 10`
            }
            aria-hint="Abre a ficha da avaliação"
            // `navigate`, como a dock: a ficha dela já aberta não empilha.
            onPress={() =>
                router.navigate(rotaDaAvaliacaoLocal(avaliacao, "avaliacoes"))
            }
            className={cn(
                "bg-card gap-3 rounded-xl border-2 p-3 active:opacity-70",
                congelada ? "border-destructive/60" : "border-primary",
            )}
        >
            <View className="flex-row items-center gap-1.5">
                <IconeAtual
                    size={16}
                    weight="bold"
                    colorClassName={
                        congelada ? "accent-destructive" : "accent-primary"
                    }
                />
                <Text
                    className={cn(
                        "text-sm font-semibold",
                        congelada ? "text-destructive" : "text-primary",
                    )}
                >
                    Avaliação em andamento
                </Text>
            </View>

            <View className="flex-row items-center gap-3">
                <View className="flex-1 gap-0.5">
                    <Text
                        numberOfLines={1}
                        className="text-foreground text-base font-semibold"
                    >
                        {inscricao.concorrente}
                    </Text>
                    <Text
                        numberOfLines={1}
                        className="text-muted-foreground text-sm"
                    >
                        {origem}
                    </Text>
                </View>
                {!congelada && (
                    <View className="bg-muted min-w-16 items-center rounded-lg px-3 py-2">
                        <Text className="text-foreground text-xl font-bold">
                            {nota}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            prévia
                        </Text>
                    </View>
                )}
                <Seta
                    size={20}
                    colorClassName="accent-muted-foreground"
                    aria-hidden
                />
            </View>

            {congelada ? (
                <View className="flex-row items-center gap-1.5">
                    <IconeComErro
                        size={16}
                        weight="bold"
                        colorClassName="accent-destructive"
                    />
                    <Text className="text-destructive shrink text-sm">
                        {avaliacao.motivoCongelado}
                    </Text>
                </View>
            ) : (
                <View className="gap-1.5">
                    <View
                        aria-hidden
                        className="bg-muted h-1.5 overflow-hidden rounded-full"
                    >
                        <View
                            className="bg-primary h-full rounded-full"
                            style={{
                                width: `${total ? (preenchidos / total) * 100 : 0}%`,
                            }}
                        />
                    </View>
                    <Text className="text-muted-foreground text-sm">
                        {progresso}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

/** O rodapé do card pendente: onde a avaliação está no caminho ao servidor. */
function situacaoNoAparelho(avaliacao: AvaliacaoLocal) {
    switch (avaliacao.estado) {
        case "enviando":
            return "Enviando ao servidor…";
        case "com_erro":
            return `Recusada: ${avaliacao.erro?.mensagem ?? "o servidor não aceitou."}`;
        case "sincronizada":
            return `Enviada às ${formatHora(avaliacao.enviadoEm ?? avaliacao.atualizadoEm)}`;
        default: {
            const salva = avaliacao.enfileiradoEm ?? avaliacao.atualizadoEm;
            return `Ainda não enviada · salva às ${formatHora(salva)}`;
        }
    }
}

/** A geometria de {@link MinhaAvaliacao}: três linhas e a caixa da nota. */
export function MinhaAvaliacaoSkeleton() {
    return (
        <View
            aria-hidden
            className="border-border bg-card flex-row items-center gap-3 rounded-xl border p-3"
        >
            <View className="flex-1 gap-1.5">
                <View className="bg-muted h-5 w-2/3 rounded" />
                <View className="bg-muted h-4 w-1/2 rounded" />
                <View className="bg-muted h-4 w-1/3 rounded" />
            </View>
            <View className="bg-muted h-14 w-16 rounded-lg" />
        </View>
    );
}

/** "20 de Out, 14:32", no fuso do aparelho. */
function formatarEnvio(data: Date) {
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");
    return `${formatDate(data)}, ${hora}:${minuto}`;
}
