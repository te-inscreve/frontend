"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { FiltrosGrupos } from "./filtros-grupos-schema";
import { filtrosGruposVazios } from "./filtros-grupos";
import { filtrosGruposSchema } from "./filtros-grupos-schema";

/**
 * O formulário do recorte de grupos e os valores dele prontos para
 * {@link filtrarGrupos} — o par de `useFiltrosIntegrantes`, pelos mesmos
 * motivos anotados lá.
 */
export function useFiltrosGrupos() {
    const form = useForm<FiltrosGrupos>({
        resolver: zodResolver(filtrosGruposSchema),
        defaultValues: filtrosGruposVazios,
    });

    const [nome, somenteComPendencia] = useWatch({
        control: form.control,
        name: ["nome", "somenteComPendencia"],
    });
    const valores = useMemo<FiltrosGrupos>(
        () => ({ nome, somenteComPendencia }),
        [nome, somenteComPendencia],
    );

    return { form, valores };
}

/** O recorte que desce da tela para a barra: o formulário e os valores dele. */
export type FiltrosGruposForm = ReturnType<typeof useFiltrosGrupos>;
