"use client";

import {
    Controller,
    useFormContext,
    useFormState,
    useWatch,
} from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { OpcaoInsercao } from "./insercao";
import type {
    AgrupamentoForm,
    ModeloFichaFormValues,
    PosicaoForm,
} from "./lib/modelo-ficha-form-schema";
import { CartaoAgrupamento } from "./cartao-agrupamento";
import { useEditor } from "./editor-contexto";
import { EspacoDaFicha } from "./espaco-da-ficha";
import { mensagemDaLista } from "./lib/erro-lista";
import {
    novoAgrupamento,
    sequenciaDaFicha,
} from "./lib/modelo-ficha-form-schema";
import { ListaPosicoes } from "./lista-posicoes";

/** Um bloco do canvas: campos gerais seguidos, ou um agrupamento. */
type Bloco =
    | {
          tipo: "gerais";
          inicio: number;
          posicoes: PosicaoForm[];
          /** O índice do primeiro campo em `camposGerais`. */
          primeiro: number;
      }
    | {
          tipo: "agrupamento";
          inicio: number;
          agrupamento: AgrupamentoForm;
          indice: number;
      };

/**
 * A ficha em edição, ao centro: o nome do modelo como título e, por baixo, a
 * sequência da ficha — campos gerais e agrupamentos na ordem em que o
 * avaliador vai encontrá-los. Campos gerais seguidos formam uma grade; cada
 * agrupamento é um cartão.
 *
 * Depois de cada agrupamento — e antes do primeiro, quando a ficha começa por
 * um — fica um vão com o "+", que cria ali um campo geral ou um agrupamento.
 */
export function CanvasModeloFicha() {
    const { control } = useFormContext<ModeloFichaFormValues>();
    const { errors } = useFormState<ModeloFichaFormValues>();
    const { composicao } = useEditor();
    const [camposGerais, agrupamentos] = useWatch({
        control,
        name: ["camposGerais", "agrupamentos"],
    });

    const blocos = blocosDaSequencia(camposGerais, agrupamentos);
    const erroComposicao = mensagemDaLista(errors, "camposGerais");

    function agrupamentoEm(indice: number): OpcaoInsercao {
        return {
            rotulo: "Criar agrupamento",
            aoEscolher: () =>
                composicao.inserirAgrupamento(novoAgrupamento(), indice),
        };
    }

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

            <div className="flex flex-col gap-4">
                {blocos.length === 0 && (
                    <TrechoGerais
                        inicio={0}
                        primeiro={0}
                        posicoes={[]}
                        opcoesFinais={[agrupamentoEm(0)]}
                    />
                )}

                {blocos[0]?.tipo === "agrupamento" && (
                    <EspacoDaFicha indice={0} descricao="no início da ficha" />
                )}

                {blocos.map((bloco, posicaoBloco) => {
                    if (bloco.tipo === "gerais") {
                        return (
                            <TrechoGerais
                                key={`gerais-${bloco.posicoes[0]?.chave}`}
                                inicio={bloco.inicio}
                                primeiro={bloco.primeiro}
                                posicoes={bloco.posicoes}
                                opcoesFinais={[
                                    agrupamentoEm(
                                        bloco.inicio + bloco.posicoes.length,
                                    ),
                                ]}
                            />
                        );
                    }

                    const { agrupamento, indice } = bloco;
                    const rotulo =
                        agrupamento.nome.trim() || `Agrupamento ${indice + 1}`;
                    return (
                        <div
                            key={agrupamento.chave}
                            className="flex flex-col gap-4"
                        >
                            <CartaoAgrupamento
                                agrupamento={agrupamento}
                                indice={indice}
                            />
                            <EspacoDaFicha
                                indice={bloco.inicio + 1}
                                descricao={`depois do agrupamento ${rotulo}`}
                                sempreVisivel={
                                    posicaoBloco === blocos.length - 1
                                }
                            />
                        </div>
                    );
                })}

                {erroComposicao && (
                    <p role="alert" className="text-destructive text-sm">
                        {erroComposicao}
                    </p>
                )}
            </div>
        </div>
    );
}

/** Campos gerais seguidos, entre agrupamentos ou nas pontas da ficha. */
function TrechoGerais({
    inicio,
    primeiro,
    posicoes,
    opcoesFinais,
}: {
    inicio: number;
    primeiro: number;
    posicoes: PosicaoForm[];
    opcoesFinais: OpcaoInsercao[];
}) {
    const tituloId = `campos-gerais-titulo-${inicio}`;
    return (
        <section aria-labelledby={tituloId}>
            <h2
                id={tituloId}
                className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase"
            >
                Campos gerais
            </h2>
            <ListaPosicoes
                recipiente={{ gerais: inicio }}
                posicoes={posicoes}
                caminhoDaPosicao={(indice) =>
                    `camposGerais.${primeiro + indice}`
                }
                rotulo="campos gerais"
                opcoesFinais={opcoesFinais}
                vazia={
                    <p>
                        Arraste um campo global para começar, ou crie um campo
                        exclusivo deste modelo.
                    </p>
                }
            />
        </section>
    );
}

/**
 * Agrupa a sequência da ficha em blocos: os campos gerais seguidos num trecho
 * só, cada agrupamento no seu. `inicio` é o lugar do bloco na sequência;
 * `primeiro` e `indice`, os do trecho e do agrupamento nas listas do
 * formulário.
 */
function blocosDaSequencia(
    camposGerais: PosicaoForm[],
    agrupamentos: AgrupamentoForm[],
): Bloco[] {
    const blocos: Bloco[] = [];
    let indiceAgrupamento = 0;
    let indiceGeral = 0;

    sequenciaDaFicha({ camposGerais, agrupamentos }).forEach((item, inicio) => {
        if (item.tipo === "agrupamento") {
            blocos.push({
                tipo: "agrupamento",
                inicio,
                agrupamento: item.agrupamento,
                indice: indiceAgrupamento,
            });
            indiceAgrupamento += 1;
            return;
        }
        const ultimo = blocos.at(-1);
        if (ultimo?.tipo === "gerais") ultimo.posicoes.push(item.posicao);
        else {
            blocos.push({
                tipo: "gerais",
                inicio,
                posicoes: [item.posicao],
                primeiro: indiceGeral,
            });
        }
        indiceGeral += 1;
    });

    return blocos;
}
