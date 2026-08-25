import { notFound } from "next/navigation";

import { FormCategoria } from "~/features/categorias/form-categoria/form-categoria";

export const metadata = {
    title: "Criar categoria | Te Inscreve",
    description: "Cadastro de uma nova categoria da modalidade",
};

export default async function CriarCategoriaPage({
    params,
}: {
    params: Promise<{ slug: string; modalidadeId: string }>;
}) {
    const { slug, modalidadeId } = await params;
    const eventoId = Number(slug);
    const modalidade = Number(modalidadeId);

    // A rota é aninhada em evento e modalidade, e o backend só aceita ids
    // inteiros positivos: qualquer outra coisa no caminho não existe.
    if (!Number.isInteger(eventoId) || eventoId <= 0) notFound();
    if (!Number.isInteger(modalidade) || modalidade <= 0) notFound();

    return <FormCategoria eventoId={eventoId} modalidadeId={modalidade} />;
}
