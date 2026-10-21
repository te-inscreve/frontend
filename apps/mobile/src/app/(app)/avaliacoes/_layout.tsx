import { Stack } from "expo-router";

export default function AvaliacoesLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack>
            <Stack.Screen name="index" options={{ title: "Avaliações" }} />
        </Stack>
    );
}
