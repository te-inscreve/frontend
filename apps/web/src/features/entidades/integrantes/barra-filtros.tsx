"use client";

import { CakeIcon } from "@phosphor-icons/react/dist/ssr/Cake";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import {
    Button,
    Field,
    FieldLabel,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import type { FuncaoIntegrante } from "~/features/entidades/shared/integrantes";
import { FUNCOES } from "~/features/entidades/shared/integrantes";
import { CampoPeriodo } from "~/features/eventos/form-evento/campo-periodo";
import { filtrosVazios, temFiltroAtivo } from "./filtros-integrantes";

interface Props {
    filtros: FiltrosIntegrantes;
    onChange: (filtros: FiltrosIntegrantes) => void;
    /** Quantos entraram no recorte — a resposta ao filtro, ao lado dele. */
    resultados: number;
    total: number;
}

/**
 * Os três recortes da listagem, na ordem em que se pensa neles: quem, nascido
 * quando, fazendo o quê.
 *
 * Controlado de ponta a ponta: quem guarda o filtro é o painel, que também
 * segura a refiltragem por um instante — assim o campo de nome responde a cada
 * tecla sem que a lista inteira seja recalculada junto.
 */
export function BarraFiltros({ filtros, onChange, resultados, total }: Props) {
    const limpar = () => onChange(filtrosVazios);

    const ativo = temFiltroAtivo(filtros);

    return (
        <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Field>
                    <FieldLabel htmlFor="filtro-nome">Nome</FieldLabel>
                    <div className="relative">
                        <MagnifyingGlassIcon
                            aria-hidden="true"
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        />
                        <Input
                            id="filtro-nome"
                            value={filtros.nome}
                            onChange={(evento) =>
                                onChange({
                                    ...filtros,
                                    nome: evento.target.value,
                                })
                            }
                            placeholder="Buscar por nome"
                            className="h-10 pl-9"
                            autoComplete="off"
                        />
                    </div>
                </Field>

                <Field>
                    <FieldLabel htmlFor="filtro-nascimento">
                        Nascimento
                    </FieldLabel>
                    <CampoPeriodo
                        id="filtro-nascimento"
                        icone={<CakeIcon />}
                        value={{
                            from: filtros.nascimentoDe ?? undefined,
                            to: filtros.nascimentoAte ?? undefined,
                        }}
                        onChange={({ from, to }) =>
                            onChange({
                                ...filtros,
                                nascimentoDe: from ?? null,
                                nascimentoAte: to ?? null,
                            })
                        }
                    />
                </Field>

                <Field>
                    <FieldLabel
                        htmlFor="filtro-funcao"
                        className="flex items-center"
                    >
                        Função
                        {/* O Select do Radix não aceita item de valor vazio,
                            então "todas as funções" não é uma opção da lista:
                            é voltar o filtro a nulo. */}
                        {filtros.funcao && (
                            <button
                                type="button"
                                onClick={() =>
                                    onChange({ ...filtros, funcao: null })
                                }
                                className="text-muted-foreground hover:text-foreground ml-auto text-xs font-normal underline underline-offset-2"
                            >
                                Todas
                            </button>
                        )}
                    </FieldLabel>
                    <Select
                        value={filtros.funcao ?? ""}
                        onValueChange={(valor) =>
                            onChange({
                                ...filtros,
                                funcao: valor as FuncaoIntegrante,
                            })
                        }
                    >
                        <SelectTrigger id="filtro-funcao" className="bg-card">
                            <SelectValue placeholder="Todas as funções" />
                        </SelectTrigger>
                        <SelectContent>
                            {FUNCOES.map(({ valor, rotulo }) => (
                                <SelectItem key={valor} value={valor}>
                                    {rotulo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p aria-live="polite" className="text-muted-foreground text-sm">
                    {ativo
                        ? `${resultados} de ${total} integrantes`
                        : `${total} integrantes`}
                </p>

                {ativo && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={limpar}
                    >
                        <XIcon aria-hidden="true" />
                        Limpar filtros
                    </Button>
                )}
            </div>
        </div>
    );
}
