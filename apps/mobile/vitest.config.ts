import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Só a lógica pura do app (o motor da fila): nada de React Native aqui. O
 * que importa `react-native` ou `expo-*` não roda no Node.
 */
export default defineConfig({
    resolve: {
        alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
        include: ["src/**/*.test.ts"],
    },
});
