import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";

type Tema = "light" | "dark";

const CHAVE = "te-inscreve.tema";

/**
 * Aplica o tema salvo antes da primeira pintura. A leitura é síncrona de
 * propósito: chamada no topo do layout raiz, o tema já está certo quando o
 * React monta, sem esperar a splash nem pintar o tema errado antes.
 *
 * Sem escolha salva, o Uniwind continua no tema do sistema (`system`).
 */
export function aplicarTemaSalvo() {
    const salvo = SecureStore.getItem(CHAVE);
    if (salvo === "light" || salvo === "dark") Uniwind.setTheme(salvo);
}

/**
 * Troca o tema do app inteiro e guarda a escolha no aparelho. O `setTheme`
 * também muda o `Appearance` do RN, então a barra de status e os controles
 * nativos acompanham.
 */
export function escolherTema(tema: Tema) {
    Uniwind.setTheme(tema);
    // Se a gravação falhar, o tema vale até fechar o app: não há o que mostrar.
    void SecureStore.setItemAsync(CHAVE, tema).catch(() => undefined);
}
