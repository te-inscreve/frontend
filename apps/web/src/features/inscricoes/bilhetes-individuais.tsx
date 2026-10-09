"use client";

import type { Control } from "react-hook-form";
import { useId } from "react";
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AnimatePresence } from "motion/react";
import { useFormState } from "react-hook-form";

import type {
    Categoria,
    MinhaEntidade,
    ModalidadeDetalhe,
} from "@te-inscreve/schemas";
import { Button, cn, FieldError } from "@te-inscreve/components";
import { Skeleton } from "@te-inscreve/components/skeleton";

import type { InscricaoFormValues } from "./lib/inscricao-form-schema";
import type { GrupoComPrevia } from "~/features/entidades/grupos/grupo";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { IsGroupBadge } from "~/features/categorias/categoria-detail/is-group-badge";
import { LinhaAlternavel } from "~/features/entidades/integrantes/cartao-integrante-alternavel";
import { idadeEm, nomeCompleto } from "~/features/entidades/shared/integrantes";
import { PicoteVertical, RestricoesDaCategoria } from "./partes-do-ticket";

/** Quantos esqueletos no máximo enquanto a formação do grupo não chega. */
const MAXIMO_DE_ESQUELETOS = 6;

interface Props {
    /** `null` enquanto a categoria não chega — o título vira reticências. */
    categoria: Categoria | null;
    /** `null` enquanto a entidade não chega — a linha dela vira reticências. */
    entidade: MinhaEntidade | null;
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
    entidade,
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
                <div className="flex items-center justify-between">
                    <h2
                        id={tituloId}
                        className="truncate text-lg font-bold tracking-tight"
                    >
                        {modalidade === null || categoria === null
                            ? "…"
                            : `${modalidade.nome} ${categoria.nome.toLowerCase()}`}
                    </h2>
                    {modalidade && (
                        <IsGroupBadge isGroup={modalidade.isGrupo} />
                    )}
                </div>
                <RestricoesDaCategoria
                    categoria={categoria}
                    modalidade={modalidade}
                />
            </header>

            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1.5">
                {quantidade === 0 && !grupoAplicando ? (
                    <div className="text-muted-foreground flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 p-8 text-center text-sm">
                        <UserIcon
                            aria-hidden="true"
                            size={32}
                            className="opacity-60"
                        />
                        <p className="max-w-sm">
                            Nenhum integrante foi adicionado à inscrição.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p
                            aria-live="polite"
                            className="text-muted-foreground text-sm"
                        >
                            {contagemInscricoes(quantidade)}
                        </p>

                        <ul className="grid gap-3">
                            <AnimatePresence initial={false} mode="popLayout">
                                {integrantes.map((integrante) => (
                                    <LinhaAlternavel key={integrante.id}>
                                        <BilheteIndividual
                                            integrante={integrante}
                                            entidade={entidade}
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
 * Uma inscrição individual, no mesmo desenho do bilhete da lista de
 * inscrições ({@link ListaInscricoes}): o canhoto à esquerda, a pessoa à
 * direita, separados por um picote de pé.
 *
 * O canhoto leva só o ícone de bilhete: lá ele leva o número da inscrição,
 * e aqui a inscrição ainda não existe. A largura é a mesma, para o bilhete
 * não mudar de forma quando for criado.
 *
 * O lado da pessoa é o botão de tirá-la da inscrição — o mesmo gesto do
 * {@link CartaoIntegranteAlternavel}, com o "x" revelado no hover e no foco.
 * Tudo em `span` dentro dele: `button` só aceita conteúdo de frase.
 */
function BilheteIndividual({
    integrante,
    entidade,
    onAlternar,
}: {
    integrante: Integrante;
    entidade: Pick<MinhaEntidade, "nome" | "cidade"> | null;
    onAlternar: (integrante: Integrante) => void;
}) {
    const nome = nomeCompleto(integrante);

    return (
        <div className="bg-card flex min-w-0 rounded-xl border">
            <div
                aria-hidden="true"
                className="text-muted-foreground flex w-24 shrink-0 items-center justify-center"
            >
                ----
            </div>

            <PicoteVertical />

            <button
                type="button"
                onClick={() => onAlternar(integrante)}
                aria-label={`Tirar ${nome} da inscrição`}
                className="focus-visible:ring-ring/50 group hover:bg-card/50 flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-r-xl p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                <span className="min-w-0 flex-1">
                    <span className="block truncate">{nome}</span>
                    <span className="text-muted-foreground block truncate text-sm">
                        <UserIcon
                            aria-hidden="true"
                            className="mr-1 inline size-4"
                        />
                        {idadeEm(integrante.dataNascimento)} anos {"  "}·{"  "}
                        {integrante.matriculaMtg}
                    </span>
                    <span className="text-muted-foreground block truncate text-sm">
                        <BuildingsIcon
                            aria-hidden="true"
                            className="mr-1 inline size-4"
                        />
                        {entidade
                            ? `${entidade.nome} · ${entidade.cidade}`
                            : "…"}
                    </span>
                </span>

                <XIcon
                    aria-hidden="true"
                    size={20}
                    weight="bold"
                    className="text-destructive shrink-0 opacity-0 transition duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-safe:scale-50"
                />
            </button>
        </div>
    );
}

/** O {@link BilheteIndividual} enquanto a formação do grupo não chega. */
function BilheteIndividualSkeleton() {
    return (
        <li className="bg-card flex rounded-xl border">
            <div className="w-24 shrink-0" />
            <PicoteVertical />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3.5 w-3/5" />
            </div>
        </li>
    );
}

function contagemInscricoes(quantidade: number) {
    if (quantidade === 0) return "Nenhuma inscrição";
    if (quantidade === 1) return "1 inscrição";
    return `${quantidade} inscrições`;
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
