import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";

export default function EventosPage() {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Eventos
            </h1>
            <p className="text-muted-foreground">
                Página de eventos do admin entidades.
            </p>
        </div>
    );
}
