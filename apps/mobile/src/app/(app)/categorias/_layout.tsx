import { Stack } from "expo-router";

export default function CategoriasLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack>
            <Stack.Screen name="index" options={{ title: "Categorias" }} />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
