"use client";

import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { TRPCClientError } from "@trpc/client";
import { addMonths, addYears, subYears } from "date-fns";
import { useForm } from "react-hook-form";

import type { FormIntegrante, Integrante } from "@te-inscreve/schemas";
import { Button, FieldError, FieldGroup } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { IntegranteFormValues } from "./integrante-form-schema";
import type { PresetData } from "~/shared/ui/form/campo-data";
import { CampoData } from "~/shared/ui/form/campo-data";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import {
    integranteFormDefaults,
    integranteFormInput,
    integranteFormSchema,
} from "./integrante-form-schema";

interface Props {
    /** Integrante em edição. Ausente quando o formulário está cadastrando. */
    integrante?: Integrante;
    /**
     * Recebe o cadastro pronto para a API. Se rejeitar, o envio não deu
     * certo: o diálogo continua aberto com o que foi digitado, e a mensagem
     * aparece no campo que o backend apontou — ou acima dos botões.
     */
    onSalvar: (dados: FormIntegrante) => Promise<void> | void;
    onCancelar: () => void;
}

const HOJE = new Date();
/** Ninguém no MTG nasceu antes disso, e o calendário não precisa oferecer. */
const NASCIMENTO_MAIS_ANTIGO = new Date(1920, 0, 1);

/**
 * O intervalo em que uma validade cabe.
 *
 * Para trás porque matrícula vencida é estado legítimo — a lista marca quem
 * está assim —, e cinco anos cobrem qualquer atraso plausível. Para a frente
 * porque o calendário precisa de um teto: sem ele o react-day-picker para a
 * navegação no fim do ano corrente, e a validade mais comum de todas, um ano à
 * frente, ficava inalcançável.
 */
const VALIDADE_MAIS_ANTIGA = subYears(HOJE, 5);
const VALIDADE_MAIS_DISTANTE = addYears(HOJE, 10);

/**
 * Os prazos de renovação, em ordem crescente. Um ano é o de sempre; os outros
 * dois cobrem quem renovou por menos ou por mais tempo.
 *
 * Contam de hoje, e não da data já preenchida: quem abre o campo está
 * registrando a renovação que acabou de acontecer.
 */
const PRESETS_VALIDADE: PresetData[] = [
    { rotulo: "6 meses", data: () => addMonths(new Date(), 6) },
    { rotulo: "1 ano", data: () => addYears(new Date(), 1) },
    { rotulo: "2 anos", data: () => addYears(new Date(), 2) },
];

/**
 * Cadastro e edição de integrante, dentro de um diálogo.
 *
 * Os campos seguem o documento que a pessoa tem na mão: o nome inteiro numa
 * caixa só — dividido em nome e sobrenome na hora de enviar, ver
 * `dividirNome` —, o número da matrícula ao lado e, no fim, as duas datas: o
 * nascimento, que decide a categoria, e a validade, que a comissão confere por
 * último.
 *
 * As duas datas são calendários abertos, e ficam por último de propósito: são
 * a parte alta do formulário, e no topo empurrariam para fora da tela os
 * campos que se digitam de uma vez só.
 *
 * O componente não sabe do diálogo: recebe o que fazer ao salvar e ao
 * cancelar. Quem abre é que decide o que acontece com a tela em volta.
 */
