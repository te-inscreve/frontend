import type { FieldErrors, FieldValues } from "react-hook-form";
import { get } from "react-hook-form";

/**
 * A mensagem de uma regra sobre a lista inteira — "agrupamento vazio", "ao
 * menos 2 alternativas".
 *
 * O resolver guarda essa mensagem no próprio caminho da lista enquanto nenhum
 * item dela é um campo registrado, e em `.root` quando algum é — como as
 * alternativas, cada uma com seu input. Lê dos dois lugares.
 */
export function mensagemDaLista<T extends FieldValues>(
    errors: FieldErrors<T>,
    caminho: string,
): string | undefined {
    const erro = get(errors, caminho) as
        { message?: string; root?: { message?: string } } | undefined;
    return erro?.root?.message ?? erro?.message;
}
