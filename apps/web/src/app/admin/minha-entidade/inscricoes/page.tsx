export const metadata = {
    title: "Inscrições da Entidade | Te Inscreve",
    description: "Inscrições de integrantes da entidade em eventos",
};

export default function InscricoesPage() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
            <h1 className="text-2xl font-bold">Inscrições da sua entidade</h1>
            <p className="text-muted-foreground">
                Gerencie as inscrições de integrantes da sua entidade em
                eventos.
            </p>

            <div className="flex flex-col gap-4"></div>
        </div>
    );
}
