import { z } from "zod/v4";

/**
 * Espelha o `signInSchema` de `@te-inscreve/schemas` (a fonte de verdade do que
 * cruza a borda REST), mas com os nomes e as mensagens que a UI usa: os campos
 * são exibidos em português e o backend só fala inglês nas falhas.
 */
export const signInFormSchema = z.object({
    email: z.email("Informe um e-mail válido."),
    senha: z
        .string()
        .min(1, "Informe sua senha.")
        .min(8, "A senha deve ter ao menos 8 caracteres."),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
