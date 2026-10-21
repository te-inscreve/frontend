import { useState } from "react";
import { View } from "react-native";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { EyeSlashIcon } from "phosphor-react-native/src/icons/EyeSlash";
import { withUniwind } from "uniwind";

import type { InputProps } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/utils/cn";

const Olho = withUniwind(EyeIcon);
const OlhoRiscado = withUniwind(EyeSlashIcon);

/**
 * Campo de senha com alternância de visibilidade, como o `PasswordInput` do
 * web. Cada instância controla o próprio olho.
 */
export function PasswordInput({ className, ...props }: InputProps) {
    const [visivel, setVisivel] = useState(false);
    const Icone = visivel ? Olho : OlhoRiscado;

    return (
        <View>
            <Input
                {...props}
                secureTextEntry={!visivel}
                autoCapitalize="none"
                autoCorrect={false}
                className={cn("pr-12", className)}
            />
            <Button
                variant="ghost"
                size="icon"
                // Interruptor com rótulo fixo: quem muda é o `aria-checked`.
                aria-label="Mostrar senha"
                aria-checked={visivel}
                role="switch"
                hitSlop={4}
                className="absolute top-0 right-0"
                onPress={() => setVisivel((atual) => !atual)}
                icone={
                    <Icone size={20} colorClassName="accent-muted-foreground" />
                }
            />
        </View>
    );
}
