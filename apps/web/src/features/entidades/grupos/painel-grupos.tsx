"use client";

import { useVerticalScroll } from "~/shared/utils/use-vertical-scroll";
import { GradeGrupos } from "./grade-grupos";
import { useGradeGrupos } from "./use-grade-grupos";

/**
 * A grade de grupos da entidade: listar, paginar e criar.
 *
 * A formação de um grupo tem página própria — `grupos/[id]/page.tsx` —, e
 * `CartaoGrupo` já navega para lá sozinho. Sem "grupo aberto" para gerenciar,
 * esta tela ficou do tamanho de `PainelIntegrantes`: um hook e uma lista.
 */
export function PainelGrupos({ pageSize }: { pageSize: number }) {
    const painel = useGradeGrupos({ pageSize });
    const { triggerScrollRef } = useVerticalScroll({
        onScrollEnd: painel.carregarMais,
    });

    return (
        <GradeGrupos
            grupos={painel.grupos}
            total={painel.total}
            carregando={painel.carregando}
            erro={painel.erro}
            isFetchingNextPage={painel.isFetchingNextPage}
            sentinelaRef={triggerScrollRef}
            onCriar={painel.criarGrupo}
        />
    );
}
