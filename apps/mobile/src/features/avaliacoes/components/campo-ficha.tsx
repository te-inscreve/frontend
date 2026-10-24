import type { Control } from "react-hook-form";
import type { TextInputInstance } from "react-native";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { Controller } from "react-hook-form";
import { withUniwind } from "uniwind";

import type {
    CampoFicha,
    ValorCampo,
    ValoresFicha,
} from "@te-inscreve/schemas";
import { formatarDecimal, tetoDoCampo } from "@te-inscreve/schemas";

import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { cn } from "~/utils/cn";
import { notaDigitada } from "../lib/formulario-ficha";
import { SeloModificador } from "./selo-modificador";

const Marca = withUniwind(CheckIcon);

type Alternativa = NonNullable<CampoFicha["alternativas"]>[number];

function alternativasEmOrdem(campo: CampoFicha) {
    return [...(campo.alternativas ?? [])].sort((a, b) => a.ordem - b.ordem);
}

/** Uma linha de alternativa: círculo na única, quadrado na múltipla. */
function OpcaoAlternativa({
    alternativa,
    multipla,
    marcada,
    invalido,
    aoTocar,
}: {
    alternativa: Alternativa;
    multipla: boolean;
    marcada: boolean;
    invalido: boolean;
    aoTocar: () => void;
}) {
    return (
        <Pressable
            role={multipla ? "checkbox" : "radio"}
            aria-checked={marcada}
            onPress={aoTocar}
            className={cn(
                "border-input bg-card min-h-12 flex-row items-center gap-3 rounded-md border px-3 py-2",
                marcada && "border-primary bg-primary/5",
                invalido && !marcada && "border-destructive",
            )}
        >
            <View
                aria-hidden
                className={cn(
                    "border-input size-5 items-center justify-center border",
                    multipla ? "rounded-sm" : "rounded-full",
                    marcada && "border-primary",
                    marcada && multipla && "bg-primary",
                )}
            >
                {marcada &&
                    (multipla ? (
                        <Marca
                            size={14}
                            weight="bold"
                            colorClassName="accent-primary-foreground"
                        />
                    ) : (
                        <View className="bg-primary size-2.5 rounded-full" />
                    ))}
            </View>
            <Text className="text-foreground flex-1 text-base">
                {alternativa.nome}
            </Text>
        </Pressable>
    );
}

/**
 * A nota e o máximo juntos, no meio da caixa ("8,5 / 10"). O máximo fica
 * fixo, fora do placeholder, que sumiria assim que o avaliador começasse a
 * digitar. A caixa é de quem a desenha, e o `TextInput` dentro dela cresce
 * com o número; tocar em qualquer ponto da caixa foca o campo.
 */
function CampoNota({
    campo,
    rotuloId,
    valor,
    aoMudar,
    aoSair,
    invalido,
    erro,
}: {
    campo: CampoFicha;
    rotuloId: string;
    valor: string;
    aoMudar: (valor: ValorCampo) => void;
    aoSair: () => void;
    invalido: boolean;
    erro?: string;
}) {
    const ref = useRef<TextInputInstance>(null);
    const [focado, setFocado] = useState(false);
    const teto = tetoDoCampo(campo);
    const maximo = teto === null ? null : formatarDecimal(teto);

    return (
        <Pressable
            accessible={false}
            onPress={() => ref.current?.focus()}
            className={cn(
                "border-input bg-card h-12 flex-row items-center justify-center rounded-md border px-3",
                focado && "border-ring",
                invalido && "border-destructive",
            )}
        >
            <Input
                ref={ref}
                value={valor}
                onChangeText={(digitado) =>
                    aoMudar(notaDigitada(campo, digitado))
                }
                onFocus={() => setFocado(true)}
                onBlur={() => {
                    setFocado(false);
                    aoSair();
                }}
                aria-labelledby={rotuloId}
                accessibilityHint={
                    erro ?? (maximo ? `Máximo ${maximo}.` : undefined)
                }
                keyboardType="decimal-pad"
                placeholder="0"
                textAlign="center"
                // A borda e o fundo são da caixa: aqui fica só o texto.
                className="h-full min-w-4 rounded-none border-0 bg-transparent px-0"
            />
            {maximo && (
                <Text aria-hidden className="text-muted-foreground text-base">
                    {` / ${maximo}`}
                </Text>
            )}
        </Pressable>
    );
}

