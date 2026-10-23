import { Pressable, Text, View } from "react-native";
import { MoonIcon } from "phosphor-react-native/src/icons/Moon";
import { SunIcon } from "phosphor-react-native/src/icons/Sun";
import { useUniwind, withUniwind } from "uniwind";

import { Switch } from "~/components/ui/switch";
import { escolherTema } from "~/utils/tema";

const Lua = withUniwind(MoonIcon);
const Sol = withUniwind(SunIcon);

/**
 * O interruptor entre o tema claro e o escuro, como o `AlternarTema` do web.
 *
 * O `useUniwind` devolve o tema em vigor, inclusive quando ele vem do sistema:
 * sem escolha salva, o interruptor mostra o que o aparelho já está usando.
 */
export function AlternarTema() {
    const { theme } = useUniwind();
    const escuro = theme === "dark";

    function alternar(ligado: boolean) {
        escolherTema(ligado ? "dark" : "light");
    }

    return (
        <View className="flex-row items-center justify-between gap-3">
            {/*
             * Tocar no rótulo alterna, como o `htmlFor` do web. Fica fora da
             * árvore de acessibilidade: o leitor de tela foca só o interruptor.
             */}
            <Pressable
                accessible={false}
                onPress={() => alternar(!escuro)}
                className="flex-1 flex-row items-center gap-3"
            >
                <View
                    aria-hidden
                    className="bg-muted size-9 items-center justify-center rounded-lg"
                >
                    {escuro ? (
                        <Lua
                            size={18}
                            colorClassName="accent-muted-foreground"
                        />
                    ) : (
                        <Sol
                            size={18}
                            colorClassName="accent-muted-foreground"
                        />
                    )}
                </View>
                <View className="flex-1 gap-0.5">
                    <Text className="text-foreground text-sm font-medium">
                        Modo escuro
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                        {escuro
                            ? "Cores escuras, para ambientes com pouca luz."
                            : "Cores claras, o padrão do Te Inscreve."}
                    </Text>
                </View>
            </Pressable>
            <Switch
                aria-label="Modo escuro"
                ligado={escuro}
                aoAlternar={alternar}
            />
        </View>
    );
}
