import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "~/components/ui/avatar";
import { trpc } from "~/utils/api";
import { useSession } from "~/utils/auth";
import { urlDoAparelho } from "~/utils/base-url";
import { primeiroNome } from "../lib/primeiro-nome";

/**
 * Foto e "Olá, <primeiro nome>" do avaliador logado, sobre a cor primária do
 * cabeçalho. Encolhe e trunca o nome antes de empurrar o que vem ao lado.
 *
 * A foto sai de `perfil.me`, como no menu do usuário do web — a sessão não
 * traz uma. Enquanto o perfil carrega, ou se ele falhar, o avatar mostra as
 * iniciais no mesmo tamanho: a foto é enfeite, nada se desloca na troca.
 */
export function SaudacaoAvaliador() {
    const { data: session } = useSession();
    const { data: perfil } = useQuery({
        ...trpc.perfil.me.queryOptions(),
        enabled: !!session,
    });

    // O cabeçalho só existe atrás do guard da sessão: sem ela não há o que
    // saudar, e o guard já está levando para o login.
    if (!session) return null;

    return (
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Avatar
                uri={perfil?.photo && urlDoAparelho(perfil.photo)}
                nome={session.user.name}
                className="bg-primary-foreground/20"
                textoClassName="text-primary-foreground"
                iconeClassName="accent-primary-foreground"
            />
            <Text
                numberOfLines={1}
                className="text-primary-foreground shrink text-base font-semibold"
            >
                Olá, {primeiroNome(session.user.name)}
            </Text>
        </View>
    );
}
