import type { Control } from "react-hook-form";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { Controller } from "react-hook-form";
import { withUniwind } from "uniwind";

import type { ValoresFicha } from "@te-inscreve/schemas";
import { MAXIMO_NOME_OCORRENCIA } from "@te-inscreve/schemas";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const Lapis = withUniwind(PencilSimpleIcon);
const Concluir = withUniwind(CheckIcon);

/**
 * O nome da ocorrência, no título da folha, como o nome do concorrente no
 * ticket do web (`campo-nome-concorrente.tsx`). Na leitura é o título com um
 * lápis; o lápis troca o título por um campo e o check. "OK" no teclado, o
 * check e sair do campo encerram a edição.
 *
 * Apagado, o nome volta ao padrão ("Danças 2") em vez de virar erro: o padrão
 * é sempre válido no backend (TE-98). O `maxLength` segura os 255 caracteres
 * na digitação, então o nome não tem estado de erro.
 */
export function NomeOcorrencia({
    chave,
    padrao,
    control,
}: {
    chave: string;
    padrao: string;
    control: Control<ValoresFicha>;
}) {
    const [editando, setEditando] = useState(false);

    return (
        <Controller
            name={chave}
            control={control}
            render={({ field }) => {
                const nome = typeof field.value === "string" ? field.value : "";

                function concluir() {
                    if (!nome.trim()) field.onChange(padrao);
                    field.onBlur();
                    setEditando(false);
                }

                if (!editando)
                    return (
                        <Pressable
                            role="button"
                            aria-label={`Renomear ${nome.trim() || padrao}`}
                            onPress={() => setEditando(true)}
                            hitSlop={8}
                            className="flex-row items-center gap-2 self-start"
                        >
                            <Text
                                role="heading"
                                className="text-foreground shrink text-xl font-bold"
                            >
                                {nome.trim() || padrao}
                            </Text>
                            <Lapis
                                size={18}
                                colorClassName="accent-muted-foreground"
                                aria-hidden
                            />
                        </Pressable>
                    );

                return (
                    <View className="flex-row items-center gap-2">
                        <Input
                            ref={field.ref}
                            value={nome}
                            onChangeText={field.onChange}
                            onBlur={concluir}
                            onSubmitEditing={concluir}
                            autoFocus
                            selectTextOnFocus
                            maxLength={MAXIMO_NOME_OCORRENCIA}
                            returnKeyType="done"
                            autoCapitalize="sentences"
                            aria-label="Nome da ocorrência"
                            placeholder={padrao}
                            className="h-10 flex-1 text-xl font-bold"
                        />
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Concluir o nome"
                            onPress={concluir}
                            icone={
                                <Concluir
                                    size={20}
                                    colorClassName="accent-foreground"
                                />
                            }
                        />
                    </View>
                );
            }}
        />
    );
}
