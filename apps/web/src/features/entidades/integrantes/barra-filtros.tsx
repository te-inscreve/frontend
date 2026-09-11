"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { Button, Input } from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import { DialogFiltros } from "./dialog-filtros";
import { filtrosVazios, temFiltroAtivo } from "./filtros-integrantes";

interface Props {
    filtros: FiltrosIntegrantes;
    onChange: (filtros: FiltrosIntegrantes) => void;
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
 * Controlada de ponta a ponta: quem guarda o filtro é o painel, que também
 * segura a refiltragem por um instante — assim o campo de nome responde a cada
 * tecla sem que a lista inteira seja recalculada junto.
 */
export function BarraFiltros({
    filtros,
    onChange,
    resultados,
    total,
    acoes,
}: Props) {
    const ativo = temFiltroAtivo(filtros);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1 sm:max-w-xs">
                    <MagnifyingGlassIcon
                        aria-hidden="true"
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Input
                        id="filtro-nome"
                        value={filtros.nome}
                        onChange={(evento) =>
                            onChange({ ...filtros, nome: evento.target.value })
                        }
                        placeholder="Buscar por nome"
                        aria-label="Buscar por nome"
                        className="bg-card h-10 pl-9"
                        autoComplete="off"
                    />
                </div>

                <DialogFiltros filtros={filtros} onChange={onChange} />

                {ativo && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange(filtrosVazios)}
                    >
                        <XIcon aria-hidden="true" />
                        Limpar filtros
                    </Button>
                )}

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
