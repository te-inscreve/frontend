import { SafeAreaView, Text, View } from "react-native";
import { Stack } from "expo-router";

import { useSession } from "~/utils/auth";

export default function Index() {
    const { data: session } = useSession();

    return (
        <SafeAreaView className="bg-background">
            <Stack.Screen options={{ title: "te inscreve" }} />
            <View className="h-full w-full gap-4 p-4">
                <Text className="text-foreground text-3xl font-bold">
                    te <Text className="text-primary">inscreve</Text>
                </Text>

                <Text className="text-muted-foreground">
                    O app consome o mesmo tRPC do app web, que por sua vez
                    repassa para a API REST.
                </Text>

                <View className="border-border rounded-lg border p-4">
                    <Text className="text-foreground">
                        {session
                            ? `Sessão ativa: ${session.user.email}`
                            : "Nenhuma sessão ativa."}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
