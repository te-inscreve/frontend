import { useMemo, useState } from "react";
import { Alert, Keyboard, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDiskIcon } from "phosphor-react-native/src/icons/FloppyDisk";
import { useForm, useWatch } from "react-hook-form";
import { withUniwind } from "uniwind";

import type { ModeloFichaDetalhe } from "@te-inscreve/schemas";

import type { ValoresFicha } from "../lib/formulario-ficha-mock";
import { Button } from "~/components/ui/button";
import {
    abaDoTrecho,
    montarFormularioFicha,
    notaProvisoria,
    resumoDoValor,
    trechosDaFicha,
} from "../lib/formulario-ficha-mock";
import { inscricaoAvaliadaMock } from "../lib/modelo-ficha-mock";
import { EdicaoTrecho } from "./edicao-trecho";
import { FolhaFicha } from "./folha-ficha";
import { SucessoAvaliacao } from "./sucesso-avaliacao";

const IconeSalvar = withUniwind(FloppyDiskIcon);

/**
 * MOCK (TE-82): o formulário de avaliação como a ficha inteira, em branco, de
 * entrada. O avaliador vê tudo antes e preenche aos poucos, na ordem que
 * quiser, uma aba por vez: os campos gerais se preenchem na própria ficha, e
 * cada ocorrência de um agrupamento abre o seu trecho numa folha inferior.
 * "Aplicar" valida o trecho e só fecha a folha sem erros; arrastar, o fundo e
 * o voltar fecham sempre, validando sem barrar, e a ficha marca o que ficou
 * com erro. "Salvar" valida tudo e vai à aba do primeiro trecho com pendência. Nome editável da ocorrência, nota, rascunho e envio
 * ficam para TE-70/TE-95.
 */
