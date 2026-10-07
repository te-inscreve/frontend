import { Separator } from "@te-inscreve/components";

interface Props {
    quantidade: number;
    /** Para onde foram, com a preposição: "no grupo", "na inscrição". */
    destino: string;
}

/**
 * Quantos já saíram da lista para o outro lado da bancada, numa linha miúda
 * fechando a lista — os nomes estão no destino. Sem ela a entidade pareceria
 * encolher a cada clique. Some quando ninguém saiu.
 *
 * `aria-live` para anunciar cada inclusão: o cartão clicado some, e sem isso
 * o leitor de tela não diria para onde foi.
 */
export function JaMovidos({ quantidade, destino }: Props) {
    if (quantidade === 0) return null;

    return (
        <div className="text-muted-foreground mt-3 flex items-center gap-2.5 py-1 text-xs">
            {/* `w-auto` desfaz o `w-full` do `Separator`, que com `shrink-0`
                estouraria a linha. */}
            <Separator className="w-auto flex-1" />

            <span aria-live="polite">
                +{" "}
                {quantidade === 1
                    ? "1 integrante"
                    : `${quantidade} integrantes`}{" "}
                {destino}
            </span>

            <Separator className="w-auto flex-1" />
        </div>
    );
}
