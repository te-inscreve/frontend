import { Stack } from "expo-router";

import { opcoesPilha } from "~/utils/opcoes-pilha";

export default function AvaliacoesLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack screenOptions={opcoesPilha}>
            <Stack.Screen name="index" options={{ title: "Avaliações" }} />
            <Stack.Screen
                name="ficha-teste"
                options={{ title: "Ficha de teste" }}
            />
        </Stack>
    );
}
