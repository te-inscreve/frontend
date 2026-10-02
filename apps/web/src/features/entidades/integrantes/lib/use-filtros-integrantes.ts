"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { FiltrosIntegrantes } from "./filtros-integrantes-schema";
import { filtrosVazios } from "./filtros-integrantes";
import { filtrosIntegrantesSchema } from "./filtros-integrantes-schema";

/**
 * O formulário do recorte de integrantes, e os valores dele já prontos para
 * {@link filtrarIntegrantes}.
 *
 * O formulário guarda o recorte *em uso*: a busca por nome escreve nele a
 * cada tecla, e o diálogo de filtros, que trabalha num rascunho próprio,
 * despeja nele o que foi aplicado. Quem lista só lê `valores`.
 *
 * `inicial` é o ponto de partida que depende de dado do servidor — a faixa de
 * idade da categoria, na inscrição. Vai no `values` do `useForm`, que o
 * aplica quando chega (e se mudar de conteúdo) sem efeito nenhum aqui; depois
 * que alguém mexe, o recorte é de quem mexeu. Sem ele, parte do vazio.
 */
export function useFiltrosIntegrantes(inicial?: FiltrosIntegrantes) {
    const form = useForm<FiltrosIntegrantes>({
        resolver: zodResolver(filtrosIntegrantesSchema),
        defaultValues: filtrosVazios,
        values: inicial,
    });

    const [nome, idadeMinima, idadeMaxima, somenteVencidas] = useWatch({
        control: form.control,
        name: ["nome", "idadeMinima", "idadeMaxima", "somenteVencidas"],
    });
    const valores = useMemo<FiltrosIntegrantes>(
        () => ({ nome, idadeMinima, idadeMaxima, somenteVencidas }),
        [nome, idadeMinima, idadeMaxima, somenteVencidas],
    );

    return { form, valores };
}

/** O recorte que desce da tela para a barra: o formulário e os valores dele. */
export type FiltrosIntegrantesForm = ReturnType<typeof useFiltrosIntegrantes>;
