import { BugIcon } from "@phosphor-icons/react/dist/ssr";

import { GoBackButton } from "~/shared/ui/back-btn";

export default function EventoNotFound() {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton />

            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <BugIcon
                    aria-hidden="true"
                    className="text-muted-foreground"
                    size={48}
                    weight="duotone"
                />
                <h1 className="text-2xl font-bold">Página não encontrada</h1>
                <p className="text-muted-foreground max-w-sm text-sm">
                    O caminho que você procura não existe ou não está mais
                    disponível.
                </p>
            </div>
        </div>
    );
}
