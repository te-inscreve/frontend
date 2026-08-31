import Link from "next/link";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { LockKeyOpenIcon } from "@phosphor-icons/react/dist/ssr/LockKeyOpen";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import type { ModalidadeDetalhe } from "@te-inscreve/schemas";
import { Badge, Button } from "@te-inscreve/components";

interface Props {
    eventoId: number;
    modalidade: ModalidadeDetalhe;
    /** Nome já conhecido pela aba — evita um rótulo vazio antes da resposta. */
    modalidadeNome: string;
}

/**
 * As regras da modalidade aberta, em duas camadas.
 *
 * Fechado, mostra só o que define a modalidade — como se inscreve, se premia e
 * se as notas aparecem. Aberto, explica cada uma dessas regras, acrescenta as
 * de detalhe (limite por entidade, tamanho do grupo) e leva à edição.
 *
 * `<details>` nativo em vez de um collapsible controlado: o painel inteiro é
 * Server Component, e assim continua sem JS de cliente.
 */
export function ResumoModalidade({
    eventoId,
    modalidade,
    modalidadeNome,
}: Props) {
    const emGrupo = modalidade.isGrupo;

    // O nome da modalidade não entra aqui: ele já é o rótulo da aba ativa,
    // logo acima do painel.
    const regras = [
        {
            Icon: emGrupo ? UsersThreeIcon : UserIcon,
            termo: "Formato",
            valor: emGrupo ? "Em grupo" : "Individual",
            explicacao: emGrupo
                ? "Cada inscrição é de um conjunto de participantes, e não de uma pessoa."
                : "Cada inscrição pertence a uma única pessoa.",
            // Fechado, o formato aparece como badge, e não na lista de regras
            // — daí ele ficar fora do destaque.
            emDestaque: false,
        },
        {
            Icon: TrophyIcon,
            termo: "Posições premiadas",
            // Zero não é ausência de dado: é modalidade que não premia.
            valor:
                modalidade.maxPosicaoPremiada === 0
                    ? "Não premia"
                    : `Até ${modalidade.maxPosicaoPremiada}º lugar`,
            explicacao:
                modalidade.maxPosicaoPremiada === 0
                    ? "Os inscritos são avaliados, mas a apuração não distribui colocação premiada."
                    : `A apuração premia os classificados até o ${modalidade.maxPosicaoPremiada}º lugar de cada categoria.`,
            emDestaque: true,
        },
        {
            Icon: modalidade.planilhaAberta ? LockKeyOpenIcon : LockKeyIcon,
            termo: "Planilha",
            valor:
                "Planilha " +
                (modalidade.planilhaAberta ? "aberta" : "fechada"),
            explicacao: modalidade.planilhaAberta
                ? "As notas ficam visíveis aos participantes enquanto a apuração acontece."
                : "As notas ficam restritas à organização até o fim da apuração.",
            emDestaque: true,
        },
        {
            Icon: StackIcon,
            termo: "Categorias",
            valor:
                modalidade.categorias.length === 1
                    ? "1 categoria"
                    : `${modalidade.categorias.length} categorias`,
            explicacao:
                modalidade.categorias.length === 0
                    ? "A modalidade só recebe inscrições depois que tiver a primeira categoria."
                    : "Faixas de idade em que os inscritos são separados. Cada uma recebe inscrições e é avaliada em separado.",
            emDestaque: false,
        },
        {
            Icon: TicketIcon,
            termo: "Inscrições por entidade",
            // Nulo é ausência de teto, e não zero inscrições.
            valor:
                modalidade.maxInscricoesEntidadePorCategoria === null
                    ? "Sem limite"
                    : `Até ${modalidade.maxInscricoesEntidadePorCategoria} por entidade`,
            explicacao:
                modalidade.maxInscricoesEntidadePorCategoria === null
                    ? "Uma entidade pode inscrever quantos participantes quiser em cada categoria."
                    : `Uma mesma entidade inscreve no máximo ${modalidade.maxInscricoesEntidadePorCategoria} participantes em cada categoria.`,
            emDestaque: false,
        },
        // Os dois limites de grupo só existem quando a modalidade é em grupo —
        // fora disso o backend manda `null` nos dois.
        ...(emGrupo
            ? [
                  {
                      Icon: UsersThreeIcon,
                      termo: "Integrantes por grupo",
                      valor: formatarFaixaDeGrupo(modalidade),
                      explicacao:
                          "Quantos participantes cada grupo inscrito precisa reunir.",
                      emDestaque: false,
                  },
              ]
            : []),
    ];

    return (
        <details
            aria-label={`Sobre ${modalidadeNome}`}
            className="group bg-card rounded-lg border"
        >
            {/* Só as regras em destaque: o resumo fechado é para bater o olho,
                e listar tudo aqui apagaria a diferença entre elas. O rótulo de
                cada uma fica no `sr-only`, porque o ícone já faz esse papel
                para quem enxerga. */}
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Badge
                        variant={emGrupo ? "default" : "secondary"}
                        className="flex items-center gap-1 rounded-sm"
                    >
                        {/* {emGrupo ? <UsersThreeIcon /> : <UserIcon />} */}
                        {"Apresentações " +
                            (emGrupo ? "em grupo" : "individuais")}
                    </Badge>

                    {regras
                        .filter(({ emDestaque }) => emDestaque)
                        .map(({ Icon, termo, valor }) => (
                            <span
                                key={termo}
                                className="text-muted-foreground flex items-center gap-1.5 text-sm"
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="size-4 shrink-0"
                                />
                                <span className="sr-only">{termo}:</span>
                                <span className="text-foreground font-medium">
                                    {valor}
                                </span>
                            </span>
                        ))}
                </div>

                <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-xs">
                    <span className="group-open:hidden">Ver detalhes</span>
                    <span className="hidden group-open:inline">
                        Ocultar detalhes
                    </span>
                    <CaretDownIcon
                        aria-hidden="true"
                        className="size-4 transition-transform group-open:rotate-180"
                    />
                </span>
            </summary>

            <div className="flex flex-col gap-4 border-t px-4 py-4">
                {modalidade.descricao && (
                    <p className="text-muted-foreground text-sm">
                        {modalidade.descricao}
                    </p>
                )}

                {/* Aqui entram todas as regras, e não só as do resumo: quem
                    abriu quer saber o que cada uma quer dizer na prática. */}
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {regras.map(({ Icon, termo, valor, explicacao }) => (
                        <div key={termo} className="flex gap-2.5">
                            <Icon
                                aria-hidden="true"
                                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                            />
                            <div>
                                <dt className="text-sm font-medium">
                                    {termo}
                                    <span className="text-muted-foreground font-normal">
                                        {" · "}
                                        {valor}
                                    </span>
                                </dt>
                                <dd className="text-muted-foreground mt-0.5 text-xs">
                                    {explicacao}
                                </dd>
                            </div>
                        </div>
                    ))}
                </dl>

                <div className="flex justify-end border-t pt-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={`/admin/eventos/${eventoId}/modalidades/${modalidade.id}/editar`}
                        >
                            <PencilSimpleIcon aria-hidden="true" />
                            Editar
                        </Link>
                    </Button>
                </div>
            </div>
        </details>
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
