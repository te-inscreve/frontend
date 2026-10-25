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
                options={{
                    title: "Categorias para Avaliar",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={opcoesComVoltar("/categorias")}
            />
            {/* Na pilha de Categorias, acima do detalhe. O "Voltar" da ficha
                não segue a pilha: a própria tela o define
                (`useSaidasDaFicha`). */}
            <Stack.Screen name="ficha/[inscricaoId]" />
        </Stack>
    );
}
