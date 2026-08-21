import { z } from "zod/v4";

/** Máscara que o backend usa no cadastro: `529.982.247-25`. */
const CPF_PATTERN = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

/**
 * Confere os dois dígitos verificadores do CPF.
 *
 * Só o formato não basta: `111.111.111-11` passa na máscara e é recusado pelo
 * backend. Validar aqui evita uma ida ao servidor para um erro que o front
 * consegue apontar no campo.
 */
export function isValidCpf(value: string): boolean {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    // Sequências de um dígito só passam no cálculo, mas nenhuma é um CPF real.
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const digitoVerificador = (tamanho: number) => {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            soma += Number(digits[i]) * (tamanho + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return (
        digitoVerificador(9) === Number(digits[9]) &&
        digitoVerificador(10) === Number(digits[10])
    );
}

/**
 * CPF como ele cruza a borda REST — formatado, do jeito que a API devolve.
 * Formulários que precisam de mensagens em português constroem as suas próprias
 * a partir de {@link isValidCpf}.
 */
export const cpfSchema = z
    .string()
    .regex(CPF_PATTERN, "CPF must be formatted as 000.000.000-00.")
    .refine(isValidCpf, "CPF is not valid.");
