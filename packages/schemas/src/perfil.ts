import { z } from "zod/v4";

/**
 * O que `/profile/` devolve para o usuário da sessão.
 *
 * O CPF chega **sem máscara** aqui (`14346110002`), ao contrário do cadastro,
 * que recebe o valor formatado; quem exibe é que aplica a máscara.
 */
export const perfilSchema = z.object({
    cpf: z.string(),
    /** URL absoluta da foto no `/media` do backend. Ausente para quem não enviou uma. */
    photo: z.url().nullish(),
    /** A conta em si. Duplica o que a sessão do better-auth já carrega. */
    user: z.object({
        id: z.number().int(),
        email: z.email(),
        firstName: z.string(),
        lastName: z.string(),
        username: z.string(),
    }),
    /**
     * O vínculo com uma entidade, ou `null` para quem não tem nenhum.
     *
     * É a fonte da verdade sobre o acesso ao painel `/admin/minha-entidade` —
     * ver {@link temEntidade}. Tipado como `unknown` de propósito: até hoje só
     * se viu o valor nulo, e inventar um formato para o caso preenchido seria
     * pior do que admitir que ainda não se sabe. Quem for usar o conteúdo (e
     * não só a presença) precisa fechar o formato com o backend antes.
     */
    entidade: z.unknown().nullish(),
});

export type Perfil = z.infer<typeof perfilSchema>;

/**
 * Se o perfil está vinculado a uma entidade.
 *
 * A regra mora aqui, e não espalhada pelas telas, porque o backend responde
 * 403 em `/minha-entidade` quando não há vínculo — o que é indistinguível de
 * uma falta de permissão de verdade. O perfil separa os dois casos.
 */
export const temEntidade = (perfil: Perfil): boolean => perfil.entidade != null;
