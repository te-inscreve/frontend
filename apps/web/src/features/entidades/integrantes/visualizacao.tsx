"use client";

import { ListDashesIcon } from "@phosphor-icons/react/dist/ssr/ListDashes";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";

import { Tabs, TabsList, TabsTrigger } from "@te-inscreve/components";

/** Como a listagem se apresenta. Cartões é o padrão: identificar vem antes de comparar. */
export type Visualizacao = "cartoes" | "tabela";

/**
 * Alterna entre as duas visualizações da listagem.
 *
 * Duas abas, e não um botão que troca de rótulo: o par diz ao mesmo tempo onde
 * se está e para onde dá para ir, enquanto o botão nomeava só o destino e
 * deixava o estado atual implícito — quem chegasse na tela tinha de deduzir a
 * visualização em uso pelo que ela *não* oferecia.
 *
 * "Lista" e "Grade" são o que a pessoa vê; `tabela` e `cartoes` continuam
 * sendo o que a listagem monta, e é por esses nomes que a
 * {@link ListaIntegrantes} decide. Os dois pares não se encontram de
 * propósito: o rótulo é do usuário, o valor é do código.
 *
 * Sem `TabsContent`: as abas só escolhem o valor. Quem pinta a listagem é a
 * `ListaIntegrantes`, que fica de fora para que carregando, erro e vazio sejam
 * os mesmos nas duas visualizações.
 */
export function SeletorVisualizacao({
    visualizacao,
    onChange,
}: {
    visualizacao: Visualizacao;
    onChange: (visualizacao: Visualizacao) => void;
}) {
    return (
        <Tabs
            value={visualizacao}
            onValueChange={(valor) => onChange(valor as Visualizacao)}
        >
            {/* 40px para casar com a busca e o botão de filtros, que dividem a
                linha com as abas. Vai com o mesmo prefixo de variante do
                padrão (`h-9`) porque um `h-10` solto perde: o seletor com
                `group-data-*` é mais específico, e o `cn` não vê conflito entre
                classes de prefixos diferentes para descartar uma delas. */}
            <TabsList
                aria-label="Visualização da listagem"
                className="group-data-[orientation=horizontal]/tabs:h-10"
            >
                <TabsTrigger value="tabela" className="text-sm">
                    <ListDashesIcon aria-hidden="true" />
                    Lista
                </TabsTrigger>
                <TabsTrigger value="cartoes" className="text-sm">
                    <SquaresFourIcon aria-hidden="true" />
                    Grade
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
