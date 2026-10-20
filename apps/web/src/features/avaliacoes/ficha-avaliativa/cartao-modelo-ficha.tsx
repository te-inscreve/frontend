import type { ReactNode } from "react";
import Link from "next/link";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { GlobeSimpleIcon } from "@phosphor-icons/react/dist/ssr/GlobeSimple";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";

import type { ModeloFichaResumo } from "@te-inscreve/schemas";
import { cn, Separator } from "@te-inscreve/components";

import { useResumirPreviaFicha } from "./lib/use-resumir-previa-ficha";

/**
 * Um modelo de ficha na grade: a folha presa na prancheta do jurado, com o
 * começo do que ele vai preencher.
 *
 * O agrupamento é a única cor dentro da folha — faixa verde com o nome e a
 * quantidade de repetições —, para que dê para achar, de relance, os modelos
 * que repetem campos. Quando há agrupamento, os campos gerais cedem espaço
 * para que o bloco repetido nunca fique de fora. Só o primeiro agrupamento é
 * desenhado; o que não coube — campos gerais, campos do agrupamento e os
 * demais agrupamentos — vira uma contagem logo depois do trecho cortado.
 *
 * Global é o modelo da plataforma, compartilhado por todas as entidades e que
 * ninguém altera; fora dele, o rodapé avisa quando o modelo não é editável.
 *
 * Sem `onSelecionar`, a prancheta é um link para o detalhe do modelo. Com ele,
 * a prancheta inteira vira o alvo do clique: um botão esticado por cima dela,
 * e não um botão em volta — `button` só aceita conteúdo de frase, e a folha
 * tem listas. Aí a prancheta deixa de ser link: o clique do botão subiria até
 * o `<a>` e levaria ao detalhe, tirando a pessoa do seletor no meio do
 * vínculo. Fora de uma grade, `as="div"`.
 */
export function CartaoModeloFicha({
    modelo,
    as: Raiz = "li",
    onSelecionar,
    selecionando = false,
    desabilitado = false,
}: {
    modelo: ModeloFichaResumo;
    as?: "li" | "div";
    onSelecionar?: () => void;
    selecionando?: boolean;
    desabilitado?: boolean;
}) {
    const {
        campos,
        agrupamento,
        agrupamentosOcultos,
        camposOcultos,
        camposAgrupadosOcultos,
    } = useResumirPreviaFicha({
        previa: modelo.previa,
    });
    const href = `/admin/fichas-avaliativas/${modelo.id}?v=${modelo.versao}`;

    return (
        // O respiro no topo é do prendedor, que sobe acima da prancheta: sem
        // ele, um contêiner com rolagem corta a primeira linha da grade.
        <Raiz className="group pt-2.5">
            <Prancheta
                href={onSelecionar ? undefined : href}
                className={cn(
                    "bg-muted/60 relative flex aspect-3/4 origin-top flex-col rounded-lg border p-1.5 transition",
                    onSelecionar &&
                        "group-has-focus-visible:ring-ring/50 group-has-focus-visible:border-ring group-has-focus-visible:ring-[3px]",
                    !desabilitado &&
                        "group-hover:border-primary/40 group-hover:shadow-sm motion-safe:group-hover:rotate-2",
                    desabilitado && !selecionando && "opacity-60",
                )}
            >
                <Prendedor />

                <div className="bg-card flex flex-1 flex-col gap-2 overflow-hidden rounded-sm p-2.5 shadow-xs">
                    {/* Com nomes de duas linhas, o que cabe depende da largura
                        do cartão: o que passa da folha é cortado com um
                        esmaecido — a folha continua —, contagens incluídas.
                        Sem corte, o esmaecido cai no espaço vazio do fim. */}
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden mask-b-from-[calc(100%-1rem)]">
                        <span className="line-clamp-2 shrink-0 text-sm leading-tight font-semibold">
                            {modelo.nome}
                        </span>

                        <ListaCampos campos={campos} />
                        <Contagem
                            quantidade={camposOcultos}
                            singular="campo"
                            plural="campos"
                        />
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
                                <Contagem
                                    quantidade={camposAgrupadosOcultos}
                                    singular="campo"
                                    plural="campos"
                                />
                            </div>
                        )}
                        <Contagem
                            quantidade={agrupamentosOcultos}
                            singular="agrupamento"
                            plural="agrupamentos"
                        />
                    </div>
                </div>

                <div className="text-muted-foreground flex gap-2.5 px-1 pt-1.5 text-[10px]">
                    {modelo.global ? (
                        <span className="flex items-center gap-1">
                            <GlobeSimpleIcon
                                aria-hidden="true"
                                className="size-3"
                            />
                            Global
                        </span>
                    ) : (
                        !modelo.editavel && (
                            <span className="flex items-center gap-1">
                                <LockSimpleIcon
                                    aria-hidden="true"
                                    className="size-3"
                                />
                                Somente leitura
                            </span>
                        )
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0 text-[11px] tabular-nums">
                        v{modelo.versao}
                    </span>
                </div>

                {selecionando && (
                    <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-lg">
                        <CircleNotchIcon
                            aria-hidden="true"
                            className="text-primary size-6 animate-spin"
                        />
                    </div>
                )}

                {onSelecionar && (
                    <button
                        type="button"
                        onClick={onSelecionar}
                        disabled={desabilitado}
                        aria-busy={selecionando}
                        aria-label={`Selecionar ${modelo.nome}, versão ${modelo.versao}`}
                        className="absolute inset-0 cursor-pointer rounded-lg outline-none disabled:cursor-default"
                    />
                )}
            </Prancheta>
        </Raiz>
    );
}

/** Link para o detalhe, ou `div` quando um botão por cima cuida do clique. */
function Prancheta({
    href,
    className,
    children,
}: {
    href?: string;
    className: string;
    children: ReactNode;
}) {
    if (!href) return <div className={className}>{children}</div>;
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

/**
 * O prendedor da prancheta, como no ícone: base larga montada na borda e
 * a alça mais estreita por cima, com o furo por onde se pendura.
 */
export function Prendedor() {
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

/** O que não coube na folha, entre fios: "+3 campos". */
function Contagem({
    quantidade,
    singular,
    plural,
}: {
    quantidade: number;
    singular: string;
    plural: string;
}) {
    if (quantidade <= 0) return null;

    return (
        <div className="flex items-center gap-1.5">
            <Separator className="flex-1" />
            <span className="text-muted-foreground/70 shrink-0 text-[10px]">
                +{quantidade} {quantidade === 1 ? singular : plural}
            </span>
            <Separator className="flex-1" />
        </div>
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
