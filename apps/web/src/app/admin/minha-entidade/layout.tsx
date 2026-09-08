import { Suspense } from "react";

import { temEntidade } from "@te-inscreve/schemas";

import { PainelEntidadeSkeleton } from "~/features/entidades/entidade-detail/painel-entidade-skeleton";
import { SolicitarAcesso } from "~/features/entidades/solicitar-acesso/solicitar-acesso";
import { getPerfil } from "~/features/usuarios/lib/get-perfil";

/**
 * Portão de `/admin/minha-entidade` e de tudo abaixo dela.
 *
 * O layout em si não espera nada: devolve o boundary na hora, e é o
 * `PortaoDaEntidade` que suspende. Sem ele, a espera pelo perfil subiria até o
 * boundary mais próximo — que fica *acima* do layout do `/admin` — e seguraria
 * a sidebar e o header junto com a página. Com ele, a casca do painel pinta na
 * hora e só o miolo chega por streaming.
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

/**
 * Deixa passar só quem tem vínculo com uma entidade.
 *
 * Envolve o segmento inteiro — índice, integrantes, grupos e o que vier —, e
 * não um grupo de rotas: quem não tem vínculo recebe o pedido de acesso em
 * qualquer uma delas. A URL continua a que o usuário pediu; troca só o
 * conteúdo. É deliberado que nenhuma rota daqui escape, porque todas mostram
 * dados *da* entidade — sem vínculo, deixar passar exibiria as listas de mock
 * como se fossem de alguém.
 *
 * O vínculo vem do perfil, e não de um 403 do `/minha-entidade`: o backend
 * responde 403 tanto para quem não tem entidade quanto para quem não tem
 * permissão, e os dois casos pedem telas diferentes. Ver {@link temEntidade}.
 *
 * A leitura do perfil fica 60 segundos no Data Cache do Next, então esta
 * espera some no segundo acesso — o esqueleto do layout é para o primeiro.
 *
 * Falta de permissão de verdade não passa por aqui: quem a detectar chama
 * `forbidden()` e cai no `forbidden.tsx` do `/admin`.
 */
async function PortaoDaEntidade(props: { children: React.ReactNode }) {
    const perfil = await getPerfil();

    if (!perfil || !temEntidade(perfil)) return <SolicitarAcesso />;

    return props.children;
}
