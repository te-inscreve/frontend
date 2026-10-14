"use client";

import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    Controller,
    useFormContext,
    useFormState,
    useWatch,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { OpcaoInsercao } from "./insercao";
import type { ModeloFichaFormValues } from "./lib/modelo-ficha-form-schema";
import { CartaoAgrupamento } from "./cartao-agrupamento";
import { useEditor } from "./editor-contexto";
import { Insercao } from "./insercao";
import { mensagemDaLista } from "./lib/erro-lista";
import { novoAgrupamento } from "./lib/modelo-ficha-form-schema";
import { ListaPosicoes } from "./lista-posicoes";

/**
 * A ficha em edição, ao centro: o nome do modelo como título, os campos gerais
 * e, depois deles, os agrupamentos.
 *
 * Agrupamento só entra depois do último campo geral: o backend numera campos
 * gerais e agrupamentos à parte e não guarda a ordem entre eles (ver
 * `docs/planos/modelo-ficha-backend.md`).
 */
export function CanvasModeloFicha() {
    const { control } = useFormContext<ModeloFichaFormValues>();
    const { errors } = useFormState<ModeloFichaFormValues>();
    const { composicao } = useEditor();
    const camposGerais = useWatch({ control, name: "camposGerais" });
    const agrupamentos = useWatch({ control, name: "agrupamentos" });

    const adicionarAgrupamento: OpcaoInsercao = {
        rotulo: "Criar agrupamento",
        aoEscolher: () => composicao.inserirAgrupamento(novoAgrupamento()),
    };
    const erroComposicao = mensagemDaLista(errors, "camposGerais");

    return (
        <div className="flex flex-col gap-6">
            <Controller
                control={control}
                name="nome"
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="modelo-nome" className="sr-only">
                            Nome do modelo
                        </FieldLabel>
                        <input
                            {...field}
                            id="modelo-nome"
                            placeholder="Modelo sem nome"
                            autoComplete="off"
                            aria-invalid={fieldState.invalid}
                            className={cn(
                                "placeholder:text-muted-foreground/60 focus-visible:border-ring w-full border-b border-transparent bg-transparent pb-1 text-3xl font-extrabold tracking-tight outline-none",
                                fieldState.invalid && "border-destructive",
                            )}
                        />
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                )}
            />

            <section aria-labelledby="campos-gerais-titulo">
                <h2
                    id="campos-gerais-titulo"
                    className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase"
                >
                    Campos gerais
                </h2>
                <ListaPosicoes
                    recipiente="gerais"
                    posicoes={camposGerais}
                    caminho="camposGerais"
                    rotulo="campos gerais"
                    opcoesFinais={
                        agrupamentos.length === 0 ? [adicionarAgrupamento] : []
                    }
                    vazia={
                        <p>
                            Arraste um campo global para começar, ou crie um
                            campo exclusivo deste modelo.
                        </p>
                    }
                />
                {erroComposicao && (
                    <p role="alert" className="text-destructive mt-2 text-sm">
                        {erroComposicao}
                    </p>
                )}
            </section>

            {agrupamentos.length > 0 && (
                <section
                    aria-label="Agrupamentos"
                    className="flex flex-col gap-4"
                >
                    <SortableContext
                        items={agrupamentos.map(
                            (agrupamento) => agrupamento.chave,
                        )}
                        strategy={verticalListSortingStrategy}
                    >
                        {agrupamentos.map((agrupamento, indice) => (
                            <CartaoAgrupamento
                                key={agrupamento.chave}
                                agrupamento={agrupamento}
                                indice={indice}
                            />
                        ))}
                    </SortableContext>
                    <Insercao
                        sempreVisivel
                        descricao="depois do último agrupamento"
                        opcoes={[adicionarAgrupamento]}
                    />
                </section>
            )}
        </div>
    );
}
