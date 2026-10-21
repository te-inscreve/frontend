/**
 * Aplica a máscara `00.000.000/0000-00` enquanto o usuário digita.
 *
 * Espelha `formatCpf`: descarta o que não for dígito e nunca reclama de um
 * valor incompleto — quem decide se o CNPJ é válido é o schema do formulário.
 *
 * A API devolve o CNPJ já mascarado, então é essa a forma que também volta
 * para ela no envio.
 */
export function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 14);

    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}
