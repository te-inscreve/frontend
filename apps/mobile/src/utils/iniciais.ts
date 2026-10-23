/**
 * As iniciais de um nome — a primeira letra do primeiro nome com a primeira
 * do último, como numa credencial. Nome de uma palavra só usa as duas
 * primeiras letras dela. Mesma regra do `AvatarUsuario` do web.
 */
export function iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    const primeira = partes.at(0);
    if (!primeira) return "";
    if (partes.length === 1) return primeira.slice(0, 2).toUpperCase();

    const ultima = partes.at(-1) ?? primeira;
    return `${primeira.charAt(0)}${ultima.charAt(0)}`.toUpperCase();
}
