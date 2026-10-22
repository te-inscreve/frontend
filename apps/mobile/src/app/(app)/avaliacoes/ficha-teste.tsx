import { FormularioFichaMock } from "~/features/avaliacoes/components/formulario-ficha-mock";
import { modeloFichaMock } from "~/features/avaliacoes/lib/modelo-ficha-mock";

/** MOCK (TE-82): tela de teste da renderização dos campos do modelo de ficha. */
export default function FichaTeste() {
    return <FormularioFichaMock modelo={modeloFichaMock} />;
}
