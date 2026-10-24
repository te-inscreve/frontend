import { Text, View } from "react-native";

/**
 * Um par termo/valor dos cabeçalhos em faixa `muted`: o termo pequeno e
 * apagado em cima, o valor em destaque embaixo. Usado no detalhe da categoria
 * e nos dados da inscrição avaliada, na ficha.
 */
export function Dado({ termo, children }: { termo: string; children: string }) {
    return (
        <View className="gap-0.5">
            <Text className="text-muted-foreground text-sm">{termo}</Text>
            <Text className="text-foreground text-base font-semibold">
                {children}
            </Text>
        </View>
    );
}
