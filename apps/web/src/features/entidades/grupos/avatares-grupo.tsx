import { UserCircleDashedIcon } from "@phosphor-icons/react/dist/ssr/UserCircleDashed";

import type { IntegranteDoGrupo } from "@te-inscreve/schemas";

import { contagemIntegrantes } from "./grupo";

/** Quantos avatares cabem antes de virar "+N". */
const MAX_AVATARES = 3;

/** As iniciais de nome e sobrenome, para caber no avatar. */
function iniciais({ nome, sobrenome }: IntegranteDoGrupo): string {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
}

/**
 * A formação do grupo, como uma pilha de avatares — até três, e um "+N" se
 * sobrar gente.
 *
 * `integrantes` já vem recortado nos três primeiros pelo backend
 * (`firstThreeIntegrantes`): a listagem de grupos não carrega a formação
 * inteira, e trazê-la só para os avatares seria uma consulta cara para um
 * detalhe do cartão. `total` é quem decide o "+N" — pode passar de três
 * mesmo com só três iniciais em mãos.
 *
 * O total continua acessível pelo `title` e por um texto oculto — os avatares
 * são decoração da contagem, não a única forma de lê-la.
 */
export function AvataresGrupo({
    integrantes,
    total,
}: {
    integrantes: IntegranteDoGrupo[];
    total: number;
}) {
    if (total === 0) {
        return (
            <div className="text-muted-foreground flex items-center gap-1">
                <UserCircleDashedIcon aria-hidden="true" size={24} />
                <span className="text-xs">Sem integrantes</span>
            </div>
        );
    }

    const visiveis = integrantes.slice(0, MAX_AVATARES);
    const restantes = total - visiveis.length;

    return (
        <div className="flex items-center" title={contagemIntegrantes(total)}>
            <div aria-hidden="true" className="flex -space-x-2">
                {visiveis.map((integrante) => (
                    <span
                        key={integrante.id}
                        className="bg-muted text-muted-foreground ring-card flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2"
                    >
                        {iniciais(integrante)}
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
