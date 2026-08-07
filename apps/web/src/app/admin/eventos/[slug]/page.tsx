import { use } from "react";
import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";

export default function EventoDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Evento Detail {slug}
            </h1>
            <p className="text-muted-foreground">
                Página de detalhes do evento do admin entidades.
            </p>
        </div>
    );
}
