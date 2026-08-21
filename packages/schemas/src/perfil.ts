import { z } from "zod/v4";

/**
 * O que `/profile/` devolve para o usuário da sessão.
 *
 * Só carrega o que a API guarda além da conta — nome e e-mail vêm da sessão do
 * better-auth. O CPF chega **sem máscara** aqui (`14346110002`), ao contrário do
 * cadastro, que recebe o valor formatado; quem exibe é que aplica a máscara.
 */
export const perfilSchema = z.object({
    cpf: z.string(),
    /** URL absoluta da foto no `/media` do backend. Ausente para quem não enviou uma. */
    photo: z.url().nullish(),
});

export type Perfil = z.infer<typeof perfilSchema>;
