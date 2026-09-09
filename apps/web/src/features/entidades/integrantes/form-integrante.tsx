"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { useForm } from "react-hook-form";

import { Button, FieldError, FieldGroup } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { IntegranteFormValues } from "./integrante-form-schema";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { CampoData } from "~/shared/ui/form/campo-data";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import {
    integranteFormDefaults,
    integranteFormInput,
    integranteFormSchema,
} from "./integrante-form-schema";

interface Props {
    /**
     * Recebe o integrante pronto; o id fica com quem guarda a lista. Se
     * rejeitar, o cadastro não deu certo: o diálogo continua aberto com o que
     * foi digitado e a mensagem aparece acima dos botões.
     */
    onSalvar: (integrante: Omit<Integrante, "id">) => Promise<void> | void;
    onCancelar: () => void;
}

const HOJE = new Date();
/** Ninguém no MTG nasceu antes disso, e o calendário não precisa oferecer. */
const NASCIMENTO_MAIS_ANTIGO = new Date(1920, 0, 1);

/**
 * Cadastro de integrante, dentro do diálogo.
 *
 * Os campos seguem o documento que a pessoa tem na mão: nome, depois matrícula
 * e nascimento na mesma linha — é assim que eles são copiados —, e a validade
 * embaixo, que é o que a comissão confere por último. Os opcionais ficam no
 * fim, separados, para que ninguém pare no meio achando que faltou informação.
 *
 * O componente não sabe do diálogo: recebe o que fazer ao salvar e ao
 * cancelar. Quem abre é que decide o que acontece com a tela em volta.
 */
export function FormIntegrante({ onSalvar, onCancelar }: Props) {
    const form = useForm<IntegranteFormValues>({
        resolver: zodResolver(integranteFormSchema),
        defaultValues: integranteFormDefaults,
    });

    const salvar = async (valores: IntegranteFormValues) => {
        try {
            await onSalvar(integranteFormInput(valores));
            form.reset(integranteFormDefaults);
        } catch {
            form.setError("root", {
                message:
                    "Não foi possível salvar o integrante. Tente de novo em instantes.",
            });
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
                            label="Nome completo"
                            placeholder="Ex.: Marina Colussi"
                            className="sm:col-span-8"
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
                            name="matriculaCtg"
                            label="Matrícula MTG"
                            placeholder="Ex.: MTG-2016-01204"
                            className="sm:col-span-4"
                            helpText="Código da carteirinha de identidade tradicionalista."
                        />
                        <CampoData<IntegranteFormValues>
                            name="validadeMatricula"
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
