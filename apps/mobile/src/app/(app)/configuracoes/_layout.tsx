import { Stack } from "expo-router";

export default function ConfiguracoesLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack>
            <Stack.Screen name="index" options={{ title: "Configurações" }} />
        </Stack>
    );
}
