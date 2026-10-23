import type { Integrante } from "@te-inscreve/schemas";

/*
 * O `nomeCompleto` e o `idadeEm` do web
 * (`apps/web/src/features/entidades/shared/integrantes.ts`), só com o que o
 * bilhete mostra.
 */

export function nomeCompleto(
    integrante: Pick<Integrante, "nome" | "sobrenome">,
) {
    return `${integrante.nome} ${integrante.sobrenome}`.trim();
}

/**
 * A idade em anos completos em `referencia`. A data de nascimento é
 * `aaaa-mm-dd` no fuso do aparelho: `new Date(iso)` a leria em UTC e, a oeste
 * de Greenwich, cairia no dia anterior.
 */
export function idadeEm(dataNascimento: string, referencia = new Date()) {
    const [ano = 0, mes = 1, dia = 1] = dataNascimento.split("-").map(Number);
    let idade = referencia.getFullYear() - ano;

    const aniversarioAindaNaoVeio =
        referencia.getMonth() < mes - 1 ||
        (referencia.getMonth() === mes - 1 && referencia.getDate() < dia);

    if (aniversarioAindaNaoVeio) idade -= 1;

    return idade;
}
