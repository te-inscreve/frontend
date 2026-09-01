import { AvisoDadosExemplo } from "~/features/entidades/entidade-detail/aviso-dados-exemplo";
import { PainelIntegrantes } from "~/features/entidades/integrantes/painel-integrantes";
import { integrantesMock } from "~/features/entidades/shared/integrantes";

export const metadata = {
    title: "Integrantes | Te Inscreve",
    description: "Cadastro e listagem dos integrantes da entidade",
};

/**
 * Tela de integrantes da entidade.
 *
 * A API ainda não expõe o recurso: a página só entrega o mock ao painel, que é
 * quem guarda o estado. Quando as rotas existirem, o que muda é a origem
 * desta lista — o painel continua igual.
 */
export default function IntegrantesPage() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <AvisoDadosExemplo />
            <PainelIntegrantes integrantesIniciais={integrantesMock} />
        </div>
    );
}
