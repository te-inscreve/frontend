import { GlobeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";

import type { ModeloFichaResumo } from "@te-inscreve/schemas";
import { Separator } from "@te-inscreve/components";

import { useResumirPreviaFicha } from "./lib/use-resumir-previa-ficha";

/**
 * Um modelo de ficha na grade: a folha presa na prancheta do jurado, com o
 * começo do que ele vai preencher.
 *
 * O agrupamento é a única cor dentro da folha — faixa verde com o nome e a
 * quantidade de repetições —, para que dê para achar, de relance, os modelos
 * que repetem campos. Quando há agrupamento, os campos gerais cedem espaço:
 * a folha mostra um só, e o bloco repetido nunca fica de fora. Só o primeiro
 * agrupamento é desenhado; os demais entram na contagem do rodapé.
 *
 * Os totais da prévia, quando vêm, valem mais que as listas: o backend pode
 * mandá-las cortadas. Sem eles, as listas são o modelo inteiro.
 */
export function CartaoModeloFicha({
    modelo,
}: {
    modelo: Pick<
        ModeloFichaResumo,
        "nome" | "versao" | "global" | "editavel" | "previa"
    >;
}) {
    const { campos, agrupamento, agrupamentosOcultos, camposOcultos } =
        useResumirPreviaFicha({
            previa: modelo.previa,
        });
    return (
        // O respiro no topo é do prendedor, que sobe acima da prancheta: sem
        // ele, um contêiner com rolagem corta a primeira linha da grade.
        <li className="group pt-2.5">
            <div className="bg-muted/60 group-hover:border-primary/40 relative flex aspect-3/4 origin-top flex-col rounded-lg border p-1.5 transition group-hover:shadow-sm hover:cursor-pointer motion-safe:group-hover:rotate-2">
                <Prendedor />

                <div className="bg-card flex flex-1 flex-col gap-2 overflow-hidden rounded-sm p-2.5 shadow-xs">
                    {/* Quem cede altura é a prévia, não a contagem: com nomes de
                        duas linhas, o que cabe depende da largura do cartão, e
                        a lista é cortada com um esmaecido — a folha continua —
                        enquanto o "+N campos" fica à vista. Sem corte, o
                        esmaecido cai no espaço vazio do fim da folha. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden mask-b-from-[calc(100%-1rem)]">
                        <span className="line-clamp-2 text-sm leading-tight font-semibold">
                            {modelo.nome}
                        </span>

                        <ListaCampos campos={campos} />
                        {camposOcultos > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Separator className="flex-1" />
                                <span className="text-muted-foreground/70 shrink-0 text-[10px]">
                                    +{camposOcultos}{" "}
                                    {camposOcultos === 1 ? "campo" : "campos"}
                                </span>
                                <Separator className="flex-1" />
                            </div>
                        )}
                        {agrupamento && (
                            <div className="bg-primary-foreground flex flex-col gap-1.5 rounded-[3px] px-2 pb-1.5">
                                <div className="bg-primary text-primary-foreground -mx-2 flex items-center gap-1 rounded-[3px] px-2 text-[10px] font-semibold">
                                    <span className="truncate">
                                        {agrupamento.nome}
                                    </span>
                                    <span className="ml-auto tabular-nums">
                                        <span className="sr-only">repete </span>
                                        ×{agrupamento.quantidade}
                                    </span>
                                </div>
                                <ListaCampos campos={agrupamento.campos} />
                            </div>
                        )}
                        {agrupamentosOcultos > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Separator className="flex-1" />
                                <span className="text-muted-foreground/70 shrink-0 text-[10px]">
                                    +{agrupamentosOcultos}{" "}
                                    {agrupamentosOcultos === 1
                                        ? "agrupamento"
                                        : "agrupamentos"}
                                </span>
                                <Separator className="flex-1" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-muted-foreground flex gap-2.5 px-1 pt-1.5 text-[10px]">
                    {!modelo.global && (
                        <span className="flex items-center gap-1">
                            <GlobeSimpleIcon
                                aria-hidden="true"
                                className="size-3"
                            />
                            <LockSimpleIcon
                                aria-hidden="true"
                                className="size-3"
                            />
                            Somente leitura
                        </span>
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0 text-[11px] tabular-nums">
                        v{modelo.versao}
                    </span>
                </div>
            </div>
        </li>
    );
}

/**
 * O prendedor da prancheta, como no ícone: base larga montada na borda e
 * a alça mais estreita por cima, com o furo por onde se pendura.
 */
function Prendedor() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 64 16"
            className="fill-primary absolute -top-2.5 left-1/2 h-4 w-16 -translate-x-1/2 drop-shadow-xs"
        >
            <path
                fillRule="evenodd"
                d="M0 9Q0 6 3 6H15Q17.5 6 18.2 3.4Q19 0 22.5 0H41.5Q45 0 45.8 3.4Q46.5 6 49 6H61Q64 6 64 9V13Q64 16 61 16H3Q0 16 0 13ZM28.5 3.5Q27 3.5 27 5Q27 6.5 28.5 6.5H35.5Q37 6.5 37 5Q37 3.5 35.5 3.5Z"
            />
        </svg>
    );
}

/**
 * Os campos como linhas a preencher: o nome, em até duas linhas, e o
 * pontilhado até a margem. A prévia não diz o tipo, então a linha é a mesma
 * para todos.
 */
function ListaCampos({ campos }: { campos: string[] }) {
    return (
        <ul className="text-muted-foreground flex flex-col gap-1.5 text-[11px] leading-tight">
            {campos.map((campo, indice) => (
                // O mesmo campo global pode ocupar duas posições: o nome não
                // é chave.
                <li key={indice} className="flex items-end gap-2">
                    <span className="line-clamp-2 min-w-0 break-words">
                        {campo}
                    </span>
                    <span
                        aria-hidden="true"
                        className="border-foreground/15 mb-0.5 min-w-4 flex-1 border-b border-dotted"
                    />
                </li>
            ))}
        </ul>
    );
}
