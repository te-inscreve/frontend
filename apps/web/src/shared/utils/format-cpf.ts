/**
 * Aplica a máscara `000.000.000-00` enquanto o usuário digita.
 *
 * Descarta o que não for dígito e nunca reclama de um valor incompleto — quem
 * decide se o CPF é válido é o schema do formulário, no `blur`/`submit`.
 */
export function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    return digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
