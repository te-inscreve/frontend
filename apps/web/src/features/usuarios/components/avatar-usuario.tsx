import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { cn } from "@te-inscreve/components";

interface Props {
    /** URL da foto vinda de `/profile`. Sem foto, cai nas iniciais do nome. */
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
        const texto = iniciais(nome);

        return (
            <span
                aria-hidden="true"
                style={dimensoes}
                className={cn(
                    "bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-semibold",
                    className,
                )}
            >
                {texto ? (
                    // O tamanho do texto acompanha o `size` do avatar — a
                    // mesma conta proporcional que o ícone de reserva usava
                    // (`size * 0.6`), só que mais estreita: duas letras lado
                    // a lado pedem menos altura do que um ícone.
                    <span
                        style={{ fontSize: Math.max(10, size * 0.38) }}
                        className="leading-none tracking-wide"
                    >
                        {texto}
                    </span>
                ) : (
                    // Reserva para quando não há nome nenhum a iniciar — não
                    // deveria acontecer com integrante ou usuário de verdade,
                    // mas evita um círculo vazio se algum dia acontecer.
                    <UserIcon size={Math.round(size * 0.6)} weight="regular" />
                )}
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

/**
 * As iniciais de um nome — a primeira letra do primeiro nome com a primeira
 * do último, como numa credencial. Nome de uma palavra só usa as duas
 * primeiras letras dela.
 */
function iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    const primeira = partes.at(0);
    if (!primeira) return "";
    if (partes.length === 1) return primeira.slice(0, 2).toUpperCase();

    const ultima = partes.at(-1) ?? primeira;
    return `${primeira.charAt(0)}${ultima.charAt(0)}`.toUpperCase();
}
