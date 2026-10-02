"use client";

import type { Categoria, ModalidadeDetalhe } from "@te-inscreve/schemas";
import { cn } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

/*
 * As peças que o bilhete da inscrição em grupo e os bilhetes individuais
 * dividem: o que a categoria exige e os picotes.
 */

/**
 * O que a categoria exige de quem se inscreve: a faixa de idade, e — na
 * modalidade em grupo — quantos por grupo.
 *
 * A linha "Por grupo" só aparece quando a modalidade é em grupo: fora dela
 * os dois limites são nulos por definição, e "mín. Sem limite · máx. Sem
 * limite" diria nada. Dentro dela, `null` é "Sem limite" — o organizador
 * pode fixar só uma das pontas.
 *
 * Esqueletos enquanto categoria e modalidade não chegam: as duas leituras
 * são hidratadas do `prefetch` da página, então na prática só piscam na
 * primeira visita.
 */
export function RestricoesDaCategoria({
    categoria,
    modalidade,
}: {
    categoria: Categoria | null;
    modalidade: ModalidadeDetalhe | null;
}) {
    const semLimite = (valor: number | null) =>
        valor === null ? "Sem limite" : String(valor);

    return (
        <dl className="flex h-7 flex-wrap gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center justify-center gap-1">
                <dt className="text-muted-foreground">Idade:</dt>
                <dd className="text-foreground">
                    {categoria ? (
                        `${categoria.idadeMinima} a ${categoria.idadeMaxima} anos`
                    ) : (
                        <Skeleton className="h-3.5 w-20" />
                    )}
                </dd>
            </div>

            {modalidade === null ? (
                <div className="flex items-center gap-1">
                    <dt className="text-muted-foreground">Por grupo:</dt>
                    <dd className="text-muted-foreground font-semibold">
                        <Skeleton className="h-3.5 w-28" />
                    </dd>
                </div>
            ) : (
                modalidade.isGrupo && (
                    <div className="flex items-center gap-1">
                        <dt className="text-muted-foreground">Por grupo:</dt>
                        <dd className="text-foreground">
                            {semLimite(modalidade.minInscritosPorGrupo)} a{" "}
                            {semLimite(modalidade.maxInscritosPorGrupo)}{" "}
                            inscritos
                        </dd>
                    </div>
                )
            )}
        </dl>
    );
}

/**
 * O picote entre duas superfícies do bilhete: uma linha tracejada com um
 * semicírculo mordido em cada borda.
 *
 * `h-0` e `-translate-y-1/2` põem o picote exatamente sobre a linha em que
 * uma superfície acaba e a outra começa, sem ocupar altura. Os semicírculos
 * saem 1,5px para fora (`-translate-x-[1.5px]`) para cobrir a borda de 1px
 * da `section` — é isso que faz a mordida parecer cortada na borda, e não
 * desenhada por cima dela. Por isso a `section` não pode ter
 * `overflow-hidden`.
 */
export function RecorteDoTicket() {
    return (
        <div
            aria-hidden="true"
            className="relative flex h-0 shrink-0 items-center"
        >
            <Semicirculo className="absolute top-0 left-0 -translate-x-[1.5px] -translate-y-1/2" />
            <span className="border-border mx-3 flex-1 border-t border-dashed" />
            <Semicirculo className="absolute top-0 right-0 translate-x-[1.5px] -translate-y-1/2 rotate-180" />
        </div>
    );
}

/**
 * Meio disco mordido na borda esquerda; o da direita é o mesmo, girado.
 *
 * Dois caminhos: o disco cheio, sem traço, na cor do fundo da página
 * (`fill-background`) — é o "buraco" —, e o arco só de traço, na cor da
 * borda (`stroke-border`), que é a borda da `section` contornando a mordida.
 * Separados porque o lado reto do disco não pode ter traço: ele cairia fora
 * da borda, como um risco vertical.
 */
function Semicirculo({ className }: { className: string }) {
    return (
        <svg
            width="10"
            height="20"
            viewBox="0 0 10 20"
            className={cn("fill-background stroke-border", className)}
        >
            <path d="M0 0.5A9.5 9.5 0 0 1 0 19.5Z" stroke="none" />
            <path
                d="M0 0.5A9.5 9.5 0 0 1 0 19.5"
                fill="none"
                strokeWidth="1"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * O picote de pé, que separa o canhoto do bilhete individual: o mesmo
 * {@link RecorteDoTicket}, girado — tracejado vertical, mordida em cima e
 * embaixo.
 *
 * `w-0` e `self-stretch` o põem na linha entre as duas partes sem ocupar
 * largura. As mordidas saem 1,5px para fora da borda de cima e de baixo,
 * pelo mesmo motivo do picote deitado: quem o usa não pode ter
 * `overflow-hidden`, e a lista em volta precisa de folga vertical para a
 * mordida não ser cortada pela rolagem.
 */
export function PicoteVertical() {
    return (
        <div
            aria-hidden="true"
            className="relative flex w-0 shrink-0 self-stretch"
        >
            <SemicirculoDeTopo className="absolute top-0 left-0 -translate-x-1/2 -translate-y-[1.5px]" />
            <span className="border-border my-3 flex-1 border-l border-dashed" />
            <SemicirculoDeTopo className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-[1.5px] rotate-180" />
        </div>
    );
}

/** O {@link Semicirculo} deitado: meio disco mordido na borda de cima. */
function SemicirculoDeTopo({ className }: { className: string }) {
    return (
        <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            className={cn("fill-background stroke-border", className)}
        >
            <path d="M0.5 0A9.5 9.5 0 0 0 19.5 0Z" stroke="none" />
            <path
                d="M0.5 0A9.5 9.5 0 0 0 19.5 0"
                fill="none"
                strokeWidth="1"
                strokeLinejoin="round"
            />
        </svg>
    );
}
