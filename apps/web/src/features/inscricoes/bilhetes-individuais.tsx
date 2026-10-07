"use client";

import type { Control } from "react-hook-form";
import { useId } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { AnimatePresence } from "motion/react";
import { useFormState } from "react-hook-form";

import type { Categoria, ModalidadeDetalhe } from "@te-inscreve/schemas";
import { Button, cn, FieldError } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type { InscricaoFormValues } from "./lib/inscricao-form-schema";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import {
    CartaoIntegranteAlternavel,
    LinhaAlternavel,
} from "~/features/entidades/integrantes/cartao-integrante-alternavel";
import { nomeCompleto } from "~/features/entidades/shared/integrantes";
import { PicoteVertical, RestricoesDaCategoria } from "./partes-do-ticket";

/** Quantos esqueletos no máximo enquanto a formação do grupo não chega. */
const MAXIMO_DE_ESQUELETOS = 6;

interface Props {
    /** `null` enquanto a categoria não chega — o título vira reticências. */
    categoria: Categoria | null;
    modalidade: ModalidadeDetalhe | null;
    control: Control<InscricaoFormValues>;
    /** Quem está no formulário — cada um é uma inscrição. */
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
 * O lado direito da bancada na modalidade individual: um bilhete por pessoa.
 *
 * Na modalidade em grupo, a lista inteira é *uma* inscrição, e o
 * {@link TicketInscricao} desenha isso — um bilhete com todo mundo dentro.
 * Aqui cada pessoa compete sozinha, e marcar cinco é pedir cinco inscrições;
 * um bilhete só diria o contrário. O payload é o mesmo (`integrantes`, sem
 * `nomeConcorrente`) — o que muda é como a tela conta.
 *
 * Por isso a categoria sai de dentro do bilhete e vira o cabeçalho da coluna:
 * ela vale para todos os bilhetes, e repeti-la em cada um seria ruído. E o
 * botão de envio diz quantas inscrições cria — com mais de uma pessoa na
 * lista, não existe "Criar Inscrição" no singular: o envio é sempre de todas.
 *
 * Os bilhetes não têm moldura em volta: ficam direto sobre a página, porque a
 * mordida dos picotes tem a cor do fundo (`fill-background`). A lista rolável
 * tem folga vertical para a mordida do primeiro e do último não ser cortada.
 */
export function BilhetesIndividuais({
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
    const quantidade = integrantes.length;

    return (
        <form
            noValidate
            onSubmit={onCriar}
            aria-labelledby={tituloId}
            className={cn("flex min-w-0 flex-col gap-3", className)}
        >
            <header className="flex shrink-0 flex-col gap-1 px-0">
                <h2
                    id={tituloId}
                    className="truncate text-lg font-bold tracking-tight"
                >
                    {modalidade === null || categoria === null
                        ? "…"
                        : `${modalidade.nome} ${categoria.nome.toLowerCase()}`}
                </h2>
                <RestricoesDaCategoria
                    categoria={categoria}
                    modalidade={modalidade}
                />
            </header>

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1.5">
                {quantidade === 0 && !grupoAplicando ? (
                    <div className="text-muted-foreground bg-card flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm">
                        <UserIcon
                            aria-hidden="true"
                            size={32}
                            className="opacity-60"
                        />
                        <p className="max-w-sm">
                            Nenhuma inscrição ainda. Cada integrante adicionado
                            vira uma inscrição própria — clique em um grupo para
                            trazer todos de uma vez.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p
                            aria-live="polite"
                            className="text-muted-foreground text-xs"
                        >
                            {contagemInscricoes(quantidade)}
                        </p>

                        <ul className="grid gap-3">
                            <AnimatePresence initial={false} mode="popLayout">
                                {integrantes.map((integrante, indice) => (
                                    <LinhaAlternavel key={integrante.id}>
                                        <BilheteIndividual
                                            integrante={integrante}
                                            numero={indice + 1}
                                            onAlternar={onAlternarIntegrante}
                                        />
                                    </LinhaAlternavel>
                                ))}
                            </AnimatePresence>

                            {Array.from({ length: esqueletos }, (_, indice) => (
                                <BilheteIndividualSkeleton
                                    key={`s-${indice}`}
                                />
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <footer className="flex shrink-0 flex-col gap-3 border-t border-dashed pt-3">
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
                        <SpinnerGapIcon
                            aria-hidden="true"
                            className="animate-spin"
                        />
                    ) : quantidade > 1 ? (
                        <StackIcon aria-hidden="true" />
                    ) : (
                        <TicketIcon aria-hidden="true" />
                    )}
                    {criando ? "Criando…" : rotuloDoEnvio(quantidade)}
                </Button>
            </footer>
        </form>
    );
}

/**
 * Uma inscrição individual: a pessoa à esquerda, o canhoto numerado à
 * direita, separados por um picote de pé.
 *
 * O corpo é o {@link CartaoIntegranteAlternavel} do bilhete em grupo, sem a
 * borda própria — a borda é a do bilhete —, e continua sendo o botão de
 * tirar a pessoa. O canhoto é enfeite com número, e fica fora da leitura
 * (`aria-hidden`): o número é só a posição na lista.
 */
function BilheteIndividual({
    integrante,
    numero,
    onAlternar,
}: {
    integrante: Integrante;
    numero: number;
    onAlternar: (integrante: Integrante) => void;
}) {
    return (
        <div className="bg-card flex min-w-0 rounded-xl border">
            <CartaoIntegranteAlternavel
                integrante={integrante}
                acao="tirar"
                rotulo={`Tirar ${nomeCompleto(integrante)} da inscrição`}
                onAlternar={onAlternar}
                className="min-w-0 flex-1 rounded-r-none border-0"
            />

            <PicoteVertical />

            <div
                aria-hidden="true"
                className="text-muted-foreground flex w-14 shrink-0 flex-col items-center justify-center gap-0.5"
            >
                <TicketIcon size={18} />
                <span className="text-xs font-semibold tabular-nums">
                    {numero}
                </span>
            </div>
        </div>
    );
}

/** O {@link BilheteIndividual} enquanto a formação do grupo não chega. */
function BilheteIndividualSkeleton() {
    return (
        <li className="bg-card flex rounded-xl border">
            <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <PicoteVertical />
            <div className="flex w-14 shrink-0 items-center justify-center">
                <Skeleton className="size-5 rounded" />
            </div>
        </li>
    );
}

function contagemInscricoes(quantidade: number) {
    if (quantidade === 0) return "Nenhuma inscrição";
    if (quantidade === 1) return "1 inscrição individual";
    return `${quantidade} inscrições individuais`;
}

/**
 * O rótulo do envio. Com mais de uma pessoa é sempre o plural com o número:
 * não há como criar só uma inscrição de uma lista de várias.
 */
function rotuloDoEnvio(quantidade: number) {
    if (quantidade === 0) return "Criar inscrições";
    if (quantidade === 1) return "Criar 1 inscrição";
    return `Criar ${quantidade} inscrições`;
}
