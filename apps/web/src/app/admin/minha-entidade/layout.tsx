import { Suspense } from "react";

import { PainelEntidadeSkeleton } from "~/features/entidades/entidade-detail/painel-entidade-skeleton";
import { PortaoDaEntidade } from "~/features/entidades/solicitar-acesso/portao-da-entidade";

/**
 * Portão de `/admin/minha-entidade` e de tudo abaixo dela.
 *
 * O layout em si não espera nada: devolve o boundary na hora, e é o
 * {@link PortaoDaEntidade} que suspende. Sem ele, a espera pelo perfil subiria
 * até o boundary mais próximo — que fica *acima* do layout do `/admin` — e
 * seguraria a sidebar e o header junto com a página. Com ele, a casca do
 * painel pinta na hora e só o miolo chega por streaming.
 *
 * O esqueleto cobre a página inteira, e não uma parte dela, porque o portão
 * decide se a página existe: não dá para pintar o conteúdo antes de saber se
 * ele deve aparecer.
 */
export default function MinhaEntidadeLayout(props: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<PainelEntidadeSkeleton />}>
            <PortaoDaEntidade>{props.children}</PortaoDaEntidade>
        </Suspense>
    );
}
