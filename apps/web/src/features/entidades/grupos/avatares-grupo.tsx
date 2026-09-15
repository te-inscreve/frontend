import { contagemIntegrantes } from "./grupo";

/** Quantos avatares cabem antes de virar "+N". */
const MAX_AVATARES = 3;

/**
 * Iniciais de gente inventada, para preencher os avatares que o cartão de
 * grupo mostra — ver o porquê em {@link AvataresGrupo}.
 */
const INICIAIS_MOCK: readonly string[] = [
    "MS",
    "JP",
    "AF",
    "RC",
    "LT",
    "CB",
    "PV",
    "NG",
];

/**
 * Escolhe uma inicial da lista a partir do grupo e da posição do avatar —
 * espalhado o suficiente para os três avatares de um mesmo grupo não caírem
 * sempre na mesma letra, e para dois grupos vizinhos não se parecerem. Mesma
 * ideia do `escolher` de `shared/historico-integrante.ts`.
 */
function escolherIniciais(grupoId: number, posicao: number): string {
    const indice = (grupoId * 7 + posicao * 5) % INICIAIS_MOCK.length;
    // O `??` é só para o TypeScript: o índice sempre cai dentro do array.
    return INICIAIS_MOCK[indice] ?? "??";
}

/**
 * A formação do grupo, como uma pilha de avatares — até três, e um "+N" se
 * sobrar gente.
 *
 * As iniciais são inventadas. `GrupoListSerializer` devolve só
 * `totalIntegrantes`, não quem são essas pessoas — a listagem de grupos não
 * carrega a formação, e trazê-la só para isto seria uma consulta cara para um
 * detalhe decorativo do cartão. Por isso os avatares mostram a contagem
 * visualmente, no lugar do badge que fazia isso em texto, mas não retratam
 * ninguém: quem quer ver a formação de verdade abre o grupo. Quando o backend
 * tiver um preview da formação na listagem, é só trocar `escolherIniciais`
 * pelas iniciais reais.
 *
 * O total continua acessível pelo `title` e por um texto oculto — os avatares
 * são decoração da contagem, não a única forma de lê-la.
 */
export function AvataresGrupo({
    grupoId,
    total,
}: {
    grupoId: number;
    total: number;
}) {
    if (total === 0) {
        return (
            <span className="text-muted-foreground text-xs">
                Sem integrantes
            </span>
        );
    }

    const visiveis = Math.min(total, MAX_AVATARES);
    const restantes = total - visiveis;

    return (
        <div className="flex items-center" title={contagemIntegrantes(total)}>
            <div aria-hidden="true" className="flex -space-x-2">
                {Array.from({ length: visiveis }, (_, posicao) => (
                    <span
                        key={posicao}
                        className="bg-muted text-muted-foreground ring-card flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2"
                    >
                        {escolherIniciais(grupoId, posicao)}
                    </span>
                ))}

                {restantes > 0 && (
                    <span className="bg-muted text-muted-foreground ring-card flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2">
                        +{restantes}
                    </span>
                )}
            </div>

            <span className="sr-only">{contagemIntegrantes(total)}</span>
        </div>
    );
}
