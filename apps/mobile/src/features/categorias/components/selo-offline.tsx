import { Text, View } from "react-native";
import { CloudCheckIcon } from "phosphor-react-native/src/icons/CloudCheck";
import { CloudSlashIcon } from "phosphor-react-native/src/icons/CloudSlash";
import { withUniwind } from "uniwind";

import { cn } from "~/utils/cn";

const IconeBaixada = withUniwind(CloudCheckIcon);
const IconeNaoBaixada = withUniwind(CloudSlashIcon);

/**
 * Se a categoria pode ser avaliada sem rede (TE-107): com as inscrições e o
 * modelo de ficha no aparelho, ou ainda não. O ícone é decorativo; o texto
 * diz tudo.
 */
export function SeloOffline({
    disponivel,
    className,
}: {
    disponivel: boolean;
    className?: string;
}) {
    const Icone = disponivel ? IconeBaixada : IconeNaoBaixada;

    return (
        <View className={cn("flex-row items-center gap-1", className)}>
            <View aria-hidden>
                <Icone
                    size={14}
                    weight="bold"
                    colorClassName={
                        disponivel
                            ? "accent-primary"
                            : "accent-muted-foreground"
                    }
                />
            </View>
            <Text
                className={cn(
                    "text-xs font-medium",
                    disponivel ? "text-primary" : "text-muted-foreground",
                )}
            >
                {disponivel ? "Disponível offline" : "Ainda não baixada"}
            </Text>
        </View>
    );
}
