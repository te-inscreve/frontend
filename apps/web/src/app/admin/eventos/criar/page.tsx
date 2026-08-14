import { FormEvento } from "~/features/eventos/form-evento/form-evento";

export const metadata = {
    title: "Criar evento | Te Inscreve",
    description: "Cadastro de um novo evento da entidade",
};

export default function CriarEventoPage() {
    return <FormEvento />;
}
