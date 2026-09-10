"use client";

import { UserPlusIcon } from "@phosphor-icons/react/dist/ssr/UserPlus";

import type { FormIntegrante as DadosIntegrante } from "@te-inscreve/schemas";
import {
    buttonVariants,
    cn,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
} from "@te-inscreve/components";

import { FormIntegrante } from "./form-integrante";

interface Props {
    aberto: boolean;
    onAbertoChange: (aberto: boolean) => void;
    onSalvar: (dados: DadosIntegrante) => Promise<void> | void;
}

/**
 * O cadastro de integrante, que sai do próprio botão que o promete: o gatilho
 * cresce até virar o formulário e encolhe de volta ao fechar. Ver
 * `docs/animacoes.md`.
 *
 * A abertura é controlada de fora porque quem fecha é o salvamento: só depois
 * de o cadastro dar certo é que a tela volta para a lista, já com a pessoa
 * nova. Enquanto o envio falha, o diálogo fica aberto com o que foi digitado.
 *
 * É também de fora que vem a abertura pedida pela URL: `usePainelIntegrantes`
 * lê o `?novo` da chegada e já entrega `aberto`. Aqui dentro não há como saber
 * disso — e nem precisa: para o diálogo, é a mesma abertura de sempre.
 */
export function DialogIntegrante({ aberto, onAbertoChange, onSalvar }: Props) {
    return (
        <ExpandableDialog
            id="novo-integrante"
            open={aberto}
            onOpenChange={onAbertoChange}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o navegador passa a interpolar, com os
                150ms dele, o `transform` que o Motion reescreve a cada quadro —
                o gatilho fica para trás do modal. */}
            <ExpandableDialogTrigger
                className={cn(buttonVariants(), "transition-colors")}
            >
                <SeloCompartilhado />
                {/* O mesmo texto do título, e não "Adicionar": o rótulo é
                    compartilhado, então o que muda de largura entre os dois
                    lados vira esticão de letra no meio do morph. */}
                <ExpandableDialogLabel>Novo integrante</ExpandableDialogLabel>
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-xl!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <SeloCompartilhado />
                        <ExpandableDialogTitle>
                            Novo integrante
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        Cadastre um integrante para que ele possa ser inscrito
                        em eventos e vinculado a grupos.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                <ExpandableDialogBody>
                    <FormIntegrante
                        onSalvar={onSalvar}
                        onCancelar={() => onAbertoChange(false)}
                    />
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * O ícone que viaja do botão para o cabeçalho do modal — do mesmo tamanho nos
 * dois lados, porque elemento compartilhado que muda de tamanho é escalado pelo
 * Motion, e escala em ícone deforma.
 *
 * Sem o disco do `ExpandableDialogIcon` padrão: o gatilho é um botão compacto,
 * e um selo de 36px dentro dele estouraria a altura.
 */
function SeloCompartilhado() {
    return (
        <ExpandableDialogIcon className="size-4 bg-transparent text-current">
            <UserPlusIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
