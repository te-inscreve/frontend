import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "~/components/ui/button";
import { queryClient } from "~/utils/api";
import { signOut, useSession } from "~/utils/auth";

export default function Configuracoes() {
    const { data: session } = useSession();
    const [saindo, setSaindo] = useState(false);

    async function sair() {
        setSaindo(true);
        // Sem resposta, o `signOut` rejeita em vez de devolver `{ error }`.
        const { error } = await signOut()
            .catch(() => ({ error: true }))
            .finally(() => setSaindo(false));

        if (error) {
            Alert.alert(
                "Não foi possível sair",
                "Confira sua conexão e tente novamente.",
            );
            return;
        }
        // O guard do layout já leva ao login; o cache não pode sobrar para o
        // próximo avaliador que entrar neste aparelho.
        queryClient.clear();
    }

    return (
        <View className="flex-1 gap-4 p-4">
            <View className="border-border rounded-lg border p-4">
                <Text className="text-foreground">
                    Sessão ativa: {session?.user.email}
                </Text>
            </View>

            <Button
                variant="outline"
                disabled={saindo}
                onPress={() => void sair()}
            >
                Sair
            </Button>
        </View>
    );
}
