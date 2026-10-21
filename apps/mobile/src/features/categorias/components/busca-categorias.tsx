import { View } from "react-native";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { XCircleIcon } from "phosphor-react-native/src/icons/XCircle";
import { withUniwind } from "uniwind";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const IconeLupa = withUniwind(MagnifyingGlassIcon);
const IconeLimpar = withUniwind(XCircleIcon);

interface BuscaCategoriasProps {
    valor: string;
    onChange: (valor: string) => void;
}

/** O campo de busca da lista, com a lupa à esquerda e o limpar à direita. */
export function BuscaCategorias({ valor, onChange }: BuscaCategoriasProps) {
    return (
        <View className="justify-center">
            <Input
                value={valor}
                onChangeText={onChange}
                placeholder="Buscar categoria, evento ou modalidade"
                aria-label="Buscar categorias"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                className="pr-12 pl-10"
            />
            <View pointerEvents="none" className="absolute left-3">
                <IconeLupa size={20} colorClassName="accent-muted-foreground" />
            </View>
            {valor ? (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Limpar busca"
                    hitSlop={4}
                    className="absolute top-0 right-0"
                    onPress={() => onChange("")}
                    icone={
                        <IconeLimpar
                            size={20}
                            weight="fill"
                            colorClassName="accent-muted-foreground"
                        />
                    }
                />
            ) : null}
        </View>
    );
}
