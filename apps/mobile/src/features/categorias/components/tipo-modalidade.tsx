import { Text, View } from "react-native";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { UsersThreeIcon } from "phosphor-react-native/src/icons/UsersThree";
import { withUniwind } from "uniwind";

const IconePessoa = withUniwind(UserIcon);
const IconeGrupo = withUniwind(UsersThreeIcon);

const nomeDoTipo = (isGrupo: boolean) => (isGrupo ? "Em grupo" : "Individual");

/**
 * Se a modalidade é individual ou em grupo, com os ícones do `IsGroupBadge`
 * do web e do bilhete. No cartão vai só o ícone, com o nome para o leitor de
 * tela; no detalhe, o nome aparece ao lado (`comNome`).
 */
export function TipoModalidade({
    isGrupo,
    comNome = false,
}: {
    isGrupo: boolean;
    comNome?: boolean;
}) {
    const Icone = isGrupo ? IconeGrupo : IconePessoa;
    const icone = (
        <View
            className="bg-primary/10 size-8 items-center justify-center rounded-md"
            {...(comNome
                ? { "aria-hidden": true }
                : { role: "img" as const, "aria-label": nomeDoTipo(isGrupo) })}
        >
            <Icone size={20} weight="duotone" colorClassName="accent-primary" />
        </View>
    );

    if (!comNome) return icone;

    return (
        <View className="flex-row items-center gap-2">
            {icone}
            <Text className="text-foreground text-base font-semibold">
                {nomeDoTipo(isGrupo)}
            </Text>
        </View>
    );
}
