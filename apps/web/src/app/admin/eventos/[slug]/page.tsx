import { use } from "react";
import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@te-inscreve/components";

import { ListCategorias } from "~/features/eventos/evento-detail/list-categorias";
import { GoBackButton } from "~/shared/ui/back-btn";
import { detalheEvento } from "./mock";

export default function EventoDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    // `value` de cada aba é string, então o padrão também precisa ser — e fica
    // indefinido quando não há modalidade nenhuma para selecionar.
    const primeiraModalidade = detalheEvento.modalidades[0]?.id;
    const modalidadePadrao =
        primeiraModalidade === undefined
            ? undefined
            : String(primeiraModalidade);
    return (
        <div className="flex min-h-screen flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
            <GoBackButton href="/admin/eventos" />
            <h1 className="shimmer shimmer-once shimmer-color-primary-foreground text-primary text-4xl font-bold">
                <ConfettiIcon className="mr-2 inline-flex" weight="duotone" />
                Evento Detail {slug}
            </h1>
            <p className="text-muted-foreground">
                Página de detalhes do evento do admin entidades.
            </p>

            <h3 className="text-xl font-bold">Modalidades e categorias</h3>
            <Tabs defaultValue={modalidadePadrao}>
                <TabsList variant="line">
                    {detalheEvento.modalidades.map((modalidade) => (
                        <TabsTrigger
                            key={modalidade.id}
                            value={String(modalidade.id)}
                        >
                            {modalidade.nome}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {detalheEvento.modalidades.map((modalidade) => (
                    <TabsContent
                        key={modalidade.id}
                        value={String(modalidade.id)}
                        className="mt-4 w-full"
                    >
                        <ListCategorias modalidade={modalidade} />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
