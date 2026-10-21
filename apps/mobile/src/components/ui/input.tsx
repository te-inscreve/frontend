import type { Ref } from "react";
import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";

import { cn } from "~/utils/cn";

type InputProps = TextInputProps & {
    ref?: Ref<TextInput>;
    className?: string;
    /**
     * Marca o campo com o vermelho de erro. O RN não tem `aria-invalid`:
     * quem anuncia o erro ao leitor de tela é o `accessibilityHint`, que o
     * formulário preenche com a mensagem.
     */
    invalido?: boolean;
};

/** Campo de texto sobre o `TextInput` do RN, com o visual do `Input` do web. */
function Input({ className, invalido = false, ...props }: InputProps) {
    return (
        <TextInput
            className={cn(
                "border-input bg-background text-foreground focus:border-ring h-12 rounded-md border px-3 text-base",
                invalido && "border-destructive focus:border-destructive",
                props.editable === false && "opacity-50",
                className,
            )}
            placeholderTextColorClassName="accent-muted-foreground"
            cursorColorClassName="accent-primary"
            selectionColorClassName="accent-primary"
            {...props}
        />
    );
}

export { Input };
export type { InputProps };