export function FormularioFichaMock({
    modelo,
}: {
    modelo: ModeloFichaDetalhe;
}) {
    const { schema, defaultValues } = useMemo(
        () => montarFormularioFicha(modelo),
        [modelo],
    );
    const trechos = useMemo(() => trechosDaFicha(modelo), [modelo]);
    const form = useForm<ValoresFicha>({
        resolver: zodResolver(schema),
        defaultValues,
    });
    // A ficha mostra as respostas: precisa renderizar a cada mudança.
    const valores = useWatch({ control: form.control }) as ValoresFicha;
    // O trecho fica guardado com a folha fechada: ela segue mostrando o último
    // enquanto desliza para baixo.
    const [aberto, setAberto] = useState(0);
    const [visivel, setVisivel] = useState(false);
    // Sem aba de campos gerais, a ficha cai na primeira que houver.
    const [aba, setAba] = useState("gerais");
    const [salva, setSalva] = useState(false);
    const router = useRouter();
    // As respostas do trecho como estavam ao abrir a folha, para o
    // "Cancelar" desfazer o que foi mexido nele.
    const [antes, setAntes] = useState<{
        valores: ValoresFicha;
        comErro: boolean;
    }>({ valores: {}, comErro: false });

    // Quantos campos já têm resposta, para o rodapé dizer onde o avaliador
    // está sem precisar rolar a ficha nem trocar de aba.
    const campos = trechos.flatMap((trecho) => trecho.campos);
    const preenchidos = campos.filter(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) !== null,
    ).length;

    const erros = form.formState.errors;
    const comErro = (indice: number) =>
        trechos[indice]?.campos.some(({ chave }) => erros[chave]) ?? false;

    function validarTrecho(indice: number) {
        const trecho = trechos[indice];
        return trecho
            ? form.trigger(trecho.campos.map(({ chave }) => chave))
            : Promise.resolve(true);
    }

    function abrir(indice: number) {
        const chaves = trechos[indice]?.campos.map(({ chave }) => chave) ?? [];
        setAntes({
            valores: Object.fromEntries(
                chaves.map((chave) => [chave, form.getValues(chave)]),
            ),
            comErro: comErro(indice),
        });
        setAberto(indice);
        setVisivel(true);
    }

    function cancelar() {
        const chaves = Object.keys(antes.valores);
        Object.entries(antes.valores).forEach(([chave, valor]) =>
            form.setValue(chave, valor),
        );
        // O erro volta a ser o de antes: some o que o avaliador provocou na
        // folha, e o que a ficha já marcava continua marcado.
        form.clearErrors(chaves);
        if (antes.comErro) void form.trigger(chaves);
        Keyboard.dismiss();
        setVisivel(false);
    }

    function fechar() {
        void validarTrecho(aberto);
        Keyboard.dismiss();
        setVisivel(false);
    }

    async function aplicar() {
        if (await validarTrecho(aberto)) {
            Keyboard.dismiss();
            setVisivel(false);
        }
    }

    const salvar = form.handleSubmit(
        // Válida, a avaliação ainda pede confirmação: na fila ela não se
        // edita mais (ADR 0001 usa o `Alert` para confirmar). No app de
        // verdade, o "Salvar" do alerta a poria na fila de envio.
        () => {
            Keyboard.dismiss();
            Alert.alert(
                "Salvar avaliação?",
                "Ela vai para a fila de envio e não poderá mais ser editada lá.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Salvar", onPress: () => setSalva(true) },
                ],
            );
        },
        (falhas) => {
            // Vai à aba do primeiro erro. Os campos gerais mostram o erro na
            // própria ficha; só a ocorrência precisa da folha para isso.
            const primeiro = trechos.findIndex((trecho) =>
                trecho.campos.some(({ chave }) => falhas[chave]),
            );
            const trecho = trechos[primeiro];
            if (!trecho) return;
            setAba(abaDoTrecho(trecho));
            if (trecho.ocorrencia) abrir(primeiro);
        },
    );

    return (
        <View className="flex-1">
            <ScrollView contentContainerClassName="grow">
                <FolhaFicha
                    modelo={modelo}
                    trechos={trechos}
                    valores={valores}
                    comErro={comErro}
                    aoTocar={abrir}
                    aba={aba}
                    aoTrocarAba={setAba}
                    control={form.control}
                    revalidar={form.trigger}
                />
            </ScrollView>

            <View className="bg-card border-border border-t p-4">
                {/* A nota final mora no rodapé fixo, ao lado do "Salvar":
                    vale para a ficha inteira, não para uma aba, e fica à
                    vista enquanto o avaliador preenche. O cálculo ainda está
                    em aberto (TE-95), então o mock só reserva o lugar. */}
                <View className="w-full max-w-[720px] flex-row items-center gap-4 self-center">
                    <View className="flex-1 gap-0.5">
                        <View className="flex-row items-baseline gap-2">
                            <Text className="text-muted-foreground text-sm">
                                Nota final
                            </Text>
                            <Text aria-label="a calcular, de 10">
                                <Text className="text-foreground text-2xl font-bold">
                                    —
                                </Text>
                                <Text className="text-muted-foreground text-base">
                                    {" / 10"}
                                </Text>
                            </Text>
                        </View>
                        <Text className="text-muted-foreground text-sm">
                            {preenchidos} de {campos.length} preenchidos
                        </Text>
                    </View>
                    <Button onPress={() => void salvar()}>Salvar</Button>
                </View>
            </View>

            <EdicaoTrecho
                trecho={trechos[aberto]}
                visivel={visivel}
                control={form.control}
                revalidar={form.trigger}
                aoAplicar={() => void aplicar()}
                aoFechar={fechar}
                aoCancelar={cancelar}
            />

            <SucessoAvaliacao
                visivel={salva}
                nota={notaProvisoria(trechos, valores)}
                inscricao={inscricaoAvaliadaMock}
                aoConcluir={() => {
                    setSalva(false);
                    router.back();
                }}
            />
        </View>
    );
}
