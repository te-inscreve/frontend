import type { NativeStackNavigationOptions } from "expo-router";

/**
 * As opções de toda pilha de aba, que fica logo abaixo do `CabecalhoApp`.
 *
 * O cabeçalho já cobre a status bar, mas a barra nativa do Android aplica a
 * área segura do topo por conta própria, lida da janela e não do contexto do
 * safe-area. Sem desligar isso, cada barra ganharia um vão do tamanho da
 * status bar acima do título.
 */
export const opcoesPilha: NativeStackNavigationOptions = {
    unstable_nativeProps: {
        headerConfig: { disableTopInsetApplication: true },
    },
};
