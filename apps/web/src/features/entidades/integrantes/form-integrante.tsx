"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { useForm } from "react-hook-form";

import { Button, FieldGroup } from "@te-inscreve/components";
import { FormProvider } from "@te-inscreve/components/components/field";

import type { IntegranteFormValues } from "./integrante-form-schema";
import type { Integrante } from "~/features/entidades/shared/integrantes";
import { FUNCOES } from "~/features/entidades/shared/integrantes";
import { CampoData } from "~/shared/ui/form/campo-data";
import { CampoSelect } from "~/shared/ui/form/campo-select";
import { CampoTexto } from "~/shared/ui/form/campo-texto";
import {
    integranteFormDefaults,
    integranteFormInput,
    integranteFormSchema,
} from "./integrante-form-schema";

interface Props {
    /** Recebe o integrante pronto; o id fica com quem guarda a lista. */
    onSalvar: (integrante: Omit<Integrante, "id">) => void;
    onCancelar: () => void;
}

const HOJE = new Date();
/** Ninguém no MTG nasceu antes disso, e o calendário não precisa oferecer. */
const NASCIMENTO_MAIS_ANTIGO = new Date(1920, 0, 1);

/**
 * Cadastro de integrante, ao lado da listagem.
 *
 * Os campos seguem a ordem do documento que a pessoa tem na mão: nome,
 * matrícula, validade, nascimento — e só depois o que a entidade preenche por
 * conta própria. Os opcionais ficam por último, separados, para que ninguém
 * pare no meio achando que faltou informação.
 *
 * Ainda não há API: o integrante entra na lista em memória e some no refresh.
 */
export function FormIntegrante({ onSalvar, onCancelar }: Props) {
    const form = useForm<IntegranteFormValues>({
        resolver: zodResolver(integranteFormSchema),
        defaultValues: integranteFormDefaults,
    });

    const salvar = (valores: IntegranteFormValues) => {
        onSalvar(integranteFormInput(valores));
        form.reset(integranteFormDefaults);
    };

    return (
        <FormProvider {...form}>
            <form
                noValidate
                onSubmit={form.handleSubmit(salvar)}
                className="bg-card flex flex-col gap-5 rounded-xl border p-4"
            >
                <div>
                    <h3 className="text-base font-semibold">Novo integrante</h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Os dados da matrícula são o que a comissão do evento
                        confere na inscrição.
                    </p>
                </div>

                <FieldGroup>
                    <CampoTexto<IntegranteFormValues>
                        name="nome"
                        label="Nome completo"
                        placeholder="Ex.: Marina Colussi"
                    />

                    <CampoTexto<IntegranteFormValues>
                        name="matriculaCtg"
                        label="Matrícula CTG"
                        placeholder="Ex.: MTG-2016-01204"
                    />

                    <CampoData<IntegranteFormValues>
                        name="validadeMatricula"
                        label="Validade da matrícula"
                        ajuda="Matrícula vencida impede a inscrição no evento."
                        mesInicial={HOJE}
                    />

                    <CampoData<IntegranteFormValues>
                        name="dataNascimento"
                        label="Data de nascimento"
                        ajuda="É a idade que define em qual categoria a pessoa compete."
                        dataMinima={NASCIMENTO_MAIS_ANTIGO}
                        dataMaxima={HOJE}
                    />
                </FieldGroup>

                <FieldGroup className="border-t pt-4">
                    <CampoData<IntegranteFormValues>
                        name="dataFiliacao"
                        label="Data de filiação"
                        opcional
                        dataMinima={NASCIMENTO_MAIS_ANTIGO}
                        dataMaxima={HOJE}
                    />

                    <CampoSelect<IntegranteFormValues>
                        name="funcao"
                        label="Função"
                        opcional
                        opcoes={FUNCOES}
                        placeholder="Selecionar função"
                    />
                </FieldGroup>

                <div className="flex flex-col gap-2 border-t pt-4">
                    <Button type="submit">
                        <FloppyDiskIcon aria-hidden="true" />
                        Salvar integrante
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancelar}
                        className="justify-center"
                    >
                        <XIcon aria-hidden="true" />
                        Cancelar
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
