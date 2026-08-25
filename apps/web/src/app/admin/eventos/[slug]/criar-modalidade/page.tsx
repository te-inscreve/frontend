import { notFound } from "next/navigation";

import { FormModalidade } from "~/features/modalidades/form-modalidade/form-modalidade";

export const metadata = {
    title: "Criar modalidade | Te Inscreve",
    description: "Cadastro de uma nova modalidade do evento",
};

export default async function CriarModalidadePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const eventoId = Number(slug);

    // A rota é aninhada no evento, e o backend só aceita id inteiro positivo:
    // qualquer outra coisa no caminho não corresponde a evento nenhum.
    if (!Number.isInteger(eventoId) || eventoId <= 0) notFound();

    return <FormModalidade eventoId={eventoId} />;
}
