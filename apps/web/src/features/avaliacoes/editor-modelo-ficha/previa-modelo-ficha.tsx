"use client";

import { useWatch } from "react-hook-form";

import type { ModeloFichaFormValues } from "./lib/modelo-ficha-form-schema";
import { ControleCampo } from "./controle-campo";
import { useEditor } from "./editor-contexto";
import { campoDaPosicao } from "./posicao-editavel";

/**
 * A ficha como o jurado a encontra: os campos gerais e cada agrupamento
 * repetido `quantidade` vezes, numa lista só. Os controles respondem, mas o
 * que se preenche aqui não é guardado.
 */
export function PreviaModeloFicha() {
    const { camposGlobais } = useEditor();
    const [nome, camposGerais, agrupamentos] = useWatch<
        ModeloFichaFormValues,
        ["nome", "camposGerais", "agrupamentos"]
    >({ name: ["nome", "camposGerais", "agrupamentos"] });

    const vazia =
        camposGerais.length === 0 &&
        agrupamentos.every((agrupamento) => agrupamento.campos.length === 0);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-extrabold tracking-tight">
                {nome.trim() || "Modelo sem nome"}
            </h1>

            {vazia && (
                <p className="text-muted-foreground text-sm">
                    A ficha ainda não tem campos. Volte à edição para montá-la.
                </p>
            )}

            {camposGerais.map((posicao) => {
                const campo = campoDaPosicao(posicao, camposGlobais);
                return (
                    campo && (
                        <ControleCampo
                            key={posicao.chave}
                            campo={campo}
                            id={`previa-${posicao.chave}`}
                        />
                    )
                );
            })}

            {agrupamentos.flatMap((agrupamento, indiceAgrupamento) =>
                Array.from(
                    { length: Math.max(agrupamento.quantidade, 1) },
                    (_, volta) => (
                        <section
                            key={`${agrupamento.chave}-${volta}`}
                            aria-labelledby={`previa-${agrupamento.chave}-${volta}`}
                            className="flex flex-col gap-6"
                        >
                            <h2
                                id={`previa-${agrupamento.chave}-${volta}`}
                                className="text-muted-foreground border-b pb-1 text-xs font-semibold tracking-wide uppercase"
                            >
                                {agrupamento.nome.trim() ||
                                    `Agrupamento ${indiceAgrupamento + 1}`}{" "}
                                {volta + 1}
                            </h2>
                            {agrupamento.campos.map((posicao) => {
                                const campo = campoDaPosicao(
                                    posicao,
                                    camposGlobais,
                                );
                                return (
                                    campo && (
                                        <ControleCampo
                                            key={posicao.chave}
                                            campo={campo}
                                            id={`previa-${posicao.chave}-${volta}`}
                                        />
                                    )
                                );
                            })}
                        </section>
                    ),
                ),
            )}
        </div>
    );
}
