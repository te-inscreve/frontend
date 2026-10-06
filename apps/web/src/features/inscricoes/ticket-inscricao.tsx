"use client";

import type { Control } from "react-hook-form";
import { useId } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { AnimatePresence, motion } from "motion/react";
import { useFormState } from "react-hook-form";

import type { Categoria, ModalidadeDetalhe } from "@te-inscreve/schemas";
import {
    Button,
    cn,
    EXPANSION_TRANSITION,
    FieldError,
} from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type { InscricaoFormValues } from "./lib/inscricao-form-schema";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { contagemIntegrantes } from "~/features/entidades/grupos/grupo";
import { CartaoIntegranteSkeleton } from "~/features/entidades/integrantes/cartao-integrante-skeleton";
import { CampoNomeConcorrente } from "./campo-nome-concorrente";
import { CartaoIntegranteInscricao } from "./cartao-integrante-inscricao";
import { RecorteDoTicket, RestricoesDaCategoria } from "./partes-do-ticket";

/** Quantos esqueletos no máximo enquanto a formação do grupo não chega. */
const MAXIMO_DE_ESQUELETOS = 6;

interface Props {
    /** `null` enquanto a categoria não chega — o título vira reticências. */
    categoria: Categoria | null;
    /** `null` enquanto a modalidade não chega — os limites viram esqueleto. */
    modalidade: ModalidadeDetalhe | null;
    control: Control<InscricaoFormValues>;
    /** Quem está na inscrição, na ordem em que entrou. */
    integrantes: Integrante[];
    /** O grupo cuja formação está a caminho — `grupo.getById` não respondeu. */
    grupoAplicando: GrupoComPrevia | null;
    erroAoAplicarGrupo: { message: string } | null;
    onAlternarIntegrante: (integrante: Integrante) => void;
    /** O `handleSubmit` do formulário. */
    onCriar: React.FormEventHandler<HTMLFormElement>;
    /** Enquanto `inscricao.create` responde — o botão espera. */
    criando: boolean;
    /** A recusa do backend que não cabe em campo nenhum. */
    erroAoCriar: string | null;
    className?: string;
}

/**
 * O lado direito da bancada de inscrição: quem se apresenta, em forma de
 * bilhete.
 *
 * É irmão da {@link LadoDaBancada} — mesma casca (`section` rotulada,
 * `bg-muted/40`, borda, raio), mesma altura, para os dois lados se lerem como
 * um par — mas com a forma de um ticket: três superfícies (cabeçalho, corpo,
 * rodapé) separadas por dois picotes. O cabeçalho diz *em que* se inscreve
 * (a categoria) e, na modalidade em grupo, *com que nome*; o corpo é a lista de quem vai; o rodapé
 * traz o que a categoria exige e o botão de criar. A forma não é enfeite: a
 * inscrição é o comprovante de que a entidade entra na categoria, e um
 * bilhete é o que a pessoa vai levar dali.
 *
 * O corpo rola por dentro, como as listas do outro lado: as duas mãos têm a
 * mesma altura, e é rolando separadas que continuam lado a lado.
 *
 * As linhas entram e saem com `AnimatePresence` + `motion.li layout` (o
 * padrão de `grade-grupos.tsx`), e não com `layoutId` compartilhado com a
 * lista da esquerda — ver {@link CartaoIntegranteInscricao}.
 *
 * Enquanto `grupo.getById` carrega, o corpo mostra esqueletos no fim da
 * lista — onde a formação vai entrar, tantos quantos o cartão do grupo
 * disse que são.
 *
 * É o próprio `form`: o botão do rodapé é o `submit`, e o nome do
 * concorrente, no cabeçalho, é campo dele. Os cliques na coluna da entidade
 * mexem no mesmo formulário por `setValue`, de fora.
 */
