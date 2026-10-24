import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { withUniwind } from "uniwind";

import type { InscricaoAvaliada } from "../lib/rota-ficha-inscricao";
import { Dado } from "~/components/dado";

const Seta = withUniwind(CaretDownIcon);

/**
 * O chevron à direita do topo da ficha que mostra e esconde
 * {@link DadosDaInscricao}. Fechado de entrada, para não empurrar os campos
 * para baixo.
 */
export function BotaoDadosDaInscricao({ aberto }: { aberto: boolean }) {
    {
        /* A rotação fica na `View`: no ícone, o Uniwind a passa ao SVG,
                    que não aceita `transform` nulo e quebra. */
    }
    return (
        <View
            style={{
                transform: [{ rotate: aberto ? "180deg" : "0deg" }],
            }}
        >
            <Seta
                size={22}
                weight="bold"
                colorClassName="accent-muted-foreground"
            />
        </View>
    );
}

/**
 * O resto do que identifica quem está sendo avaliado — o nome já é o título
 * da ficha —, direto na faixa `muted`, com os mesmos pares termo/valor
 * do topo do detalhe da categoria.
 */
export function DadosDaInscricao({
    inscricao,
}: {
    inscricao: InscricaoAvaliada;
}) {
    return (
        <Animated.View entering={FadeIn.duration(150)} className="gap-4">
            <Dado termo="Entidade">{inscricao.entidade}</Dado>
            <View className="flex-row flex-wrap gap-x-6 gap-y-4">
                <Dado termo="Evento">{inscricao.evento}</Dado>
                <Dado termo="Modalidade">{inscricao.modalidade}</Dado>
                <Dado termo="Categoria">{inscricao.categoria}</Dado>
            </View>
        </Animated.View>
    );
}
