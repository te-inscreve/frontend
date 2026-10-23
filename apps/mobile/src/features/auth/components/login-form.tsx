import type { TextInputInstance } from "react-native";
import { useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { Controller, useForm } from "react-hook-form";
import { withUniwind } from "uniwind";

import type { SignInFormValues } from "@te-inscreve/schemas";
import { signInFormSchema } from "@te-inscreve/schemas";

import { Button } from "~/components/ui/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useLogin } from "../lib/use-login";
import { PasswordInput } from "./password-input";

const Aviso = withUniwind(WarningCircleIcon);

export function LoginForm() {
    const { entrar, limparErro, erro, enviando } = useLogin();
    const senhaRef = useRef<TextInputInstance>(null);
    const form = useForm<SignInFormValues>({
        resolver: zodResolver(signInFormSchema),
        defaultValues: { email: "", senha: "" },
    });
    // Uma tentativa barrada pela validação não chega ao servidor: o erro da
    // anterior não vale mais para ela.
    const enviar = form.handleSubmit(
        (valores) => entrar(valores),
        () => limparErro(),
    );

    return (
        <View className="w-full gap-6">
            <FieldGroup>
                <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel
                                nativeID="rotulo-email"
                                invalido={fieldState.invalid}
                            >
                                E-mail
                            </FieldLabel>
                            <Input
                                ref={field.ref}
                                value={field.value}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                aria-labelledby="rotulo-email"
                                accessibilityHint={fieldState.error?.message}
                                invalido={fieldState.invalid}
                                editable={!enviando}
                                placeholder="voce@exemplo.com"
                                keyboardType="email-address"
                                autoComplete="email"
                                textContentType="emailAddress"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                submitBehavior="submit"
                                onSubmitEditing={() =>
                                    senhaRef.current?.focus()
                                }
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />

                <Controller
                    name="senha"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field>
                            <FieldLabel
                                nativeID="rotulo-senha"
                                invalido={fieldState.invalid}
                            >
                                Senha
                            </FieldLabel>
                            <PasswordInput
                                ref={(elemento) => {
                                    field.ref(elemento);
                                    senhaRef.current = elemento;
                                }}
                                value={field.value}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                aria-labelledby="rotulo-senha"
                                accessibilityHint={fieldState.error?.message}
                                invalido={fieldState.invalid}
                                editable={!enviando}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                textContentType="password"
                                returnKeyType="go"
                                onSubmitEditing={() => void enviar()}
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                    )}
                />
            </FieldGroup>

            {erro && (
                <View
                    role="alert"
                    aria-live="polite"
                    className="bg-destructive flex-row items-start gap-2 rounded-md p-3"
                >
                    <Aviso
                        size={18}
                        colorClassName="accent-destructive-foreground"
                        aria-hidden
                    />
                    <Text className="text-destructive-foreground flex-1 text-sm">
                        {erro}
                    </Text>
                </View>
            )}

            <Button
                disabled={enviando}
                onPress={() => void enviar()}
                icone={
                    enviando && (
                        <ActivityIndicator colorClassName="accent-primary-foreground" />
                    )
                }
            >
                Entrar
            </Button>
        </View>
    );
}
