import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Faz a `formSheet` aparecer no Expo Go do Android. Chame na tela que abre
 * como folha.
 *
 * No Android, a folha só começa a entrar depois de receber as insets da
 * janela. No Expo Go o app vive dentro de uma activity que já as despachou, e
 * a folha fica montada mas invisível
 * (https://github.com/software-mansion/react-native-screens/issues/4010).
 * Esconder e mostrar a status bar despacha as insets de novo e a destrava.
 *
 * Só no Expo Go: num build do app a activity é dele, as insets chegam e a
 * status bar não pisca. Remova quando a issue for corrigida.
 */
export function useDestravarFormSheet() {
    useEffect(() => {
        if (
            Platform.OS !== "android" ||
            Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
        ) {
            return;
        }

        StatusBar.setHidden(true);
        const timeout = setTimeout(() => StatusBar.setHidden(false), 50);
        // Fechada antes do timeout, a folha não pode deixar a status bar oculta.
        return () => {
            clearTimeout(timeout);
            StatusBar.setHidden(false);
        };
    }, []);
}
