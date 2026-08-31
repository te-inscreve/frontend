import { MedalIcon } from "@phosphor-icons/react/dist/ssr/Medal";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";

import type { PremiacaoMock } from "./mock-entidade";

interface Props {
    premiacoes: PremiacaoMock[];
}

/**
 * O que a entidade trouxe dos últimos eventos, agrupado por evento.
 *
 * Agrupar é o que faz a seção contar uma história: solto, o mesmo conteúdo
 * vira uma lista de linhas iguais, e não a campanha de cada ano.
 */
export function ListaPremiacoes({ premiacoes }: Props) {
    if (premiacoes.length === 0) {
        return (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                Nenhuma premiação registrada ainda. As colocações dos eventos
                aparecem aqui assim que forem apuradas.
            </p>
        );
    }

    // Os eventos saem na ordem em que aparecem na lista, do mais recente para
    // o mais antigo — a mesma ordem em que a entidade os viveu.
    const porEvento = new Map<string, PremiacaoMock[]>();
    for (const premiacao of [...premiacoes].sort((a, b) => b.ano - a.ano)) {
        const chave = `${premiacao.evento} ${premiacao.ano}`;
        porEvento.set(chave, [...(porEvento.get(chave) ?? []), premiacao]);
    }

    return (
        <div className="flex flex-col gap-4">
            {[...porEvento.values()].map((doEvento) => {
                // Todas as premiações do grupo são do mesmo evento, então a
                // primeira serve de cabeçalho.
                const [primeira] = doEvento;
                if (!primeira) return null;

                return (
                    <div
                        key={`${primeira.evento} ${primeira.ano}`}
                        className="bg-card flex flex-col gap-3 rounded-xl border p-4"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <h3 className="text-base font-bold text-balance">
                                {primeira.evento}
                            </h3>
                            <p className="text-muted-foreground text-sm tabular-nums">
                                {primeira.ano}
                            </p>
                        </div>

                        <ul className="grid gap-2 sm:grid-cols-2">
                            {doEvento.map((premiacao) => (
                                <ItemPremiacao
                                    key={premiacao.id}
                                    premiacao={premiacao}
                                />
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * O primeiro lugar é o único com cor: dourado é o acento festivo previsto no
 * design, e usá-lo nos três degraus tiraria dele o significado de vitória.
 */
const POSICOES = {
    1: { rotulo: "1º lugar", estilo: "bg-warning/15 text-warning-foreground" },
    2: { rotulo: "2º lugar", estilo: "bg-muted text-muted-foreground" },
    3: { rotulo: "3º lugar", estilo: "bg-muted text-muted-foreground" },
} as const;

function ItemPremiacao({ premiacao }: { premiacao: PremiacaoMock }) {
    const posicao = POSICOES[premiacao.colocacao];

    return (
        <li className="flex items-center gap-3 rounded-md border p-3">
            <span
                aria-hidden="true"
                className={`${posicao.estilo} flex size-9 shrink-0 items-center justify-center rounded-full`}
            >
                {premiacao.colocacao === 1 ? (
                    <TrophyIcon size={18} weight="fill" />
                ) : (
                    <MedalIcon size={18} />
                )}
            </span>

            <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                    {posicao.rotulo} · {premiacao.participante}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                    {premiacao.modalidade} · {premiacao.categoria}
                </p>
            </div>
        </li>
    );
}
