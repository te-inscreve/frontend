import type { ReactNode } from "react";

interface Props {
    titulo: string;
    /** Uma linha dizendo para que serve a seção. Ajuda quem abre a tela pela primeira vez. */
    descricao?: string;
    icone: ReactNode;
    /** Contagem, atalho ou filtro alinhado à direita do título. */
    acao?: ReactNode;
    children: ReactNode;
}

/**
 * Cabeçalho padrão das seções do painel.
 *
 * A página é uma pilha de blocos independentes, e sem um título com o mesmo
 * peso em todos eles cada seção pareceria de uma tela diferente.
 */
export function Secao({ titulo, descricao, icone, acao, children }: Props) {
    return (
        <section className="flex h-full flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                        <span aria-hidden="true" className="text-primary flex">
                            {icone}
                        </span>
                        {titulo}
                    </h2>
                    {descricao && (
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            {descricao}
                        </p>
                    )}
                </div>
                {acao}
            </div>

            {children}
        </section>
    );
}
