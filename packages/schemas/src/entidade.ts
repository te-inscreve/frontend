import { z } from "zod/v4";

// "nome": "CTG Potaria do Rio Grande",
// "cnpj": "12.345.678/0001-90",
// "telefone": "(54) 1234-5678",
// "cidade": "Vacaria",
// "estado": "RS"
const entidadeSchema = z.object({
    id: z.number().int(),
    nome: z.string(),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    telefone: z.string().regex(/^\(\d{2}\) \d{4}-\d{4}$/),
    cidade: z.string(),
    estado: z.string().regex(/^[A-Z]{2}$/),
});

export const privateEntidadeSchema = entidadeSchema;
export const publicEntidadeSchema = entidadeSchema.omit({ id: true });
export type PublicEntidade = z.infer<typeof publicEntidadeSchema>;
export type PrivateEntidade = z.infer<typeof privateEntidadeSchema>;
