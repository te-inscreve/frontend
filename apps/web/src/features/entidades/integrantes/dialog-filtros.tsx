"use client";

import { useState } from "react";
import { FunnelIcon } from "@phosphor-icons/react/dist/ssr/Funnel";

import {
    Badge,
    Button,
    buttonVariants,
    cn,
    ExpandableDialog,
    ExpandableDialogBody,
    ExpandableDialogContent,
    ExpandableDialogDescription,
    ExpandableDialogFooter,
    ExpandableDialogHeader,
    ExpandableDialogIcon,
    ExpandableDialogLabel,
    ExpandableDialogTitle,
    ExpandableDialogTrigger,
    Field,
    FieldError,
    FieldLabel,
    Label,
    Switch,
} from "@te-inscreve/components";

import type { FiltrosIntegrantes } from "./filtros-integrantes";
import { NumberInput } from "~/shared/ui/number-input";
import { filtrosAvancadosAtivos } from "./filtros-integrantes";

interface Props {
    filtros: FiltrosIntegrantes;
    onChange: (filtros: FiltrosIntegrantes) => void;
}

/**
 * Os filtros que não cabem na barra: faixa de idade e matrícula vencida.
 *
 * O diálogo trabalha em rascunho e só devolve o filtro no "Aplicar". Filtrar a
 * cada clique não adiantaria nada aqui — a lista está atrás do overlay, e a
 * pessoa não veria o efeito enquanto escolhe.
 *
 * Expande a partir do próprio botão em vez de aparecer no centro: o rótulo dos
 * dois lados é a mesma palavra, então o que abre não é outra coisa — é o
 * "Filtros" da barra crescendo até caber as escolhas, e encolhendo de volta
 * para o lugar de onde saiu. É o caso do `BotaoEditarCategoria` em
 * `docs/animacoes.md`, e não o do formulário solto que um botão de barra abre.
 */
