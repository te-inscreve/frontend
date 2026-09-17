import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";

import type { GrupoComPrevia } from "@te-inscreve/schemas";

import { CartaoGrupo } from "~/features/entidades/grupos/cartao-grupo";
import { GRUPOS_NO_PAINEL } from "./lista-grupos-skeleton";

interface Props {
    /** Só os primeiros — o painel resume, não lista tudo. */
    grupos: GrupoComPrevia[];
    /** Quantos a entidade tem ao todo, para o rodapé dizer o que ficou de fora. */
    total: number;
}

/**
 * Os grupos da entidade, resumidos para o painel.
 *
 * Reaproveita o {@link CartaoGrupo} da grade — mesmo cartão, mesmo clique:
 * cada um já leva à página do grupo. O painel só recorta quantos mostrar; a
 * formação e a exclusão continuam sendo trabalho da tela de grupos.
 */
export function ListaGrupos({ grupos, total }: Props) {
    if (grupos.length === 0) {
        return (
            <p className="text-muted-foreground bg-card flex h-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-6 text-center text-sm">
                Nenhum grupo montado.
                <Link
                    href="/admin/minha-entidade/grupos"
                    className="text-primary font-medium hover:underline"
                >
                    Monte um grupo
                </Link>
                para inscrevê-lo nas modalidades coletivas de um evento.
            </p>
        );
    }

    // A grade é sempre 2×2 — mesmo com menos grupos, para não pular de
    // tamanho a cada exclusão. As células que sobram viram preenchimento.
    const vazias = Math.max(0, GRUPOS_NO_PAINEL - grupos.length);

    return (
        // A borda arredondada mora aqui, no contêiner — não em cada grupo.
        // `gap-px` sobre o fundo `bg-border` desenha a linha entre as células
        // dos dois lados (`bg-card` de cada `CartaoGrupo`), nas duas direções
        // ao mesmo tempo; não dá para fazer isso só com `divide-x`/`divide-y`
        // numa grade de duas colunas. O rodapé fecha o contêiner por baixo,
        // com a mesma borda de cima — a forma do rodapé de `ListaIntegrantes`.
        //
        // `h-full` na grade e `auto-rows-fr` nela dividem o espaço que sobra
        // entre as linhas de grupos, em vez de deixá-las na altura mínima do
        // conteúdo — a coluna de `ListaIntegrantes` ao lado costuma ter mais
        // linhas, e sem isso os cartões de grupos ficariam mais baixos e
        // esparsos que os de integrantes.
        <div className="bg-border flex h-full flex-col overflow-hidden rounded-xl border">
            <ul className="bg-border grid flex-1 auto-rows-fr gap-px sm:grid-cols-2">
                {grupos.map((grupo) => (
                    <li key={grupo.id} className="bg-card">
                        <CartaoGrupo grupo={grupo} variante="linha" />
                    </li>
                ))}

                {/* As células vazias usam o mesmo padrão do cartaz ausente de
                    um evento — ver `FallbackImage` —, para não parecer um
                    vão quebrado na grade. Só a partir do `sm`, onde a grade
                    vira duas colunas: no mobile, uma coluna só, cada grupo já
                    ocupa a largura inteira. */}
                {Array.from({ length: vazias }, (_, indice) => (
                    <li
                        key={indice}
                        aria-hidden="true"
                        className="bg-muted relative hidden overflow-hidden sm:block"
                    >
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                backgroundImage:
                                    "radial-gradient(rgb(0 0 0 / 0.1) 1px, transparent 1px)",
                                backgroundSize: "16px 16px",
                            }}
                        />
                    </li>
                ))}
            </ul>

            <div className="bg-card text-muted-foreground flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <span>
                    {total > grupos.length
                        ? `Mostrando ${grupos.length} de ${total}`
                        : `Mostrando ${total === 1 ? "o único" : `todos os ${total}`}`}
                </span>
                <Link
                    href="/admin/minha-entidade/grupos"
                    className="hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                >
                    Ver mais
                    <ArrowRightIcon aria-hidden="true" className="size-3" />
                </Link>
            </div>
        </div>
    );
}
