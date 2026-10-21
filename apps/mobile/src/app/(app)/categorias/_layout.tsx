import { Stack } from "expo-router";

import { opcoesPilha } from "~/utils/opcoes-pilha";

export default function CategoriasLayout() {
    return (
        <Stack screenOptions={opcoesPilha}>
            {/*
             * A entrada desenha o próprio título, grande, acima da busca; o
             * `title` fica para o botão de voltar das telas empilhadas aqui,
             * que dão o seu.
             */}
            <Stack.Screen
                name="index"
                options={{ title: "Categorias", headerShown: false }}
            />
        </Stack>
    );
}
