"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { Button, Input } from "@te-inscreve/components";

import type { FiltrosGrupos } from "./filtros-grupos";
import { DialogFiltrosGrupos } from "./dialog-filtros-grupos";
import { filtrosGruposVazios, temFiltroGrupoAtivo } from "./filtros-grupos";

interface Props {
    filtros: FiltrosGrupos;
    onChange: (filtros: FiltrosGrupos) => void;
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
export function BarraFiltrosGrupos({
    filtros,
    onChange,
    resultados,
    total,
}: Props) {
    const ativo = temFiltroGrupoAtivo(filtros);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1 sm:max-w-xs">
                    <MagnifyingGlassIcon
                        aria-hidden="true"
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Input
                        id="filtro-nome-grupos"
                        value={filtros.nome}
                        onChange={(evento) =>
                            onChange({ ...filtros, nome: evento.target.value })
                        }
                        placeholder="Buscar por nome"
                        aria-label="Buscar grupo por nome"
                        className="bg-card h-10 pl-9"
                        autoComplete="off"
                    />
                </div>

                <DialogFiltrosGrupos filtros={filtros} onChange={onChange} />

                {ativo && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange(filtrosGruposVazios)}
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
