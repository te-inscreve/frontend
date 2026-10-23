import Link from "next/link";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";

import type { CategoriaAninhada } from "@te-inscreve/schemas";

import { SituacaoCategoriaBadge } from "~/features/categorias/situacao-categoria-badge";
import { formatDate } from "~/shared/utils/format-date";

interface Props {
    categoria: CategoriaAninhada;
    eventoId: number;
    /**
     * A modalidade não está na rota do detalhe, mas o endpoint da categoria é
     * aninhado nela — então ela viaja na query.
     */
    modalidadeId: number;
}

export function CardCategoria({ categoria, eventoId, modalidadeId }: Props) {
    return (
        <Link
            href={`/admin/eventos/${eventoId}/modalidades/${modalidadeId}/categorias/${categoria.id}`}
            // A borda é o fundo desta camada, e o conteúdo é a de dentro: um
            // `border` comum não acompanharia a troca de cor no hover com a
            // mesma suavidade. O anel de foco fica de fora porque o
            // `overflow-hidden` de dentro o cortaria — quem sinaliza foco aqui
            // é a própria borda.
            className="bg-border focus-visible:bg-ring group flex w-100 shrink-0 rounded-xl p-px transition-colors focus-visible:outline-none"
        >
            <CanhotoIdade categoria={categoria} />

            <div
                // `h-full` porque a fila de categorias é um flex row: sem ele a
                // camada de borda estica até a altura do cartão mais alto e a
                // de dentro não, deixando uma faixa da cor da borda no rodapé.
                //
                // `overflow-hidden` é o que faz o canhoto respeitar o
                // arredondado: ele encosta nas quatro bordas e é o recorte
                // desta camada que arredonda as pontas dele.
                className="bg-card relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-r-xl p-2 transition-colors"
            >
                <div className="flex items-start justify-between gap-2">
                    <h5 className="text-base leading-tight font-bold">
                        {categoria.nome}
                    </h5>
                    <SituacaoCategoriaBadge situacao={categoria.situacao} />
                </div>

                <dl className="grid grid-cols-2 gap-2">
                    <Dado
                        icone={<TicketIcon size={36} className="text-xl" />}
                        termo="Inscrições"
                        // Nulo é categoria sem teto, e não zero inscrições. O
                        // total de inscritos ainda não vem da API.
                        valor={
                            categoria.maxInscricoes === null
                                ? categoria.countInscricoes.toString()
                                : `${categoria.countInscricoes} / ${categoria.maxInscricoes}`
                        }
                    />
                    <Dado
                        icone={<CalendarDotsIcon size={24} />}
                        termo="Início em"
                        // Nulo é categoria ainda fora do cronograma.
                        valor={
                            categoria.dataApresentacao === null
                                ? null
                                : formatDate(
                                      new Date(categoria.dataApresentacao),
                                  )
                        }
                    />
                </dl>
            </div>
        </Link>
    );
}

/**
 * O detalhe que dá forma ao cartão: uma faixa vertical na borda esquerda com a
 * faixa etária, separada do miolo por uma serrilha tracejada — o cartão passa a
 * ler como o canhoto de um ingresso, que é justamente o que a categoria é.
 *
 * O texto é vertical de verdade (`writing-mode`), e não uma imagem: continua
 * sendo lido por leitor de tela e selecionável. A faixa não tem arredondado
 * próprio — quem arredonda as pontas dela é o `overflow-hidden` do cartão, e é
 * por isso que o detalhe acompanha o raio das quinas sem nenhum ajuste.
 */
function CanhotoIdade({ categoria }: { categoria: CategoriaAninhada }) {
    return (
        <div
            className={`bg-muted text-muted-foreground relative flex w-fit flex-col items-center justify-center rounded-l-xl px-3`}
        >
            <span className="text-base font-bold tracking-wider whitespace-nowrap">
                {categoria.idadeMinima}-{categoria.idadeMaxima}
            </span>
            <span className="text-sm">Anos</span>
            {/* <span
                aria-hidden="true"
                className={`border-primary-foreground absolute right-0 h-full border-l border-dashed`}
            /> */}
        </div>
    );
}

function Dado({
    termo,
    valor,
}: {
    icone: React.ReactNode;
    termo: string;
    valor: string | null;
}) {
    return (
        <div className="bg-muted flex flex-col items-center justify-center rounded-md py-2 [&_svg]:size-4">
            <dt className="text-muted-foreground text-sm">{termo}</dt>
            <div className="flex items-center gap-2">
                <dd className="truncate text-sm font-normal">
                    {valor ?? "A definir"}
                </dd>
            </div>
        </div>
    );
}
