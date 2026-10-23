import { Text, View } from "react-native";

import type { ModificadorNota } from "@te-inscreve/schemas";

import { cn } from "~/utils/cn";

// O rótulo do web (`editor-modelo-ficha/lib/campo-exibido.ts`).
const ROTULO_MODIFICADOR: Record<ModificadorNota, string> = {
    SOMA: "Soma",
    DESCONTA: "Subtrai",
};

/**
 * O que a nota do campo numérico faz com o total, no selo do `SeloModificador`
 * do web: verde quando soma, vermelho quando subtrai. O mesmo na edição e na
 * ficha.
 */
export function SeloModificador({
    modificador,
}: {
    modificador: ModificadorNota;
}) {
    const desconta = modificador === "DESCONTA";
    return (
        <View
            className={cn(
                "rounded-[4px] px-1.5",
                desconta ? "bg-destructive/15" : "bg-primary/15",
            )}
        >
            <Text
                className={cn(
                    "text-xs font-semibold",
                    desconta ? "text-destructive" : "text-primary",
                )}
            >
                {ROTULO_MODIFICADOR[modificador]}
            </Text>
        </View>
    );
}
