import { Image, View } from "react-native";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { withUniwind } from "uniwind";

import { cn } from "~/utils/cn";

const IconeUsuario = withUniwind(UserIcon);

interface AvatarProps {
    /** Endereço da foto; nulo mostra o ícone de usuário no mesmo lugar. */
    uri: string | null | undefined;
    className?: string;
    /** Cor do ícone quando não há foto, como classe `accent-*`. */
    iconeClassName?: string;
}

/**
 * Foto redonda de 36pt, decorativa: quem identifica a pessoa é o texto ao
 * lado dela.
 */
export function Avatar({ uri, className, iconeClassName }: AvatarProps) {
    return (
        <View
            className={cn(
                "size-9 items-center justify-center overflow-hidden rounded-full",
                className,
            )}
        >
            {uri ? (
                <Image source={{ uri }} className="size-full" />
            ) : (
                <IconeUsuario
                    size={22}
                    weight="bold"
                    colorClassName={iconeClassName}
                />
            )}
        </View>
    );
}
