"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Controller } from "react-hook-form";

import { Input } from "@te-inscreve/components";

import type { FiltrosIntegrantesForm } from "./lib/use-filtros-integrantes";
import { DialogFiltros } from "./dialog-filtros";
import { temFiltroAtivo } from "./lib/filtros-integrantes";

interface Props {
    /** O recorte em uso — ver `useFiltrosIntegrantes`. */
    filtros: FiltrosIntegrantesForm;
    /** Quantos entraram no recorte — a resposta ao filtro, logo abaixo dele. */
    resultados: number;
    total: number;
    /**
     * O que ocupa a ponta direita da linha. É por onde entra o seletor de
     * visualização: ele divide a linha com o recorte, mas não é recorte, e
     * assim a barra continua sem saber em que visualização a listagem está.
     */
    acoes?: React.ReactNode;
}

/**
 * A barra de recorte da listagem: os controles numa linha, a contagem embaixo.
 *
 * Só a busca por nome fica exposta: é o filtro de todo dia, e o único em que
 * se digita. O resto — faixa de idade, matrícula vencida — mora no diálogo,
 * porque são escolhas pontuais que não valem o espaço permanente.
 *
 * A contagem fica debaixo da busca, e não fechando a linha à direita: ela é a
 * resposta ao que foi digitado, e se lê embaixo do campo em vez de na outra
 * ponta da tela. O lugar que ela deixou é das ações.
 *
 * Quem guarda o filtro é o formulário de quem lista (`useFiltrosIntegrantes`):
 * a busca escreve nele a cada tecla, o diálogo despeja nele o que foi
 * aplicado, e "Limpar filtros" o devolve ao vazio.
 */
export function BarraFiltros({ filtros, resultados, total, acoes }: Props) {
    const { form, valores } = filtros;
    const ativo = temFiltroAtivo(valores);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-nowrap items-center gap-2">
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
                                id="filtro-nome"
                                placeholder="Buscar por nome"
                                aria-label="Buscar por nome"
                                className="bg-card h-10 pl-9"
                                autoComplete="off"
                            />
                        )}
                    />
                </div>

                <DialogFiltros filtros={filtros} />

                {acoes && <div className="ml-auto">{acoes}</div>}
            </div>

            <p aria-live="polite" className="text-muted-foreground text-sm">
                {ativo
                    ? `${resultados} de ${total} integrantes`
                    : `${total} integrantes`}
            </p>
        </div>
    );
}
