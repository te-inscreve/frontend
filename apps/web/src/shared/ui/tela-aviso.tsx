/**
 * Tela inteira ocupada por um único recado — ícone, título e o que vier abaixo.
 *
 * Existe porque três telas do painel dizem "não há nada aqui" com a mesma
 * moldura: sem entidade vinculada, pedido de acesso e a confirmação dele. A
 * altura desconta os `3.5rem` do header do `/admin`, então o recado fica
 * centrado no que sobra da janela, e não na página inteira.
 *
 * Puramente apresentacional de propósito: sem `"use client"` e sem nada de
 * servidor, dá para usar dos dois lados da fronteira.
 */
export function TelaAviso(props: {
    icone: React.ReactNode;
    titulo: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-2 px-4 py-6 text-center md:px-6 md:py-8">
            {props.icone}
            <h1 className="text-2xl font-bold">{props.titulo}</h1>
            {props.children}
        </div>
    );
}