export function DialogFiltros({ filtros, onChange }: Props) {
    const [aberto, setAberto] = useState(false);
    const [rascunho, setRascunho] = useState(filtros);

    const ativos = filtrosAvancadosAtivos(filtros);

    /** Faixa de cabeça para baixo não devolveria ninguém: não deixa aplicar. */
    const intervaloInvertido =
        rascunho.idadeMinima !== null &&
        rascunho.idadeMaxima !== null &&
        rascunho.idadeMaxima < rascunho.idadeMinima;

    const abrir = (proximo: boolean) => {
        // O rascunho nasce do filtro em uso a cada abertura: assim o diálogo
        // não guarda escolhas que a pessoa abandonou da última vez.
        if (proximo) setRascunho(filtros);
        setAberto(proximo);
    };

    const aplicar = () => {
        onChange(rascunho);
        setAberto(false);
    };

    const limpar = () =>
        setRascunho({
            ...rascunho,
            idadeMinima: null,
            idadeMaxima: null,
            somenteVencidas: false,
        });

    return (
        <ExpandableDialog
            id="filtros-integrantes"
            open={aberto}
            onOpenChange={abrir}
        >
            {/* `buttonVariants` em vez de `<Button asChild>`: o gatilho já é o
                `button` do Radix sobre um `motion.button`, e embrulhar mais um
                daria botão dentro de botão.

                O `transition-colors` no fim não é enfeite: o botão vem com
                `transition-all`, e aí o navegador passa a interpolar, com os
                150ms dele, o `transform` que o Motion reescreve a cada quadro —
                o gatilho fica para trás do modal. */}
            <ExpandableDialogTrigger
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 transition-colors",
                )}
            >
                <FunilCompartilhado />
                {/* `font-semibold` porque o rótulo padrão é `font-medium` e
                    trocaria o peso do texto do botão; é também o peso do
                    título, e o que viaja no morph é o tamanho, não a espessura. */}
                <ExpandableDialogLabel className="font-semibold">
                    Filtros
                </ExpandableDialogLabel>
                {/* A contagem não viaja: ela é do estado fechado, e some com o
                    resto do botão assim que a caixa começa a crescer. */}
                {ativos > 0 && (
                    <Badge variant="secondary" className="ml-1">
                        {ativos}
                    </Badge>
                )}
            </ExpandableDialogTrigger>

            <ExpandableDialogContent className="max-w-md!">
                <ExpandableDialogHeader>
                    <div className="flex items-center gap-2">
                        <FunilCompartilhado />
                        <ExpandableDialogTitle className="text-primary">
                            Filtros
                        </ExpandableDialogTitle>
                    </div>
                    <ExpandableDialogDescription>
                        Recorte a lista pela idade que define a categoria e pela
                        situação da matrícula.
                    </ExpandableDialogDescription>
                </ExpandableDialogHeader>

                {/* O rodapé vive dentro do corpo, e não ao lado dele: assim os
                    botões entram na mesma aparição atrasada dos campos, em vez
                    de já estarem lá enquanto a caixa ainda cresce. */}
                <ExpandableDialogBody className="gap-5">
                    {/* Nenhuma ponta limita a outra enquanto se digita: com
                        `min` amarrado à mínima, o primeiro dígito da máxima
                        já cai abaixo do limite e o campo se apaga sozinho —
                        digitar 40 depois de 20 era impossível. A inversão é
                        cobrada no fim, quando as duas já têm valor. */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field data-invalid={intervaloInvertido}>
                            <FieldLabel htmlFor="filtro-idade-minima">
                                Idade mínima
                            </FieldLabel>
                            <NumberInput
                                id="filtro-idade-minima"
                                value={rascunho.idadeMinima}
                                onChange={(valor) =>
                                    setRascunho({
                                        ...rascunho,
                                        idadeMinima: valor ?? null,
                                    })
                                }
                                min={0}
                                aria-invalid={intervaloInvertido}
                                aria-describedby={
                                    intervaloInvertido
                                        ? "filtro-idade-erro"
                                        : undefined
                                }
                                placeholder="Sem mínimo"
                            />
                        </Field>

                        <Field data-invalid={intervaloInvertido}>
                            <FieldLabel htmlFor="filtro-idade-maxima">
                                Idade máxima
                            </FieldLabel>
                            <NumberInput
                                id="filtro-idade-maxima"
                                value={rascunho.idadeMaxima}
                                onChange={(valor) =>
                                    setRascunho({
                                        ...rascunho,
                                        idadeMaxima: valor ?? null,
                                    })
                                }
                                min={0}
                                aria-invalid={intervaloInvertido}
                                aria-describedby={
                                    intervaloInvertido
                                        ? "filtro-idade-erro"
                                        : undefined
                                }
                                placeholder="Sem máximo"
                            />
                        </Field>
                    </div>

                    {intervaloInvertido && (
                        <FieldError
                            id="filtro-idade-erro"
                            className="-mt-3"
                            errors={[
                                {
                                    message:
                                        "A idade máxima precisa ser maior ou igual à mínima.",
                                },
                            ]}
                        />
                    )}

                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filtro-vencidas"
                                checked={rascunho.somenteVencidas}
                                onCheckedChange={(marcado) =>
                                    setRascunho({
                                        ...rascunho,
                                        somenteVencidas: marcado,
                                    })
                                }
                            />
                            <Label htmlFor="filtro-vencidas">
                                Somente matrículas vencidas
                            </Label>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs">
                            Quem está com a matrícula vencida não pode ser
                            inscrito no evento — é a lista de quem precisa
                            renovar.
                        </p>
                    </div>

                    <ExpandableDialogFooter className="border-t pt-4">
                        <Button type="button" variant="ghost" onClick={limpar}>
                            Limpar
                        </Button>
                        <Button
                            type="button"
                            onClick={aplicar}
                            disabled={intervaloInvertido}
                        >
                            Aplicar filtros
                        </Button>
                    </ExpandableDialogFooter>
                </ExpandableDialogBody>
            </ExpandableDialogContent>
        </ExpandableDialog>
    );
}

/**
 * O funil que viaja do botão para o cabeçalho do modal — do mesmo tamanho e da
 * mesma cor nos dois lados.
 *
 * Sem o disco do `ExpandableDialogIcon` padrão: o gatilho é um botão compacto,
 * e um selo de 36px dentro dele estouraria a altura. Crescer no caminho também
 * não serve — elemento compartilhado que muda de tamanho é escalado pelo
 * Motion, e escala em ícone deforma.
 */
function FunilCompartilhado() {
    return (
        <ExpandableDialogIcon className="text-primary size-4 bg-transparent">
            <FunnelIcon aria-hidden="true" weight="bold" />
        </ExpandableDialogIcon>
    );
}
