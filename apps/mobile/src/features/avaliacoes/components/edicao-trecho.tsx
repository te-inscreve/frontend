import type { Control } from "react-hook-form";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { withUniwind } from "uniwind";

import type { TrechoFicha, ValoresFicha } from "../lib/formulario-ficha-mock";
import { Button } from "~/components/ui/button";
import { FieldGroup } from "~/components/ui/field";
import { CampoFichaControlado } from "./campo-ficha";

const IconeAplicar = withUniwind(CheckIcon);
const IconeCancelar = withUniwind(XIcon);

/**
 * MOCK (TE-82): o modal onde se preenche uma ocorrência de agrupamento, com
 * todos os campos dela. "Aplicar" chama `aoAplicar`, que decide se o modal
 * fecha; o fundo e o voltar do sistema chamam `aoFechar`, que fecha sempre e
 * guarda o que foi preenchido. "Cancelar" chama `aoCancelar`, que desfaz o
 * que foi mexido no modal antes de fechar.
 */
export function EdicaoTrecho({
    trecho,
    visivel,
    control,
    revalidar,
    aoAplicar,
    aoFechar,
    aoCancelar,
}: {
    trecho: TrechoFicha | undefined;
    visivel: boolean;
    control: Control<ValoresFicha>;
    revalidar: (chave: string) => Promise<boolean>;
    aoAplicar: () => void;
    aoFechar: () => void;
    aoCancelar: () => void;
}) {
    return (
        <Modal
            visible={visivel && !!trecho}
            transparent
            animationType="fade"
            onRequestClose={aoFechar}
        >
            <View className="flex-1 items-center justify-center p-4">
                <Pressable
                    aria-label="Fechar"
                    onPress={aoFechar}
                    className="absolute inset-0 bg-black/50"
                />
                <View
                    style={{ maxHeight: "100%" }}
                    className="bg-background w-full max-w-[560px] overflow-hidden rounded-2xl"
                >
                    <View className="bg-primary gap-0.5 px-5 py-4">
                        <Text
                            role="heading"
                            className="text-primary-foreground text-lg font-semibold"
                        >
                            {trecho?.titulo}
                        </Text>
                        {trecho?.subtitulo && (
                            <Text className="text-primary-foreground/80 text-sm">
                                {trecho.subtitulo}
                            </Text>
                        )}
                    </View>

                    <ScrollView
                        style={{ flexGrow: 0, flexShrink: 1 }}
                        keyboardShouldPersistTaps="handled"
                        contentContainerClassName="p-5"
                    >
                        <FieldGroup>
                            {trecho?.campos.map(({ chave, campo }) => (
                                <CampoFichaControlado
                                    key={chave}
                                    chave={chave}
                                    campo={campo}
                                    control={control}
                                    revalidar={revalidar}
                                />
                            ))}
                        </FieldGroup>
                    </ScrollView>

                    <View className="flex-row gap-3 px-5 pt-2 pb-5">
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1"
                            icone={
                                <IconeCancelar
                                    size={20}
                                    colorClassName="accent-foreground"
                                />
                            }
                            onPress={aoCancelar}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="lg"
                            className="flex-1"
                            icone={
                                <IconeAplicar
                                    size={20}
                                    colorClassName="accent-primary-foreground"
                                />
                            }
                            onPress={aoAplicar}
                        >
                            Aplicar
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
