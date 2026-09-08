import { SemEntidade } from "~/features/entidades/entidade-detail/sem-entidade";
import { getEntidades } from "~/features/entidades/lib/get-entidades";
import { FormularioSolicitarAcesso } from "./formulario-solicitar-acesso";

/**
 * O que o painel oferece a quem ainda não pertence a nenhuma entidade.
 *
 * Busca as entidades e escolhe entre pedir acesso a uma delas e o aviso seco
 * de que não há nenhuma. A decisão mora aqui, e não em quem chama, porque os
 * dois chamadores — o portão do segmento e o cabeçalho do painel — precisam
 * dela igual, e só um deles saberia buscar a lista.
 */
export async function SolicitarAcesso() {
    const entidades = await getEntidades();

    if (entidades.length === 0) return <SemEntidade />;

    return <FormularioSolicitarAcesso entidades={entidades} />;
}
