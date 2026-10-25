import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import type { OrigemDaFicha } from "./rota-ficha-inscricao";
import { rotaDetalheCategoria } from "~/features/categorias/lib/rota-detalhe-categoria";
import { categoriasProntasQuery } from "~/features/categorias/lib/use-categorias-prontas";
import { queryClient } from "~/utils/api";

/**
 * As saídas da ficha, que não seguem só a pilha: a ficha vive na pilha de
 * Categorias, mas se abre também da lista de avaliações e da dock.
 *
 * - **voltar** (o "Voltar" e o voltar do sistema) leva para onde a ficha foi
 *   aberta. Das inscrições da categoria, volta a elas. Da lista de
 *   avaliações (`origem`), volta à lista, e a ficha sai antes da pilha de
 *   Categorias, para a aba não reabrir nela. Sem tela atrás (o app
 *   recarregou com a ficha aberta), vai às inscrições;
 * - **concluir** (depois de salvar) leva às inscrições da categoria, para o
 *   avaliador seguir para a próxima. Se a categoria já está na pilha, volta
 *   até ela; se não, ela entra no lugar da ficha.
 */
export function useSaidasDaFicha(categoriaId: number, origem?: OrigemDaFicha) {
    const router = useRouter();

    const concluir = useCallback(async () => {
        // O detalhe se monta pelos parâmetros, que só a lista de categorias
        // tem. Fora dela (offline, ou a categoria saiu da lista), a lista.
        const categoria = await queryClient
            .ensureQueryData(categoriasProntasQuery)
            .then((lista) => lista.find(({ id }) => id === categoriaId))
            .catch(() => undefined);
        router.dismissTo(
            categoria ? rotaDetalheCategoria(categoria) : "/categorias",
        );
    }, [router, categoriaId]);

    const voltar = useCallback(() => {
        if (origem === "avaliacoes") {
            if (router.canDismiss()) router.dismiss();
            else router.replace("/categorias");
            router.navigate("/avaliacoes");
        } else if (router.canDismiss()) router.dismiss();
        else void concluir();
    }, [router, origem, concluir]);

    return { voltar, concluir };
}

/**
 * Faz o voltar do sistema (botão ou gesto) seguir {@link useSaidasDaFicha}
 * enquanto a tela está em foco. A folha de edição, um `Modal`, trata o
 * voltar antes, então fecha a folha e não sai da ficha.
 */
export function useVoltarDoSistema(voltar: () => void) {
    useFocusEffect(
        useCallback(() => {
            const inscricao = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    voltar();
                    return true;
                },
            );
            return () => inscricao.remove();
        }, [voltar]),
    );
}
