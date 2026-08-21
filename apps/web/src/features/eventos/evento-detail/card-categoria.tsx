import { TicketIcon } from "@phosphor-icons/react/dist/ssr/Ticket";

import { Badge } from "@te-inscreve/components";

import type { DetalheEvento } from "~/app/admin/eventos/[slug]/mock";

interface Props {
    categoria: DetalheEvento["modalidades"][number]["categorias"][number];
}

export function CardCategoria({ categoria }: Props) {
    return (
        <div className="bg-card w-100 shrink-0 rounded-md border p-4">
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
                    {2} / {categoria.maxInscricoes} Inscrições realizadas
                </span>
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
