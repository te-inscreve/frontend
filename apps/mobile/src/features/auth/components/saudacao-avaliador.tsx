import { Text, View } from "react-native";

import { Avatar } from "~/components/ui/avatar";
import { useSession } from "~/utils/auth";
import { primeiroNome } from "../lib/primeiro-nome";

/**
 * Foto e "Olá, <primeiro nome>" do avaliador logado, sobre a cor primária do
 * cabeçalho. Encolhe e trunca o nome antes de empurrar o que vem ao lado.
 */
export function SaudacaoAvaliador() {
    const { data: session } = useSession();

    // O cabeçalho só existe atrás do guard da sessão: sem ela não há o que
    // saudar, e o guard já está levando para o login.
    if (!session) return null;

    return (
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Avatar
                uri={session.user.image}
                className="bg-primary-foreground/20"
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
