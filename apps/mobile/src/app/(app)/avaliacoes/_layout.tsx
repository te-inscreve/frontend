import { Stack } from "expo-router";

import { opcoesPilha } from "~/utils/opcoes-pilha";

export default function AvaliacoesLayout() {
    return (
        <Stack screenOptions={opcoesPilha}>
            {/* A entrada desenha o próprio título, grande, como Categorias. */}
            <Stack.Screen
                name="index"
                options={{ title: "Minhas Avaliações", headerShown: false }}
            />
        </Stack>
    );
}
