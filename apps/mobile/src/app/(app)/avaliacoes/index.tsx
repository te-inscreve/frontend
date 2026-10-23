import { Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "~/components/ui/button";

export default function Avaliacoes() {
    return (
        <View className="flex-1 items-center justify-center gap-4 p-4">
            <Text className="text-muted-foreground">
                Suas avaliações aparecem aqui.
            </Text>
            {/* MOCK (TE-82): atalhos para as telas de teste da ficha. */}
            <Button
                variant="outline"
                onPress={() => router.push("/avaliacoes/ficha-teste")}
            >
                Ficha de teste
            </Button>
            <Button
                variant="outline"
                onPress={() => router.push("/avaliacoes/ficha-simples")}
            >
                Ficha rápida
            </Button>
        </View>
    );
}