export function FormIntegrante({ integrante, onSalvar, onCancelar }: Props) {
    const form = useForm<IntegranteFormValues>({
        resolver: zodResolver(integranteFormSchema),
        defaultValues: integranteFormDefaults(integrante),
    });

    const salvar = async (valores: IntegranteFormValues) => {
        try {
            await onSalvar(integranteFormInput(valores));
            // Cadastrando, o formulário volta vazio para a próxima pessoa;
            // editando, o que foi salvo é o novo ponto de partida.
            form.reset(integrante ? valores : integranteFormDefaults());
        } catch (error) {
            const campos = mensagensPorCampo(error);

            for (const [campo, mensagem] of campos) {
                form.setError(campo, { type: "server", message: mensagem });
            }

            if (campos.length === 0) {
                form.setError("root", {
                    message:
                        "Não foi possível salvar o integrante. Tente de novo em instantes.",
                });
            }
        }
    };

    const { errors, isSubmitting } = form.formState;

    return (
        <FormProvider {...form}>
            <form
                noValidate
                onSubmit={form.handleSubmit(salvar)}
                className="flex min-h-0 flex-1 flex-col gap-5"
            >
                {/* Só os campos rolam: o título e os botões ficam parados onde
                    estão, inclusive quando os erros crescem o formulário. */}
                <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1">
                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <CampoTexto<IntegranteFormValues>
                            name="nomeCompleto"
                            label="Nome completo"
                            placeholder="Ex.: Marina Colussi"
                            helpText="Nome e sobrenome, como estão na carteirinha."
                        />
                        <CampoTexto<IntegranteFormValues>
                            name="matriculaMtg"
                            label="Matrícula MTG"
                            placeholder="Ex.: MTG-2016-01204"
                            helpText="Código da carteirinha de identidade tradicionalista."
                        />

                        <CampoData<IntegranteFormValues>
                            name="dataNascimento"
                            label="Data de nascimento"
                            ajuda="Usada para validar a idade na inscrição em eventos."
                            dataMinima={NASCIMENTO_MAIS_ANTIGO}
                            dataMaxima={HOJE}
                        />
                        <CampoData<IntegranteFormValues>
                            name="validade"
                            label="Validade da matrícula"
                            ajuda="Costuma valer um ano a partir da renovação. Matrícula vencida impede a inscrição no evento."
                            mesInicial={HOJE}
                            dataMinima={VALIDADE_MAIS_ANTIGA}
                            dataMaxima={VALIDADE_MAIS_DISTANTE}
                            presets={PRESETS_VALIDADE}
                            presetsLabel="Vale por"
                            opcional
                        />
                    </FieldGroup>
                </div>

                <div className="flex flex-col gap-3 border-t pt-4">
                    {errors.root && <FieldError errors={[errors.root]} />}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancelar}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <SpinnerGapIcon
                                    aria-hidden="true"
                                    className="animate-spin"
                                />
                            ) : (
                                <FloppyDiskIcon aria-hidden="true" />
                            )}
                            {isSubmitting ? "Salvando…" : "Salvar"}
                        </Button>
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}

/**
 * Os erros de validação do backend, já no campo do formulário a que pertencem.
 *
 * O backend responde em camelCase, mas o snake_case aparece nos erros que vêm
 * do serializer sem passar pelo `djangorestframework-camel-case` — os dois
 * entram no mapa. Campo que o formulário não conhece é descartado; quem chama
 * cai na mensagem genérica quando nada sobra.
 *
 * `nome` e `sobrenome` voltam separados e caem os dois na mesma caixa da tela,
 * então as mensagens se acumulam em vez de uma sobrescrever a outra.
 */
function mensagensPorCampo(
    error: unknown,
): [FieldPath<IntegranteFormValues>, string][] {
    if (!(error instanceof TRPCClientError)) return [];

    const fieldErrors = (
        error.data as { fieldErrors?: Record<string, string[]> | null } | null
    )?.fieldErrors;

    const campos: Record<string, FieldPath<IntegranteFormValues>> = {
        nome: "nomeCompleto",
        sobrenome: "nomeCompleto",
        dataNascimento: "dataNascimento",
        data_nascimento: "dataNascimento",
        matriculaMtg: "matriculaMtg",
        matricula_mtg: "matriculaMtg",
        validade: "validade",
    };

    const porCampo = new Map<FieldPath<IntegranteFormValues>, string[]>();

    for (const [campo, mensagens] of Object.entries(fieldErrors ?? {})) {
        const campoDoFormulario = campos[campo];
        if (!campoDoFormulario || !mensagens.length) continue;

        porCampo.set(campoDoFormulario, [
            ...(porCampo.get(campoDoFormulario) ?? []),
            ...mensagens,
        ]);
    }

    return [...porCampo].map(([campo, mensagens]) => [
        campo,
        mensagens.join(" "),
    ]);
}
