"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { Controller } from "react-hook-form";

import { Button, Input } from "@te-inscreve/components";

import type { FiltrosGruposForm } from "./use-filtros-grupos";
import { DialogFiltrosGrupos } from "./dialog-filtros-grupos";
import { filtrosGruposVazios, temFiltroGrupoAtivo } from "./filtros-grupos";

interface Props {
    /** O recorte em uso — ver `useFiltrosGrupos`. */
    filtros: FiltrosGruposForm;
    /** Quantos entraram no recorte — a resposta ao filtro, logo abaixo dele. */
    resultados: number;
    total: number;
}

/**
 * A barra de recorte da lista de grupos: os controles numa linha, a contagem
 * embaixo — o mesmo desenho de `BarraFiltros`, dos integrantes, para as duas
 * abas da inscrição se lerem como a mesma barra trocando de assunto.
 *
 * Os ids são próprios (`filtro-nome-grupos`) porque a barra de integrantes
 * mora na outra aba da mesma tela: só uma está montada por vez, mas ids
 * iguais num mesmo documento continuam sendo ids iguais.
 */
export function BarraFiltrosGrupos({ filtros, resultados, total }: Props) {
    const { form, valores } = filtros;
    const ativo = temFiltroGrupoAtivo(valores);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1 sm:max-w-xs">
                    <MagnifyingGlassIcon
                        aria-hidden="true"
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Controller
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="filtro-nome-grupos"
                                placeholder="Buscar por nome"
                                aria-label="Buscar grupo por nome"
                                className="bg-card h-10 pl-9"
                                autoComplete="off"
                            />
                        )}
                    />
                </div>

                <DialogFiltrosGrupos filtros={filtros} />

                {ativo && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => form.reset(filtrosGruposVazios)}
                    >
                        <XIcon aria-hidden="true" />
                        Limpar filtros
                    </Button>
                )}
            </div>

            <p aria-live="polite" className="text-muted-foreground text-sm">
                {ativo
                    ? `${resultados} de ${contagemGrupos(total)}`
                    : contagemGrupos(total)}
            </p>
        </div>
    );
}

/** "1 grupo" / "N grupos". */
function contagemGrupos(total: number): string {
    return total === 1 ? "1 grupo" : `${total} grupos`;
}
