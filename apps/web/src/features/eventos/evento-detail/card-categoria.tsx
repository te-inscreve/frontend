import { useMemo } from "react";
import Link from "next/link";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/ssr/FlagCheckered";
import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UserCheckIcon } from "@phosphor-icons/react/dist/ssr/UserCheck";

import type { CategoriaAninhada } from "@te-inscreve/schemas";
import { Badge } from "@te-inscreve/components";

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
    const situacao = sortearSituacao();
    const estilo = ESTILOS[situacao];
    const totalInscritos = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        const ramdomAssNumber = Math.random();
        return categoria.maxInscricoes
            ? Math.floor(ramdomAssNumber * categoria.maxInscricoes)
            : 0;
    }, [categoria.maxInscricoes]);
    return (
        <Link
            href={`/admin/eventos/${eventoId}/categorias/${categoria.id}?modalidade=${modalidadeId}`}
            // A borda é o fundo desta camada, e o conteúdo é a de dentro: um
            // `border` comum não acompanharia a troca de cor no hover com a
            // mesma suavidade. O anel de foco fica de fora porque o
            // `overflow-hidden` de dentro o cortaria — quem sinaliza foco aqui
            // é a própria borda.
            className="bg-border focus-visible:bg-ring group block w-100 shrink-0 rounded-xl p-px transition-colors focus-visible:outline-none"
        >
            <div
                // `h-full` porque a fila de categorias é um flex row: sem ele a
                // camada de borda estica até a altura do cartão mais alto e a
                // de dentro não, deixando uma faixa da cor da borda no rodapé.
                //
                // `overflow-hidden` é o que faz o canhoto respeitar o
                // arredondado: ele encosta nas quatro bordas e é o recorte
                // desta camada que arredonda as pontas dele.
                className="bg-card relative flex h-full flex-col gap-3 overflow-hidden rounded-[calc(var(--radius-xl)-1px)] p-4 pl-14 transition-colors"
            >
                <CanhotoIdade categoria={categoria} estilo={estilo} />

                <div className="flex items-start justify-between gap-2">
                    <h5 className="text-base leading-tight font-bold">
                        {categoria.nome}
                    </h5>
                    <SituacaoBadge estilo={estilo} />
                </div>

                <dl className="border-border/70 grid grid-cols-2 gap-3 border-t pt-3">
                    <Dado
                        icone={<TicketIcon size={24} />}
                        termo="Inscrições"
                        // Nulo é categoria sem teto, e não zero inscrições. O
                        // total de inscritos ainda não vem da API.
                        valor={
                            categoria.maxInscricoes === null
                                ? "Sem limite"
                                : `${totalInscritos} / ${categoria.maxInscricoes}`
                        }
                    />
                    <Dado
                        icone={<UserCheckIcon size={24} />}
                        termo="Avaliadores"
                        // Nulo é categoria sem avaliador definido, não zero.
                        valor={
                            categoria.avaliadores === null
                                ? "A definir"
                                : String(categoria.avaliadores)
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
function CanhotoIdade({
    categoria,
    estilo,
}: {
    categoria: CategoriaAninhada;
    estilo: Estilo;
}) {
    return (
        <>
            <span
                className={`${estilo.canhoto} absolute inset-y-0 left-0 flex w-9 items-center justify-center`}
            >
                <span className="rotate-180 text-[11px] font-bold tracking-wider whitespace-nowrap [writing-mode:vertical-rl]">
                    {categoria.idadeMinima} a {categoria.idadeMaxima} anos
                </span>
            </span>
            <span
                aria-hidden="true"
                className={`${estilo.serrilha} absolute inset-0 left-9 border-l border-dashed`}
            />
        </>
    );
}

function Dado({
    icone,
    termo,
    valor,
}: {
    icone: React.ReactNode;
    termo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center gap-2 [&_svg]:size-4">
            <span aria-hidden="true" className="text-primary shrink-0">
                {icone}
            </span>
            <div className="min-w-0">
                <dt className="text-muted-foreground text-sm">{termo}</dt>
                <dd className="truncate text-base font-normal">{valor}</dd>
            </div>
        </div>
    );
}

function SituacaoBadge({ estilo }: { estilo: Estilo }) {
    return (
        <Badge
            variant={estilo.badge}
            className={`shrink-0 ${estilo.badgeExtra}`}
        >
            {estilo.icone}
            {estilo.rotulo}
        </Badge>
    );
}

/* -------------------------------------------------------------------------
 * Situação da categoria — provisório.
 *
 * A API ainda não devolve esse dado, então ele é sorteado a cada render só
 * para a variação visual dos estados ficar de pé. O sorteio é seguro aqui
 * porque o cartão é Server Component: o HTML é gerado uma vez no servidor e
 * não há re-render no cliente para divergir dele.
 * ---------------------------------------------------------------------- */

type Situacao = "correndo" | "abertas" | "comeca" | "encerrado";

interface Estilo {
    rotulo: string;
    icone: React.ReactNode;
    badge: "default" | "secondary" | "outline" | "destructive";
    badgeExtra: string;
    /** Fundo e cor do texto do canhoto. */
    canhoto: string;
    /** Cor da serrilha que separa o canhoto do miolo. */
    serrilha: string;
}

const ESTILOS: Record<Situacao, Estilo> = {
    correndo: {
        rotulo: "Ao vivo",
        // O ponto pulsando separa "acontecendo agora" de um estado apenas
        // favorável, como inscrições abertas.
        icone: (
            <span className="relative flex size-2">
                <span className="bg-destructive-foreground absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                <span className="bg-destructive-foreground relative inline-flex size-2 rounded-full"></span>
            </span>
        ),
        badge: "destructive",
        badgeExtra: "",
        canhoto: "bg-muted text-muted-foreground",
        serrilha: "border-border",
    },
    abertas: {
        rotulo: "Inscrições abertas",
        icone: <TicketIcon aria-hidden="true" />,
        badge: "outline",
        badgeExtra:
            "text-warning-foreground bg-warning border-warning border-transparent",
        canhoto: "bg-muted text-muted-foreground",
        serrilha: "border-border",
    },
    comeca: {
        rotulo: "Inscrições fechadas",
        icone: <CheckIcon aria-hidden="true" />,
        badge: "default",
        badgeExtra: "",
        canhoto: "bg-muted text-muted-foreground",
        serrilha: "border-border",
    },
    encerrado: {
        rotulo: "Encerrado",
        icone: <FlagCheckeredIcon aria-hidden="true" />,
        badge: "secondary",
        badgeExtra: "",
        canhoto: "bg-muted text-muted-foreground",
        serrilha: "border-border",
    },
};

const SITUACOES = ["correndo", "abertas", "comeca", "encerrado"] as const;

function sortearSituacao(): Situacao {
    return (
        SITUACOES[Math.floor(Math.random() * SITUACOES.length)] ?? SITUACOES[0]
    );
}
