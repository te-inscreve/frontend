import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import { BuildingsIcon } from "phosphor-react-native/src/icons/Buildings";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { UsersThreeIcon } from "phosphor-react-native/src/icons/UsersThree";
import { withUniwind } from "uniwind";

import type { InscricaoGrupo, InscricaoIndividual } from "@te-inscreve/schemas";

import { idadeEm, nomeCompleto } from "../lib/integrante";
import { PicoteHorizontal, PicoteVertical } from "./partes-do-bilhete";

const IconeEntidade = withUniwind(BuildingsIcon);
const IconePessoa = withUniwind(UserIcon);
const IconeGrupo = withUniwind(UsersThreeIcon);

/*
 * Os bilhetes de `ListaInscricoes` do web
 * (`apps/web/src/features/inscricoes/lista-inscricoes.tsx`), na largura da
 * lista. A diferença é o lugar da nota: cada bilhete já reserva o espaço da
 * nota final da avaliação, para que mostrá-la depois não mude o layout. O
 * selo de "há quanto tempo" da inscrição individual sai para dar lugar a ela:
 * para quem avalia, a data da inscrição não diz nada.
 *
 * Os bilhetes ficam direto sobre a tela: a mordida dos picotes tem a cor do
 * fundo (`bg-background`).
 */

/**
 * A inscrição em grupo: cabeçalho com quem se apresenta, picote e a
 * formação ao lado da nota.
 *
 * O título é o nome do concorrente quando a modalidade o exibe, e a
 * entidade desce para a linha de baixo; sem ele, a entidade é o título.
 */
export function BilheteGrupo({ inscricao }: { inscricao: InscricaoGrupo }) {
    const { entidade, nomeConcorrente, totalIntegrantes } = inscricao;

    return (
        <View className="bg-card border-border overflow-hidden rounded-xl border">
            <View className="flex-row items-start gap-3 px-4 pt-4 pb-3">
                <View
                    aria-hidden
                    className="bg-primary/10 size-11 items-center justify-center rounded-lg"
                >
                    <IconeGrupo
                        size={24}
                        weight="duotone"
                        colorClassName="accent-primary"
                    />
                </View>
                <View className="flex-1 gap-0.5">
                    <Text
                        role="heading"
                        numberOfLines={1}
                        className="text-card-foreground text-lg font-bold tracking-tight"
                    >
                        {nomeConcorrente ?? entidade.nome}
                    </Text>
                    <Linha icone={IconeEntidade}>
                        {nomeConcorrente
                            ? `${entidade.nome} · ${entidade.cidade}`
                            : entidade.cidade}
                    </Linha>
                </View>
                <Codigo inscricao={inscricao} />
            </View>

            <PicoteHorizontal />

            <View className="flex-row items-end justify-between gap-3 px-4 pt-3 pb-4">
                <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-card-foreground text-3xl font-bold tabular-nums">
                        {totalIntegrantes}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                        {totalIntegrantes === 1 ? "integrante" : "integrantes"}
                    </Text>
                </View>
                <LugarDaNota />
            </View>
        </View>
    );
}

/**
 * A inscrição individual: o canhoto com o número à esquerda, a pessoa e a
 * nota à direita, separados por um picote de pé.
 *
 * `concorrente` nulo é um estado que o backend não deveria produzir, mas o
 * serializer admite: o bilhete diz que falta alguém em vez de quebrar.
 */
