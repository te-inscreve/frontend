import { Stack } from "expo-router";

import { opcoesComVoltar } from "~/components/botao-voltar";
import { opcoesPilha } from "~/utils/opcoes-pilha";

// O nome da ficha já vem logo abaixo, na própria ficha: a barra só volta.
const cabecalhoFicha = opcoesComVoltar("/avaliacoes");

export default function AvaliacoesLayout() {
    return (
        // O título fica na tela de entrada; as que empilharem aqui dão o seu.
        <Stack screenOptions={opcoesPilha}>
            <Stack.Screen name="index" options={{ title: "Avaliações" }} />
            <Stack.Screen
                name="ficha-teste"
                options={{ title: "Ficha de teste", ...cabecalhoFicha }}
            />
            <Stack.Screen
                name="ficha-simples"
                options={{ title: "Ficha rápida", ...cabecalhoFicha }}
            />
        </Stack>
    );
}
