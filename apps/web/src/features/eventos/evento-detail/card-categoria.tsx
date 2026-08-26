import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";
import { UserCheckIcon } from "@phosphor-icons/react/dist/ssr/UserCheck";

import type { CategoriaAninhada } from "@te-inscreve/schemas";
import { Badge } from "@te-inscreve/components";

interface Props {
    categoria: CategoriaAninhada;
}

export function CardCategoria({ categoria }: Props) {
    return (
        <div className="bg-card flex w-100 shrink-0 flex-col gap-1 rounded-md border p-4">
            <div className="flex justify-between">
                <h5 className="text-base font-bold">{categoria.nome}</h5>
                <CategoriaBadge />
            </div>
            <p className="text-muted-foreground text-sm">
                De {categoria.idadeMinima} a {categoria.idadeMaxima} anos
            </p>
            <p className="flex items-center">
                <TicketIcon className="mr-2 inline-flex" />
                <span className="text-sm font-medium">
                    {/* O total de inscritos ainda não vem da API. `maxInscricoes`
                        nulo é categoria sem teto, não zero. */}
                    {categoria.maxInscricoes === null
                        ? "Inscrições sem limite"
                        : `${2} / ${categoria.maxInscricoes} Inscrições realizadas`}
                </span>
            </p>
            <p className="text-muted-foreground flex items-center text-sm">
                <UserCheckIcon className="mr-2 inline-flex" />
                {/* Nulo é categoria sem avaliador definido, não zero avaliadores. */}
                {categoria.avaliadores === null
                    ? "Sem avaliadores definidos"
                    : `${categoria.avaliadores} ${categoria.avaliadores === 1 ? "avaliador" : "avaliadores"}`}
            </p>
        </div>
    );
}

function CategoriaBadge() {
    return (
        <Badge variant="default" className="flex items-center gap-1">
            Inscrições abertas
        </Badge>
    );
}
