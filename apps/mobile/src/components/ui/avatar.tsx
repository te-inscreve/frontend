import { useState } from "react";
import { Image, Text, View } from "react-native";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { withUniwind } from "uniwind";

import { cn } from "~/utils/cn";
import { iniciais } from "~/utils/iniciais";

const IconeUsuario = withUniwind(UserIcon);

interface AvatarProps {
    /** Endereço da foto; nulo mostra as iniciais do nome no mesmo lugar. */
    uri: string | null | undefined;
    /** Nome da pessoa, de onde saem as iniciais quando não há foto. */
    nome: string;
    className?: string;
    /** Cor das iniciais, como classe `text-*`. */
    textoClassName?: string;
    /** Cor do ícone de reserva, como classe `accent-*`. */
    iconeClassName?: string;
}

/**
 * Foto redonda de 36pt, decorativa: quem identifica a pessoa é o texto ao
 * lado dela. Sem foto, cai nas iniciais do nome, como o avatar do web.
 */
export function Avatar({
    uri,
    nome,
    className,
    textoClassName,
    iconeClassName,
}: AvatarProps) {
    const texto = iniciais(nome);
    // Foto que não carregou cai nas iniciais em vez de deixar o círculo
    // vazio. Guarda o endereço, e não um booleano: trocada a foto, a nova
    // ganha sua chance.
    const [uriQueFalhou, setUriQueFalhou] = useState<string | null>(null);
    const mostrarFoto = !!uri && uri !== uriQueFalhou;

    return (
        <View
            className={cn(
                "size-9 items-center justify-center overflow-hidden rounded-full",
                className,
            )}
        >
            {mostrarFoto ? (
                <Image
                    source={{ uri }}
                    onError={() => setUriQueFalhou(uri)}
                    className="size-full"
                />
            ) : texto ? (
                <Text
                    className={cn(
                        "text-sm leading-none font-semibold tracking-wide",
                        textoClassName,
                    )}
                >
                    {texto}
                </Text>
            ) : (
                // Reserva para quando não há nome nenhum a iniciar — não
                // deveria acontecer com usuário de verdade, mas evita um
                // círculo vazio se algum dia acontecer.
                <IconeUsuario
                    size={22}
                    weight="bold"
                    colorClassName={iconeClassName}
                />
            )}
        </View>
    );
}