export function TicketInscricao({
    categoria,
    modalidade,
    control,
    integrantes,
    grupoAplicando,
    erroAoAplicarGrupo,
    onAlternarIntegrante,
    onCriar,
    criando,
    erroAoCriar,
    className,
}: Props) {
    const tituloId = useId();
    const { errors } = useFormState({ control, name: "integrantes" });
    const esqueletos = grupoAplicando
        ? Math.min(
              Math.max(grupoAplicando.totalIntegrantes, 1),
              MAXIMO_DE_ESQUELETOS,
          )
        : 0;

    return (
        <form
            noValidate
            onSubmit={onCriar}
            aria-labelledby={tituloId}
            className={cn(
                // Sem `overflow-hidden`: os picotes saem 1,5px para fora da
                // borda para cobri-la, e um recorte os cortaria.
                "bg-muted/40 flex min-w-0 flex-col rounded-xl border",
                className,
            )}
        >
            <header className="bg-card flex shrink-0 flex-col gap-0 rounded-t-xl px-4 py-3">
                <h2
                    id={tituloId}
                    className="mb-1 truncate text-lg font-bold tracking-tight"
                >
                    {modalidade === null || categoria === null
                        ? "…"
                        : `${modalidade.nome} ${categoria.nome.toLowerCase()}`}
                </h2>
                <RestricoesDaCategoria
                    categoria={categoria}
                    modalidade={modalidade}
                />
                {modalidade?.exibirNomeConcorrente && (
                    <CampoNomeConcorrente control={control} />
                )}
            </header>

            <RecorteDoTicket />

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {integrantes.length === 0 && !grupoAplicando ? (
                    // O vazio é a própria área de chegada, tracejada como uma
                    // vaga esperando conteúdo — o mesmo desenho do grupo vazio
                    // na bancada de grupo.
                    <div className="bg-card flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm">
                        <UsersThreeIcon
                            aria-hidden="true"
                            size={32}
                            className="opacity-60"
                        />
                        <p className="text-muted-foreground max-w-sm">
                            Nenhum integrante adicionado ainda. Clique em um
                            grupo para trazer a formação dele, ou em um
                            integrante para adicioná-lo à inscrição.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p
                            aria-live="polite"
                            className="text-muted-foreground text-xs"
                        >
                            Listando {contagemIntegrantes(integrantes.length)}
                        </p>
                        <ul className="grid gap-3">
                            {/* `initial={false}`: o que já está no ticket na
                            primeira pintura não nasce animando. `popLayout`
                            tira a linha que sai do fluxo na hora, para as
                            vizinhas deslizarem sem esperar. */}
                            <AnimatePresence initial={false} mode="popLayout">
                                {integrantes.map((integrante) => (
                                    <motion.li
                                        key={integrante.id}
                                        // `min-w-0`: item de grade nasce com
                                        // `min-width: auto` e não encolhe abaixo
                                        // do conteúdo — em tela estreita o nome
                                        // empurrava o ícone para fora do bilhete.
                                        className="min-w-0"
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={EXPANSION_TRANSITION}
                                    >
                                        <CartaoIntegranteInscricao
                                            integrante={integrante}
                                            lado="ticket"
                                            onAlternar={onAlternarIntegrante}
                                        />
                                    </motion.li>
                                ))}
                            </AnimatePresence>

                            {Array.from({ length: esqueletos }, (_, indice) => (
                                <CartaoIntegranteSkeleton key={`s-${indice}`} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <RecorteDoTicket />

            <footer className="bg-card flex shrink-0 flex-col gap-3 rounded-b-xl px-4 py-3">
                {errors.integrantes && (
                    <FieldError errors={[errors.integrantes]} />
                )}
                {erroAoAplicarGrupo && (
                    <FieldError>
                        Não foi possível trazer os integrantes do grupo.{" "}
                        {erroAoAplicarGrupo.message}
                    </FieldError>
                )}
                {erroAoCriar && <FieldError>{erroAoCriar}</FieldError>}

                <Button type="submit" disabled={criando}>
                    {criando ? (
                        <CircleNotchIcon
                            aria-hidden="true"
                            className="animate-spin"
                        />
                    ) : (
                        <TicketIcon aria-hidden="true" />
                    )}
                    {criando ? "Criando…" : "Criar inscrição"}
                </Button>
            </footer>
        </form>
    );
}

/**
 * O {@link TicketInscricao} enquanto o portão da entidade não decide: a mesma
 * geometria — cabeçalho, picote, vazio tracejado, picote, rodapé com duas
 * linhas e o botão —, para a bancada não pular quando a inscrição montar.
 */
export function TicketInscricaoSkeleton({ className }: { className?: string }) {
    return (
        <section
            aria-hidden="true"
            className={cn(
                "bg-muted/40 flex min-w-0 flex-col rounded-xl border",
                className,
            )}
        >
            <header className="bg-card flex shrink-0 flex-col gap-1.5 rounded-t-xl px-4 py-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-48" />
            </header>

            <RecorteDoTicket />

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8">
                    <Skeleton className="size-7 rounded-full" />
                    <Skeleton className="h-3.5 w-64 max-w-full" />
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                </div>
            </div>

            <RecorteDoTicket />

            <footer className="bg-card flex shrink-0 flex-col gap-3 rounded-b-xl px-4 py-3">
                <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-36" />
                </div>
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-9 w-full rounded-md" />
            </footer>
        </section>
    );
}
