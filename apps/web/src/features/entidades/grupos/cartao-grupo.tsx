import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { Badge } from "@te-inscreve/components";
import { cn } from "@te-inscreve/components/utils";

import type { GrupoComPrevia } from "./grupo";
import { AvataresGrupo } from "./avatares-grupo";
import { formatarDataCriacao } from "./grupo";

/**
 * Um grupo como cartão — o mesmo em dois lugares: a grade de
 * `/admin/minha-entidade/grupos` e o preview do painel da entidade.
 *
 * O cartão inteiro é um link para a página do grupo
 * (`grupos/[id]`), onde mora a bancada de montar a formação. Sem
 * `"use client"`: é `Link` puro, então o preview do painel — que é Server
 * Component — pode montá-lo sem custo de JS extra.
 *
 * Não é o `<li>` da lista — devolve só o link. Quem chama decide o elemento:
 * a grade embrulha num `motion.li` para o cartão crescer no lugar quando
 * aparece (ver `grade-grupos.tsx`), e o preview do painel, num `<li>` comum.
 *
 * Mostra o que decide em qual grupo entrar: o nome, para que ele serve, o
 * tamanho da formação e o aviso de matrícula vencida, que é o que trava a
 * inscrição. A data de criação vai por último, miúda: serve para distinguir dois
 * grupos de nome parecido, e não para comparar grupos entre si.
 *
 * O tamanho da formação é uma pilha de avatares com as iniciais dos três
 * primeiros integrantes, e não mais um número num badge — ver
 * {@link AvataresGrupo}.
 *
 * A `variante` muda só a moldura, não o conteúdo. `"cartao"` (padrão) é o
 * cartão solto da grade, com sua própria borda arredondada. `"linha"` é para
 * quando o próprio pai já desenha a borda ao redor de todas as células — o
 * preview do painel (ver `lista-grupos.tsx`), que conecta os grupos como a
 * `ListaIntegrantes` conecta as pessoas, em vez de cartões soltos com vão
 * entre eles.
 */
export function CartaoGrupo({
    grupo,
    variante = "cartao",
}: {
    grupo: GrupoComPrevia;
    variante?: "cartao" | "linha";
}) {
    return (
        <Link
            href={`/admin/minha-entidade/grupos/${grupo.id}`}
            className={cn(
                "hover:bg-muted/50 focus-visible:ring-ring/50 flex h-full w-full flex-col gap-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                variante === "cartao"
                    ? "bg-card hover:border-primary/50 rounded-xl border p-4"
                    : "p-3",
            )}
        >
            <ConteudoCartaoGrupo
                grupo={grupo}
                sinal={
                    <CaretRightIcon
                        aria-hidden="true"
                        className="text-muted-foreground mt-0.5 shrink-0"
                    />
                }
            />
        </Link>
    );
}

/**
 * O miolo do cartão de grupo — nome, descrição, avatares, aviso de matrícula
 * e data —, sem a moldura clicável em volta.
 *
 * Separado do {@link CartaoGrupo} porque o mesmo grupo aparece em dois
 * gestos diferentes: na grade ele é um link para a página do grupo, e na
 * inscrição numa categoria ele é um botão que marca o grupo para se
 * apresentar (`cartao-grupo-selecao.tsx`). O que muda entre os dois é o
 * elemento em volta e o `sinal` no canto — a seta de "abrir" ou o círculo de
 * "marcar" —, não o que o cartão diz sobre o grupo.
 *
 * O `sinal` vem de fora, em vez de ser um `variante`, porque é a única peça
 * que muda: quem monta o cartão sabe o que o clique faz, e este miolo não
 * precisa saber.
 */
export function ConteudoCartaoGrupo({
    grupo,
    sinal,
}: {
    grupo: GrupoComPrevia;
    /** O ícone do canto superior direito: o que o clique no cartão faz. */
    sinal: React.ReactNode;
}) {
    return (
        <>
            <div className="flex items-start gap-2">
                <h3 className="min-w-0 flex-1 text-base leading-tight font-bold">
                    {grupo.nome}
                </h3>
                {sinal}
            </div>

            {grupo.descricao ? (
                <p className="text-muted-foreground line-clamp-2 text-sm">
                    {grupo.descricao}
                </p>
            ) : (
                <p className="text-muted-foreground/70 text-sm italic">
                    Sem descrição
                </p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2">
                <AvataresGrupo
                    integrantes={grupo.firstThreeIntegrantes}
                    total={grupo.totalIntegrantes}
                />

                {grupo.pendenciaCarteiraVencida && (
                    <Badge
                        variant="warning"
                        title="Alguém do grupo está com a matrícula vencida e não pode ser inscrito."
                    >
                        <WarningIcon
                            aria-hidden="true"
                            weight="fill"
                            className="text-warning"
                        />
                        Matrícula vencida
                    </Badge>
                )}

                <span className="text-muted-foreground ml-auto text-xs">
                    {formatarDataCriacao(grupo.dataCriacao)}
                </span>
            </div>
        </>
    );
}
