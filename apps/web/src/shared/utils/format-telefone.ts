/**
 * Escreve um telefone brasileiro como `(54) 99644-9436`.
 *
 * A API devolve só os dígitos, então a máscara é aplicada na exibição. O que
 * não couber nos formatos de 10 ou 11 dígitos volta como veio: um número
 * estranho no cadastro é melhor mostrado cru do que recortado.
 */
export function formatTelefone(telefone: string): string {
    const digits = telefone.replace(/\D/g, "");

    const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
    if (!match) return telefone;

    const [, ddd, prefixo, sufixo] = match;
    return `(${ddd}) ${prefixo}-${sufixo}`;
}

/**
 * Aplica a máscara `(00) 00000-0000` enquanto o usuário digita.
 *
 * Diferente de {@link formatTelefone}, aceita o número pela metade: quem
 * decide se está completo é o schema do formulário, no `blur`/`submit`.
 */
export function maskTelefone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    // O nono dígito só existe em celular: até oito, o corte é depois do
    // quarto, como nos fixos.
    const corte = digits.length <= 10 ? 6 : 7;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, corte)}-${digits.slice(corte)}`;
}

/** Só os dígitos — é assim que a API guarda o telefone. */
export function digitosTelefone(telefone: string): string {
    return telefone.replace(/\D/g, "");
}
