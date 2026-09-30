import { temEntidade } from "@te-inscreve/schemas";

import { getPerfil } from "~/features/usuarios/lib/get-perfil";
import { SolicitarAcesso } from "./solicitar-acesso";

/**
 * Deixa passar só quem tem vínculo com uma entidade.
 *
 * Nasceu no layout de `/admin/minha-entidade`, envolvendo o segmento inteiro
 * — índice, integrantes, grupos e o que vier —, e não um grupo de rotas: quem
 * não tem vínculo recebe o pedido de acesso em qualquer uma delas. A URL
 * continua a que o usuário pediu; troca só o conteúdo. É deliberado que
 * nenhuma rota de lá escape, porque todas mostram dados *da* entidade — sem
 * vínculo, deixar passar exibiria as listas de mock como se fossem de alguém.
 *
 * Saiu do layout para um arquivo próprio quando a inscrição numa categoria
 * (`eventos/[slug]/modalidades/[slugModalidade]/categorias/[slugCategoria]/inscricoes/criar`)
 * passou a precisar do mesmo portão: ela lista grupos e integrantes da
 * entidade de quem está logado, fora do segmento `/minha-entidade`, e o
 * critério de quem pode vê-los é um só.
 *
 * O vínculo vem do perfil, e não de um 403 do `/minha-entidade`: o backend
 * responde 403 tanto para quem não tem entidade quanto para quem não tem
 * permissão, e os dois casos pedem telas diferentes. Ver {@link temEntidade}.
 *
 * A leitura do perfil fica 60 segundos no Data Cache do Next, então esta
 * espera some no segundo acesso — o esqueleto de quem chama é para o
 * primeiro.
 *
 * Falta de permissão de verdade não passa por aqui: quem a detectar chama
 * `forbidden()` e cai no `forbidden.tsx` do `/admin`.
 */
export async function PortaoDaEntidade(props: { children: React.ReactNode }) {
    const perfil = await getPerfil();

    if (!perfil || !temEntidade(perfil)) return <SolicitarAcesso />;

    return props.children;
}
