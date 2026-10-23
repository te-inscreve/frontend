import { Stack } from "expo-router";

import { opcoesComVoltar } from "~/components/botao-voltar";
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
            <Stack.Screen
                name="[id]"
                options={opcoesComVoltar("/categorias")}
            />
            {/* Na pilha de Categorias, acima do detalhe: o "Voltar" da ficha
                retorna à categoria de onde ela foi aberta. */}
            <Stack.Screen
                name="ficha/[inscricaoId]"
                options={opcoesComVoltar("/categorias")}
            />
        </Stack>
    );
}