function ControleDoCampo({
    campo,
    rotuloId,
    valor,
    aoMudar,
    aoSair,
    invalido,
    erro,
}: {
    campo: CampoFicha;
    rotuloId: string;
    valor: ValorCampo;
    aoMudar: (valor: ValorCampo) => void;
    aoSair: () => void;
    invalido: boolean;
    erro?: string;
}) {
    switch (campo.tipo) {
        case "NUMERICO":
            return (
                <CampoNota
                    campo={campo}
                    rotuloId={rotuloId}
                    valor={typeof valor === "string" ? valor : ""}
                    aoMudar={aoMudar}
                    aoSair={aoSair}
                    invalido={invalido}
                    erro={erro}
                />
            );
        case "DESCRITIVO":
        case "OBSERVACAO":
            return (
                <Input
                    value={typeof valor === "string" ? valor : ""}
                    onChangeText={aoMudar}
                    onBlur={aoSair}
                    aria-labelledby={rotuloId}
                    accessibilityHint={erro}
                    invalido={invalido}
                    multiline
                    textAlignVertical="top"
                    className="h-auto min-h-24 py-3"
                />
            );
        case "ALTERNATIVA_UNICA":
        case "ALTERNATIVA_MULTIPLA": {
            const multipla = campo.tipo === "ALTERNATIVA_MULTIPLA";
            const marcadas = Array.isArray(valor) ? valor : [];
            const alternativas = alternativasEmOrdem(campo);

            if (alternativas.length === 0)
                return (
                    <Text className="text-muted-foreground text-sm">
                        Este campo não tem alternativas.
                    </Text>
                );

            return (
                <View
                    role={multipla ? "group" : "radiogroup"}
                    aria-labelledby={rotuloId}
                    className="gap-2"
                >
                    {alternativas.map((alternativa) => {
                        const marcada = multipla
                            ? marcadas.includes(alternativa.id)
                            : valor === alternativa.id;
                        return (
                            <OpcaoAlternativa
                                key={alternativa.id}
                                alternativa={alternativa}
                                multipla={multipla}
                                marcada={marcada}
                                invalido={invalido}
                                aoTocar={() => {
                                    if (multipla)
                                        aoMudar(
                                            marcada
                                                ? marcadas.filter(
                                                      (id) =>
                                                          id !== alternativa.id,
                                                  )
                                                : [...marcadas, alternativa.id],
                                        );
                                    // Tocar de novo na marcada desmarca a única
                                    // opcional; na obrigatória, ela fica.
                                    else if (marcada && !campo.obrigatorio)
                                        aoMudar(null);
                                    else aoMudar(alternativa.id);
                                }}
                            />
                        );
                    })}
                </View>
            );
        }
    }
}

/** Rótulo, descrição, selos e o controle do tipo do campo, ligados ao RHF. */
export function CampoFichaControlado({
    chave,
    campo,
    control,
    revalidar,
    naFicha = false,
}: {
    chave: string;
    campo: CampoFicha;
    control: Control<ValoresFicha>;
    /**
     * O `form.trigger`. Os trechos validam com `trigger`, não com submit, então
     * o RHF não revalida sozinho ao digitar: sem isto, o erro de quem tentou
     * avançar ficaria na tela mesmo depois de corrigido.
     */
    revalidar: (chave: string) => Promise<boolean>;
    /**
     * Na ficha, fora da folha: o campo valida ao sair, porque não há
     * "Aplicar" que cobre.
     */
    naFicha?: boolean;
}) {
    const rotuloId = `rotulo-${chave}`;

    return (
        <Controller
            name={chave}
            control={control}
            render={({ field, fieldState }) => {
                const erro = fieldState.error?.message;
                const invalido = fieldState.invalid;
                const cabecalho = (
                    <View className="flex-row flex-wrap items-center gap-2">
                        {/* O erro aparece na borda do controle e na
                            mensagem; o rótulo fica como está. A maior parte
                            dos campos é obrigatória, então só a exceção leva
                            marca. */}
                        <FieldLabel nativeID={rotuloId} className="text-base">
                            {campo.nome}
                            {!campo.obrigatorio && (
                                <Text className="text-muted-foreground font-normal">
                                    {" (opcional)"}
                                </Text>
                            )}
                        </FieldLabel>
                        {campo.modificadorNota && (
                            <SeloModificador
                                modificador={campo.modificadorNota}
                            />
                        )}
                    </View>
                );
                // A ajuda vem depois do controle, junto do erro.
                const ajuda = campo.descricao ? (
                    <Text className="text-muted-foreground text-sm">
                        {campo.descricao}
                    </Text>
                ) : null;
                const controle = (
                    <ControleDoCampo
                        campo={campo}
                        rotuloId={rotuloId}
                        valor={field.value ?? null}
                        aoMudar={(valor) => {
                            field.onChange(valor);
                            // A nota escrita sempre entra no campo; passar do
                            // máximo ou da quarta casa aparece já ao digitar,
                            // e só barra o avanço. O campo vazio espera o
                            // "Próximo" para cobrar.
                            const notaEscrita =
                                campo.tipo === "NUMERICO" && valor !== "";
                            if (fieldState.invalid || notaEscrita)
                                void revalidar(chave);
                        }}
                        aoSair={() => {
                            field.onBlur();
                            if (naFicha) void revalidar(chave);
                        }}
                        invalido={invalido}
                        erro={erro}
                    />
                );

                return (
                    <Field>
                        {cabecalho}
                        {controle}
                        {ajuda}
                        <FieldError>{erro}</FieldError>
                    </Field>
                );
            }}
        />
    );
}
