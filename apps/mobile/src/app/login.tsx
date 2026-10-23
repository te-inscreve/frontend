import {
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { LoginForm } from "~/features/auth/components/login-form";
import gauchinho from "../../assets/gauchinho.png";

// O Uniwind só estiliza os componentes do próprio RN; o `SafeAreaView` do RN
// não protege nada no Android.
const SafeAreaView = withUniwind(RNSafeAreaView);

export default function Login() {
    return (
        <SafeAreaView className="bg-background flex-1">
            <KeyboardAvoidingView behavior="padding" className="flex-1">
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName="grow items-center justify-center gap-8 px-6 py-12"
                >
                    <View className="items-center gap-4">
                        <Image
                            source={gauchinho}
                            accessibilityIgnoresInvertColors
                            alt="Gauchinho, mascote do Te Inscreve"
                            className="size-24"
                        />
                        <Text
                            role="heading"
                            className="text-foreground text-3xl font-semibold"
                        >
                            Entrar
                        </Text>
                        <Text className="text-muted-foreground text-center">
                            Use a conta do te inscreve para avaliar as
                            inscrições.
                        </Text>
                    </View>

                    <View className="w-full max-w-sm">
                        <LoginForm />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
