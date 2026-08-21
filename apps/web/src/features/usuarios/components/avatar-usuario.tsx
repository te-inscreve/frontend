import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { cn } from "@te-inscreve/components";

interface Props {
    /** URL da foto vinda de `/profile`. Sem foto, cai no ícone genérico. */
    photo?: string | null;
    nome: string;
    /** Lado do quadrado, em pixels. */
    size?: number;
    /** Passe `""` quando o nome do usuário já estiver visível ao lado. */
    alt?: string;
    className?: string;
}

export function AvatarUsuario({
    photo,
    nome,
    size = 24,
    alt,
    className,
}: Props) {
    const dimensoes = { width: size, height: size };

    if (!photo) {
        return (
            <span
                aria-hidden="true"
                style={dimensoes}
                className={cn(
                    "bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full",
                    className,
                )}
            >
                <UserIcon size={Math.round(size * 0.6)} weight="regular" />
            </span>
        );
    }

    return (
        <Image
            src={photo}
            alt={alt ?? `Foto de ${nome}`}
            width={size}
            height={size}
            style={dimensoes}
            className={cn(
                "bg-muted shrink-0 rounded-full object-cover",
                className,
            )}
        />
    );
}