export function BilheteIndividual({
    inscricao,
}: {
    inscricao: InscricaoIndividual;
}) {
    const { entidade, concorrente } = inscricao;

    return (
        <View className="bg-card border-border flex-row overflow-hidden rounded-xl border">
            <View className="w-20 items-center justify-center">
                <Codigo inscricao={inscricao} />
            </View>

            <PicoteVertical />

            <View className="flex-1 flex-row items-center gap-3 p-3">
                {concorrente ? (
                    <View className="flex-1 gap-0.5">
                        <Text
                            role="heading"
                            numberOfLines={1}
                            className="text-card-foreground text-base"
                        >
                            {nomeCompleto(concorrente)}
                        </Text>
                        <Linha icone={IconePessoa}>
                            {`${idadeEm(concorrente.dataNascimento)} anos · ${concorrente.matriculaMtg}`}
                        </Linha>
                        <Linha icone={IconeEntidade}>
                            {`${entidade.nome} · ${entidade.cidade}`}
                        </Linha>
                    </View>
                ) : (
                    <Text className="text-card-foreground flex-1 text-sm font-medium">
                        Concorrente não informado
                    </Text>
                )}
                <LugarDaNota />
            </View>
        </View>
    );
}

/**
 * Onde vai a nota final da avaliação desta inscrição. Por enquanto nenhuma
 * avaliação chega ao app, então diz que a inscrição não foi avaliada; o
 * tamanho é fixo, o da nota que virá.
 */
function LugarDaNota() {
    return (
        <View
            accessible
            aria-label="Nota: não avaliada"
            className="bg-muted h-14 w-20 items-center justify-center rounded-md px-1"
        >
            <Text className="text-muted-foreground text-center text-xs">
                Não avaliada
            </Text>
        </View>
    );
}

/** O número da inscrição, o carimbo do canhoto no web. */
function Codigo({ inscricao }: { inscricao: { id: number } }) {
    return (
        <Text
            aria-label={`Inscrição número ${inscricao.id}`}
            className="text-card-foreground text-base font-semibold tabular-nums"
        >
            #{inscricao.id.toString().padStart(4, "0")}
        </Text>
    );
}

function Linha({
    icone: Icone,
    children,
}: {
    /** Ícone Phosphor já passado por `withUniwind`. */
    icone: ComponentType<IconProps & { colorClassName?: string }>;
    children: string;
}) {
    return (
        <View className="flex-row items-center gap-1">
            <Icone
                size={16}
                colorClassName="accent-muted-foreground"
                aria-hidden
            />
            <Text
                numberOfLines={1}
                className="text-muted-foreground flex-1 text-sm"
            >
                {children}
            </Text>
        </View>
    );
}

/** O {@link BilheteGrupo} enquanto a lista não chega. */
export function BilheteGrupoSkeleton() {
    return (
        <View
            aria-hidden
            className="bg-card border-border overflow-hidden rounded-xl border"
        >
            <View className="flex-row items-start gap-3 px-4 pt-4 pb-3">
                <View className="bg-muted size-11 rounded-lg" />
                <View className="flex-1 gap-1.5">
                    <View className="bg-muted h-6 w-2/3 rounded" />
                    <View className="bg-muted h-4 w-1/2 rounded" />
                </View>
            </View>
            <PicoteHorizontal />
            <View className="flex-row items-end justify-between gap-3 px-4 pt-3 pb-4">
                <View className="bg-muted h-9 w-32 rounded" />
                <View className="bg-muted h-14 w-20 rounded-md" />
            </View>
        </View>
    );
}

/** O {@link BilheteIndividual} enquanto a lista não chega. */
export function BilheteIndividualSkeleton() {
    return (
        <View
            aria-hidden
            className="bg-card border-border flex-row overflow-hidden rounded-xl border"
        >
            <View className="w-20 items-center justify-center">
                <View className="bg-muted h-4 w-12 rounded" />
            </View>
            <PicoteVertical />
            <View className="flex-1 flex-row items-center gap-3 p-3">
                <View className="flex-1 gap-1.5">
                    <View className="bg-muted h-5 w-2/3 rounded" />
                    <View className="bg-muted h-4 w-1/2 rounded" />
                    <View className="bg-muted h-4 w-3/5 rounded" />
                </View>
                <View className="bg-muted h-14 w-20 rounded-md" />
            </View>
        </View>
    );
}
