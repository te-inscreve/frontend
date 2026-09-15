import { proximaPagina } from "@te-inscreve/schemas";

import { PainelIntegrantes } from "~/features/entidades/integrantes/painel-integrantes";
import { HydrateClient, prefetch, trpc } from "~/shared/api/trpc/server";

export const metadata = {
    title: "Integrantes | Te Inscreve",
    description: "Cadastro e listagem dos integrantes da entidade",
};

const INTEGRANTES_POR_PAGINA = 10;

/**
 * Tela de integrantes da entidade.
 *
 * A primeira página é disparada aqui e hidratada no painel, que é um Client
 * Component: é ele que rola, cadastra e edita, então a query precisa viver no
 * navegador. As páginas seguintes já saem de lá.
 *
 * Não checa vínculo: o layout do segmento já o faz por todas as rotas daqui.
 */
export default function IntegrantesPage() {
    void prefetch(
        trpc.integrante.list.infiniteQueryOptions(
            { pageSize: INTEGRANTES_POR_PAGINA },
            { getNextPageParam: proximaPagina },
        ),
    );

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <HydrateClient>
                <PainelIntegrantes pageSize={INTEGRANTES_POR_PAGINA} />
            </HydrateClient>
        </div>
    );
}
