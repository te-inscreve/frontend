import { notFound } from "next/navigation";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { LockKeyOpenIcon } from "@phosphor-icons/react/dist/ssr/LockKeyOpen";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import type { ModalidadeDetalhe } from "@te-inscreve/schemas";
import { Badge } from "@te-inscreve/components";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { ListCategorias } from "./list-categorias";

interface Props {
    eventoId: number;
    modalidadeId: number;
    /** Nome já conhecido pela aba — evita um título vazio antes da resposta. */
    modalidadeNome: string;
}

/**
 * Painel da aba aberta: as regras da modalidade e a fila de categorias dela.
 *
 * A busca acontece aqui dentro, atrás do `<Suspense>` do `DetalheEvento`, para
 * o cabeçalho e as abas irem para o stream sem esperar. As categorias vêm na
 * mesma resposta, então trocar de aba é uma requisição só.
 */
export async function DetalheModalidade({
    eventoId,
    modalidadeId,
    modalidadeNome,
}: Props) {
    const modalidade = await getQueryClient().fetchQuery(
        trpc.modalidade.getById.queryOptions({ eventoId, modalidadeId }),
    );

    // A aba veio da lista do evento, então um 404 aqui é a modalidade tendo
    // sumido entre uma requisição e outra — não há painel para mostrar.
    if (!modalidade) notFound();

    return (
        <div className="flex flex-col gap-4">
            <ResumoModalidade
                modalidade={modalidade}
                modalidadeNome={modalidadeNome}
            />

            <ListCategorias
                eventoId={eventoId}
                modalidadeId={modalidadeId}
                modalidadeNome={modalidadeNome}
                categorias={modalidade.categorias}
            />
        </div>
    );
}

function ResumoModalidade({
    modalidade,
    modalidadeNome,
}: {
    modalidade: ModalidadeDetalhe;
    modalidadeNome: string;
}) {
    const emGrupo = modalidade.isGrupo;

    return (
        <section
            aria-label={`Sobre ${modalidadeNome}`}
            className="bg-card flex flex-col gap-4 rounded-lg border p-4 md:p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h4 className="text-lg font-bold">{modalidade.nome}</h4>
                    {modalidade.descricao && (
                        <p className="text-muted-foreground max-w-2xl text-sm">
                            {modalidade.descricao}
                        </p>
                    )}
                </div>

                <Badge
                    variant={emGrupo ? "default" : "secondary"}
                    className="flex items-center gap-1"
                >
                    {emGrupo ? <UsersThreeIcon /> : <UserIcon />}
                    {emGrupo ? "Em grupo" : "Individual"}
                </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Regra
                    icone={<StackIcon />}
                    termo="Categorias"
                    valor={String(modalidade.categorias.length)}
                />
                <Regra
                    icone={<TrophyIcon />}
                    termo="Posições premiadas"
                    // Zero não é ausência de dado: é modalidade que não premia.
                    valor={
                        modalidade.maxPosicaoPremiada === 0
                            ? "Não premia"
                            : `Até ${modalidade.maxPosicaoPremiada}º lugar`
                    }
                />
                <Regra
                    icone={
                        modalidade.planilhaAberta ? (
                            <LockKeyOpenIcon />
                        ) : (
                            <LockKeyIcon />
                        )
                    }
                    termo="Planilha"
                    valor={modalidade.planilhaAberta ? "Aberta" : "Fechada"}
                />
                <Regra
                    icone={<UsersThreeIcon />}
                    termo="Inscrições por entidade"
                    // Nulo é ausência de teto, e não zero inscrições.
                    valor={
                        modalidade.maxInscricoesEntidadePorCategoria === null
                            ? "Sem limite"
                            : `Até ${modalidade.maxInscricoesEntidadePorCategoria} por categoria`
                    }
                />

                {/* Os dois limites de grupo só existem quando a modalidade é em
                    grupo — fora disso o backend manda `null` nos dois. */}
                {emGrupo && (
                    <Regra
                        icone={<UsersThreeIcon />}
                        termo="Integrantes por grupo"
                        valor={formatarFaixaDeGrupo(modalidade)}
                    />
                )}
            </dl>
        </section>
    );
}

/** "De 2 a 8", "A partir de 2", "Até 8" — ou nada definido. */
function formatarFaixaDeGrupo({
    minInscritosPorGrupo: min,
    maxInscritosPorGrupo: max,
}: ModalidadeDetalhe) {
    if (min !== null && max !== null) return `De ${min} a ${max}`;
    if (min !== null) return `A partir de ${min}`;
    if (max !== null) return `Até ${max}`;
    return "Sem limite";
}

function Regra({
    icone,
    termo,
    valor,
}: {
    icone: React.ReactNode;
    termo: string;
    valor: string;
}) {
    return (
        <div className="bg-muted/40 flex items-center gap-3 rounded-md border p-3">
            <span
                aria-hidden="true"
                className="text-primary bg-background flex size-9 shrink-0 items-center justify-center rounded-full border [&_svg]:size-4"
            >
                {icone}
            </span>
            <div className="min-w-0">
                <dt className="text-muted-foreground text-xs">{termo}</dt>
                <dd className="truncate text-sm font-semibold">{valor}</dd>
            </div>
        </div>
    );
}
