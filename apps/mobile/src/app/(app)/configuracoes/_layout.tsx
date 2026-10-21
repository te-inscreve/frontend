import { Stack } from "expo-router";

import { opcoesPilha } from "~/utils/opcoes-pilha";

export default function ConfiguracoesLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack screenOptions={opcoesPilha}>
            <Stack.Screen name="index" options={{ title: "Configurações" }} />
        </Stack>
    );
}
