import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr/Buildings";

import { TelaAviso } from "~/shared/ui/tela-aviso";

/**
 * Conta sem vínculo, e sem entidade nenhuma para pedir acesso.
 *
 * É o fundo do poço de `SolicitarAcesso`: sem opções na lista, não há o que
 * oferecer, então resta dizer a quem procurar. Ocupa a tela inteira porque
 * integrantes, grupos e premiações são todos *da* entidade — sem vínculo não
 * sobra nada em volta, e um cabeçalho vazio cercado de seções de mock daria a
 * entender que existe algo ali.
 */
export function SemEntidade() {
    return (
        <TelaAviso
            icone={
                <BuildingsIcon
                    aria-hidden="true"
                    className="text-muted-foreground"
                    size={48}
                    weight="duotone"
                />
            }
            titulo="Nenhuma entidade vinculada"
        >
            <p className="text-muted-foreground max-w-sm text-sm">
                Sua conta ainda não está vinculada a uma entidade, e não há
                nenhuma cadastrada para solicitar acesso. Fale com a
                organização.
            </p>
        </TelaAviso>
    );
}
