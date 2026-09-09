"use client";

import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { TRPCClientError } from "@trpc/client";
import { useForm } from "react-hook-form";

import type { FormIntegrante, Integrante } from "@te-inscreve/schemas";
import { Button, FieldError, FieldGroup } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { IntegranteFormValues } from "./integrante-form-schema";
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
 * Cadastro e edição de integrante, dentro de um diálogo.
 *
 * Os campos seguem o documento que a pessoa tem na mão: nome e sobrenome,
 * depois nascimento e matrícula na mesma linha — é assim que eles são
 * copiados —, e a validade embaixo, que é o que a comissão confere por último.
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
                    <FieldGroup className="grid gap-4 sm:grid-cols-8">
                        <CampoTexto<IntegranteFormValues>
                            name="nome"
                            label="Nome"
                            placeholder="Ex.: Marina"
                            className="sm:col-span-4"
                        />
                        <CampoTexto<IntegranteFormValues>
                            name="sobrenome"
                            label="Sobrenome"
                            placeholder="Ex.: Colussi"
                            className="sm:col-span-4"
                        />

                        <CampoData<IntegranteFormValues>
                            name="dataNascimento"
                            label="Data de nascimento"
                            ajuda="Usada para validar a idade na inscrição em eventos."
                            dataMinima={NASCIMENTO_MAIS_ANTIGO}
                            dataMaxima={HOJE}
                            className="sm:col-span-4"
                        />
                        <CampoTexto<IntegranteFormValues>
                            name="matriculaMtg"
                            label="Matrícula MTG"
                            placeholder="Ex.: MTG-2016-01204"
                            className="sm:col-span-4"
                            helpText="Código da carteirinha de identidade tradicionalista."
                        />
                        <CampoData<IntegranteFormValues>
                            name="validade"
                            label="Validade da matrícula"
                            ajuda="Matrícula vencida impede a inscrição no evento."
                            mesInicial={HOJE}
                            opcional
                            className="sm:col-span-4"
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
 */
function mensagensPorCampo(
    error: unknown,
): [FieldPath<IntegranteFormValues>, string][] {
    if (!(error instanceof TRPCClientError)) return [];

    const fieldErrors = (
        error.data as { fieldErrors?: Record<string, string[]> | null } | null
    )?.fieldErrors;

    const campos: Record<string, FieldPath<IntegranteFormValues>> = {
        nome: "nome",
        sobrenome: "sobrenome",
        dataNascimento: "dataNascimento",
        data_nascimento: "dataNascimento",
        matriculaMtg: "matriculaMtg",
        matricula_mtg: "matriculaMtg",
        validade: "validade",
    };

    return Object.entries(fieldErrors ?? {}).flatMap(([campo, mensagens]) => {
        const campoDoFormulario = campos[campo];
        if (!campoDoFormulario || !mensagens.length) return [];
        return [[campoDoFormulario, mensagens.join(" ")] as const];
    });
}
