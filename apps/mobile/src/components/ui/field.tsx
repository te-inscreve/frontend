import type { TextProps, ViewProps } from "react-native";
import { Text, View } from "react-native";

import { cn } from "~/utils/cn";

/*
 * A mesma composição do web (`FieldGroup` → `Field` → `FieldLabel` → controle
 * → `FieldError`), em RN. O rótulo se liga ao controle por `nativeID` +
 * `aria-labelledby`, o par do `htmlFor`/`id`.
 */

function FieldGroup({
    className,
    ...props
}: ViewProps & { className?: string }) {
    return <View className={cn("gap-5", className)} {...props} />;
}

function Field({ className, ...props }: ViewProps & { className?: string }) {
    return <View className={cn("gap-2", className)} {...props} />;
}

function FieldLabel({
    className,
    invalido = false,
    ...props
}: TextProps & { className?: string; invalido?: boolean }) {
    return (
        <Text
            className={cn(
                "text-foreground text-sm font-medium",
                invalido && "text-destructive",
                className,
            )}
            {...props}
        />
    );
}

function FieldError({
    className,
    children,
    ...props
}: TextProps & { className?: string }) {
    if (!children) return null;

    return (
        <Text
            role="alert"
            aria-live="polite"
            className={cn("text-destructive text-sm", className)}
            {...props}
        >
            {children}
        </Text>
    );
}

export { Field, FieldError, FieldGroup, FieldLabel };
