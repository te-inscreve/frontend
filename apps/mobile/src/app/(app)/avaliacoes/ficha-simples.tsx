import { FormularioFichaMock } from "~/features/avaliacoes/components/formulario-ficha-mock";
import {
    inscricaoAvaliadaMock,
    modeloFichaSimplesMock,
} from "~/features/avaliacoes/lib/modelo-ficha-mock";

/** MOCK (TE-82): a ficha curta, para chegar logo à tela de sucesso. */
export default function FichaSimples() {
    return (
        <FormularioFichaMock
            modelo={modeloFichaSimplesMock}
            inscricao={inscricaoAvaliadaMock}
        />
    );
}
