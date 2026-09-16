"use client";

import type { Transition } from "motion/react";
import type {
    CaptionLabelProps,
    DayButton,
    MonthGridProps,
    NavProps,
} from "react-day-picker";
import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
    DayPicker,
    getDefaultClassNames,
    UI,
    useDayPicker,
} from "react-day-picker";
import { ptBR } from "react-day-picker/locale/pt-BR";

import {
    Button,
    buttonVariants,
} from "@te-inscreve/components/components/button";
import { cn } from "@te-inscreve/components/utils";

/**
 * O que a grade do calendário está mostrando: os dias do mês, os doze meses do
 * ano à vista ou uma página de anos.
 */
type PainelCalendario = "dias" | "meses" | "anos";

/** Anos por página do painel de anos — o mesmo 3×4 da grade de meses. */
const ANOS_POR_PAGINA = 12;

/**
 * A folga, em pixels, entre a grade e o corte da caixa que a esconde enquanto
 * a altura anima — o `p-1`/`-m-1` da caixa, em número, porque a altura animada
 * precisa contá-la. Sem a folga, o corte apararia o anel de foco de 3px dos
 * dias das pontas.
 */
const FOLGA_DO_CORTE = 8;

/**
 * A inércia da troca de conteúdo da grade. Mola, e não duração fixa, porque a
 * navegação por mês é repetida: quem segura a seta encadeia trocas, e a mola
 * absorve a interrupção sem reiniciar do zero.
 */
const TRANSICAO: Transition = {
    type: "spring",
    stiffness: 520,
    damping: 44,
    mass: 0.7,
    opacity: { duration: 0.14 },
};

/**
 * Como a grade entra e sai.
 *
 * `direcao` é +1 quando o calendário avança no tempo, -1 quando volta e 0
 * quando não houve viagem nenhuma — a troca entre dias, meses e anos, que não
 * tem lado e por isso aparece no lugar, em escala.
 */
const VARIANTES_GRADE = {
    entrando: (direcao: number) => ({
        opacity: 0,
        x: direcao === 0 ? 0 : direcao > 0 ? "26%" : "-26%",
        scale: direcao === 0 ? 0.96 : 1,
    }),
    centro: { opacity: 1, x: 0, scale: 1, pointerEvents: "auto" as const },
    saindo: (direcao: number) => ({
        opacity: 0,
        // A grade que sai fica por cima enquanto anima: sem isto, um clique
        // apressado escolheria um dia do mês que já foi deixado para trás.
        pointerEvents: "none" as const,
        x: direcao === 0 ? 0 : direcao > 0 ? "-26%" : "26%",
        scale: direcao === 0 ? 0.96 : 1,
    }),
};

interface ContextoCalendario {
    painel: PainelCalendario;
    /**
     * Abre um painel — ou volta para os dias, passando `"dias"`. `ano` é o ano
     * de referência de onde a página de anos começa.
     */
    abrir: (painel: PainelCalendario, ano?: number) => void;
    paginaAnos: number;
    setPaginaAnos: React.Dispatch<React.SetStateAction<number>>;
    /** Limites de navegação, já resolvidos: nunca `undefined` aqui dentro. */
    inicio: Date;
    fim: Date;
    /** Quais partes da legenda abrem painel, conforme o `captionLayout`. */
    escolheMes: boolean;
    escolheAno: boolean;
    /**
     * O nome do mês no idioma do calendário, já em maiúscula: "Setembro" ou
     * "Set". Vem daqui, e não dos `formatters` do react-day-picker, porque os
     * dele só conhecem o idioma padrão quando chamados fora do render interno.
     */
    rotuloMes: (data: Date, largura: "long" | "short") => string;
}

const CalendarioContexto = React.createContext<ContextoCalendario | null>(null);

function useCalendario() {
    const contexto = React.use(CalendarioContexto);

    if (!contexto) {
        throw new Error("Componente de calendário usado fora do <Calendar>.");
    }

    return contexto;
}

/** "Setembro" a partir de "setembro" — legenda começa em maiúscula. */
function capitalizar(texto: string) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** O primeiro ano da página de doze que contém `ano`, contando desde `inicio`. */
function paginaDoAno(ano: number, inicio: Date) {
    const base = inicio.getFullYear();
    return base + Math.floor((ano - base) / ANOS_POR_PAGINA) * ANOS_POR_PAGINA;
}

/** Mês inteiro dentro dos limites? Basta um dia dele caber. */
function mesNavegavel(mes: Date, inicio: Date, fim: Date) {
    const fimDoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const inicioDoMes = new Date(mes.getFullYear(), mes.getMonth(), 1);
    return fimDoMes >= inicio && inicioDoMes <= fim;
}

/**
 * Calendário do produto: react-day-picker com o visual do shadcn, tudo em
 * português e com a escolha de mês e de ano feita em grade, não em `select`.
 *
 * Três animações, todas em Motion:
 *
 * - **troca de mês** — a grade sai para o lado de onde veio e a nova entra pelo
 *   outro, dando a direção da viagem (o equivalente ao `animate` do
 *   react-day-picker, que é feito em CSS e não sobreviveria à troca de classes
 *   daqui);
 * - **abrir mês ou ano** — a grade de dias é substituída, no mesmo lugar, pela
 *   grade de meses ou de anos;
 * - **altura** — a caixa acompanha o conteúdo, entre meses de cinco e de seis
 *   semanas e entre os painéis.
 *
 * `captionLayout` decide o que é clicável na legenda, mantendo o nome que o
 * shadcn usa: `"label"` deixa a legenda estática, `"dropdown"` abre os dois
 * painéis e `"dropdown-months"`/`"dropdown-years"` abrem só um deles.
 */
function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    locale = ptBR,
    startMonth,
    endMonth,
    formatters,
    components,
    ...props
}: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
    const defaultClassNames = getDefaultClassNames();

    // `code` é o BCP 47 do locale do date-fns ("pt-BR"), que é o que o Intl
    // entende. Sem locale, o calendário é o nosso padrão: português do Brasil.
    const codigo = locale.code ?? "pt-BR";

    const rotuloMes = React.useCallback(
        (data: Date, largura: "long" | "short") =>
            // O abreviado do português sai com ponto ("set."); dentro de um
            // botão de grade, o ponto é ruído.
            capitalizar(
                new Intl.DateTimeFormat(codigo, { month: largura })
                    .format(data)
                    .replace(/\.$/, ""),
            ),
        [codigo],
    );

    const escolheMes =
        captionLayout === "dropdown" || captionLayout === "dropdown-months";
    const escolheAno =
        captionLayout === "dropdown" || captionLayout === "dropdown-years";

    // Os painéis precisam de um começo e de um fim: uma grade de anos sem
    // limite não tem primeira nem última página. Onde quem chama não declarou,
    // o padrão é largo — e fica só aqui dentro, sem descer para o DayPicker,
    // que continua navegando sem limite como antes.
    const { inicio, fim } = React.useMemo(() => {
        const hoje = props.today ?? new Date();

        return {
            inicio: startMonth ?? new Date(hoje.getFullYear() - 100, 0, 1),
            fim: endMonth ?? new Date(hoje.getFullYear() + 25, 11, 31),
        };
    }, [startMonth, endMonth, props.today]);

    const [painel, setPainel] = React.useState<PainelCalendario>("dias");
    const [paginaAnos, setPaginaAnos] = React.useState(() =>
        paginaDoAno(new Date().getFullYear(), inicio),
    );

    const abrir = React.useCallback(
        (proximo: PainelCalendario, ano?: number) => {
            if (proximo === "anos" && ano !== undefined) {
                setPaginaAnos(paginaDoAno(ano, inicio));
            }
            setPainel(proximo);
        },
        [inicio],
    );

    const contexto = React.useMemo<ContextoCalendario>(
        () => ({
            painel,
            abrir,
            paginaAnos,
            setPaginaAnos,
            inicio,
            fim,
            escolheMes,
            escolheAno,
            rotuloMes,
        }),
        [
            painel,
            abrir,
            paginaAnos,
            inicio,
            fim,
            escolheMes,
            escolheAno,
            rotuloMes,
        ],
    );

    // Os componentes precisam de identidade estável: recriá-los a cada render
    // trocaria o tipo de cada nó e o React remontaria o calendário inteiro a
    // cada troca de mês — jogando fora, junto, a animação que este componente
    // existe para fazer.
    const componentes = React.useMemo(
        () => ({
            Root: CalendarRoot,
            Chevron: CalendarChevron,
            CaptionLabel: CalendarCaptionLabel,
            Nav: CalendarNav,
            MonthGrid: CalendarMonthGrid,
            DayButton: CalendarDayButton,
            WeekNumber: CalendarWeekNumber,
            ...components,
        }),
        [components],
    );

    return (
        <CalendarioContexto value={contexto}>
            {/* Com `prefers-reduced-motion` ligado, o Motion descarta as
                animações de transform e a grade apenas troca. */}
            <MotionConfig reducedMotion="user">
                <DayPicker
                    showOutsideDays={showOutsideDays}
                    locale={locale}
                    startMonth={startMonth}
                    endMonth={endMonth}
                    className={cn(
                        "group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
                        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                        className,
                    )}
                    // A legenda é sempre a nossa: os painéis substituem os
                    // `select` que o `captionLayout` do react-day-picker
                    // renderiza, e dois cabeçalhos ao mesmo tempo seria demais.
                    captionLayout="label"
                    formatters={{
                        // "Setembro de 2026" — o padrão do react-day-picker
                        // sai em minúscula e sem o "de".
                        formatCaption: (mes) =>
                            capitalizar(
                                new Intl.DateTimeFormat(codigo, {
                                    month: "long",
                                    year: "numeric",
                                }).format(mes),
                            ),
                        ...formatters,
                    }}
                    classNames={{
                        root: cn("w-fit", defaultClassNames.root),
                        months: cn(
                            "relative flex flex-col gap-4 md:flex-row",
                            defaultClassNames.months,
                        ),
                        month: cn(
                            "flex w-full flex-col gap-4",
                            defaultClassNames.month,
                        ),
                        nav: cn(
                            // A barra de navegação cobre a linha inteira da
                            // legenda por cima dela — o que era inofensivo
                            // enquanto a legenda era só texto, mas engolia o
                            // clique nos botões de mês e de ano. A barra deixa
                            // o ponteiro passar; só as setas o recebem de volta.
                            "pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
                            defaultClassNames.nav,
                        ),
                        button_previous: cn(
                            buttonVariants({ variant: buttonVariant }),
                            "pointer-events-auto size-(--cell-size) p-0 transition-colors select-none aria-disabled:opacity-50",
                            defaultClassNames.button_previous,
                        ),
                        button_next: cn(
                            buttonVariants({ variant: buttonVariant }),
                            "pointer-events-auto size-(--cell-size) p-0 transition-colors select-none aria-disabled:opacity-50",
                            defaultClassNames.button_next,
                        ),
                        month_caption: cn(
                            "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
                            defaultClassNames.month_caption,
                        ),
                        caption_label: cn(
                            "text-sm font-medium select-none",
                            defaultClassNames.caption_label,
                        ),
                        month_grid: cn(
                            "w-full border-collapse",
                            defaultClassNames.month_grid,
                        ),
                        weekdays: cn("flex", defaultClassNames.weekdays),
                        weekday: cn(
                            "text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal select-none",
                            defaultClassNames.weekday,
                        ),
                        week: cn("mt-2 flex w-full", defaultClassNames.week),
                        week_number_header: cn(
                            "w-(--cell-size) select-none",
                            defaultClassNames.week_number_header,
                        ),
                        week_number: cn(
                            "text-muted-foreground text-[0.8rem] select-none",
                            defaultClassNames.week_number,
                        ),
                        day: cn(
                            "group/day relative aspect-square h-full w-full p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
                            props.showWeekNumber
                                ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
                                : "[&:first-child[data-selected=true]_button]:rounded-l-md",
                            defaultClassNames.day,
                        ),
                        range_start: cn(
                            "bg-accent rounded-l-md",
                            defaultClassNames.range_start,
                        ),
                        range_middle: cn(
                            "rounded-none",
                            defaultClassNames.range_middle,
                        ),
                        range_end: cn(
                            "bg-accent rounded-r-md",
                            defaultClassNames.range_end,
                        ),
                        today: cn(
                            "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
                            defaultClassNames.today,
                        ),
                        outside: cn(
                            "text-muted-foreground aria-selected:text-muted-foreground",
                            defaultClassNames.outside,
                        ),
                        disabled: cn(
                            "text-muted-foreground opacity-50",
                            defaultClassNames.disabled,
                        ),
                        hidden: cn("invisible", defaultClassNames.hidden),
                        ...classNames,
                    }}
                    components={componentes}
                    {...props}
                />
            </MotionConfig>
        </CalendarioContexto>
    );
}

function CalendarRoot({
    className,
    rootRef,
    ...props
}: React.ComponentProps<"div"> & { rootRef?: React.Ref<HTMLDivElement> }) {
    return (
        <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
        />
    );
}

function CalendarChevron({
    className,
    orientation,
    ...props
}: React.ComponentProps<"svg"> & {
    orientation?: "up" | "down" | "left" | "right";
}) {
    if (orientation === "left") {
        return <CaretLeftIcon className={cn("size-4", className)} {...props} />;
    }

    if (orientation === "right") {
        return (
            <CaretRightIcon className={cn("size-4", className)} {...props} />
        );
    }

    return <CaretDownIcon className={cn("size-4", className)} {...props} />;
}

function CalendarWeekNumber({
    children,
    ...props
}: React.ComponentProps<"td">) {
    return (
        <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
            </div>
        </td>
    );
}

/** Um dos dois botões da legenda: o nome do mês e o ano. */
function BotaoLegenda({
    aberto,
    className,
    children,
    ...props
}: React.ComponentProps<"button"> & { aberto: boolean }) {
    return (
        <button
            type="button"
            aria-expanded={aberto}
            data-aberto={aberto}
            className={cn(
                buttonVariants({ variant: "ghost" }),
                "data-[aberto=true]:bg-accent data-[aberto=true]:text-accent-foreground h-8 gap-1 px-2 text-sm font-medium transition-colors",
                className,
            )}
            {...props}
        >
            {children}
            <CaretDownIcon
                aria-hidden="true"
                className={cn(
                    "text-muted-foreground size-3.5 transition-transform",
                    aberto && "rotate-180",
                )}
            />
        </button>
    );
}

/**
 * A legenda do mês. Com `captionLayout="label"` continua sendo o texto que o
 * react-day-picker formatou; nos outros, vira os botões que abrem os painéis.
 *
 * O botão do mês volta para os dias quando o painel de meses já está aberto —
 * clicar de novo no que está aberto fecha, como em qualquer menu.
 */
function CalendarCaptionLabel({
    className,
    children,
    ...props
}: CaptionLabelProps) {
    const { painel, abrir, paginaAnos, escolheMes, escolheAno, rotuloMes } =
        useCalendario();
    const { months } = useDayPicker();

    const mes = months[0]?.date;

    if (!mes || (!escolheMes && !escolheAno)) {
        return (
            <span className={className} {...props}>
                {children}
            </span>
        );
    }

    const nomeDoMes = rotuloMes(mes, "long");
    const rotuloDoAno =
        painel === "anos"
            ? `${paginaAnos} – ${paginaAnos + ANOS_POR_PAGINA - 1}`
            : String(mes.getFullYear());

    return (
        <span className={cn("flex items-center gap-1", className)} {...props}>
            {escolheMes && (
                <BotaoLegenda
                    aberto={painel === "meses"}
                    aria-label={`Escolher o mês — ${nomeDoMes}`}
                    onClick={() => abrir(painel === "meses" ? "dias" : "meses")}
                >
                    {nomeDoMes}
                </BotaoLegenda>
            )}
            {escolheAno && (
                <BotaoLegenda
                    aberto={painel === "anos"}
                    aria-label={`Escolher o ano — ${rotuloDoAno}`}
                    onClick={() =>
                        abrir(
                            painel === "anos" ? "dias" : "anos",
                            mes.getFullYear(),
                        )
                    }
                >
                    {rotuloDoAno}
                </BotaoLegenda>
            )}
        </span>
    );
}

/**
 * As setas. O que elas andam depende do painel aberto: um mês na grade de
 * dias, um ano na de meses e uma página de doze na de anos — o passo do que
 * está à vista, e não sempre o mês.
 */
function CalendarNav({
    className,
    onPreviousClick,
    onNextClick,
    previousMonth,
    nextMonth,
    ...props
}: NavProps) {
    const { painel, paginaAnos, setPaginaAnos, inicio, fim } = useCalendario();
    const { months, classNames, labels, goToMonth } = useDayPicker();

    const mes = months[0]?.date ?? new Date();

    const anoAnterior = new Date(mes.getFullYear() - 1, mes.getMonth(), 1);
    const anoSeguinte = new Date(mes.getFullYear() + 1, mes.getMonth(), 1);

    const navegacao = {
        dias: {
            anterior: {
                rotulo: labels.labelPrevious(previousMonth),
                ativo: Boolean(previousMonth),
                ir: onPreviousClick,
            },
            proxima: {
                rotulo: labels.labelNext(nextMonth),
                ativo: Boolean(nextMonth),
                ir: onNextClick,
            },
        },
        meses: {
            anterior: {
                rotulo: "Ir para o ano anterior",
                ativo: mesNavegavel(anoAnterior, inicio, fim),
                ir: () => goToMonth(anoAnterior),
            },
            proxima: {
                rotulo: "Ir para o próximo ano",
                ativo: mesNavegavel(anoSeguinte, inicio, fim),
                ir: () => goToMonth(anoSeguinte),
            },
        },
        anos: {
            anterior: {
                rotulo: "Ver os anos anteriores",
                ativo: paginaAnos > inicio.getFullYear(),
                ir: () => setPaginaAnos((pagina) => pagina - ANOS_POR_PAGINA),
            },
            proxima: {
                rotulo: "Ver os próximos anos",
                ativo: paginaAnos + ANOS_POR_PAGINA <= fim.getFullYear(),
                ir: () => setPaginaAnos((pagina) => pagina + ANOS_POR_PAGINA),
            },
        },
    }[painel];

    return (
        <nav className={className} {...props}>
            {(
                [
                    ["left", navegacao.anterior],
                    ["right", navegacao.proxima],
                ] as const
            ).map(([lado, botao]) => (
                <button
                    key={lado}
                    type="button"
                    className={
                        lado === "left"
                            ? classNames[UI.PreviousMonthButton]
                            : classNames[UI.NextMonthButton]
                    }
                    tabIndex={botao.ativo ? undefined : -1}
                    aria-disabled={botao.ativo ? undefined : true}
                    aria-label={botao.rotulo}
                    onClick={(evento) => {
                        if (botao.ativo) botao.ir?.(evento);
                    }}
                >
                    {lado === "left" ? (
                        <CaretLeftIcon
                            aria-hidden="true"
                            className={cn("size-4", classNames[UI.Chevron])}
                        />
                    ) : (
                        <CaretRightIcon
                            aria-hidden="true"
                            className={cn("size-4", classNames[UI.Chevron])}
                        />
                    )}
                </button>
            ))}
        </nav>
    );
}

/** Uma casa da grade de meses ou de anos. */
function CelulaPainel({
    selecionada,
    className,
    ...props
}: React.ComponentProps<"button"> & { selecionada: boolean }) {
    return (
        <button
            type="button"
            // `aria-pressed`, e não `aria-selected`: cada casa é um botão que
            // liga o mês ou o ano que ele mostra, fora de qualquer grade ARIA.
            aria-pressed={selecionada}
            className={cn(
                buttonVariants({
                    variant: selecionada ? "default" : "ghost",
                }),
                "h-10 w-full text-sm font-normal transition-colors disabled:opacity-40",
                className,
            )}
            {...props}
        />
    );
}

/**
 * A grade: os dias do mês, os meses do ano ou uma página de anos — sempre uma
 * só, trocada com animação.
 *
 * O `AnimatePresence` é `popLayout` porque as duas grades precisam coexistir
 * durante a troca sem empurrar uma à outra: a que sai é tirada do fluxo, e a
 * caixa em volta anima a diferença de altura por `layout`.
 */
function CalendarMonthGrid({
    className,
    children,
    // O react-day-picker não passa nenhum destes, mas os tipos de arrastar e
    // de animar do DOM colidem com os do Motion: ficam de fora da tabela.
    onDrag: _onDrag,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    onAnimationStart: _onAnimationStart,
    ...props
}: MonthGridProps) {
    const { painel, abrir, paginaAnos, inicio, fim, rotuloMes } =
        useCalendario();
    const { months, goToMonth } = useDayPicker();

    const mes = months[0]?.date ?? new Date();
    const chaveDoMes = mes.getFullYear() * 12 + mes.getMonth();

    // Para que lado a grade desliza. A direção não é uma propriedade do mês
    // novo, e sim da distância até o que estava antes — daí guardar o anterior
    // em estado e ajustá-lo durante o render, como manda o padrão do React
    // para estado derivado de props.
    const [anterior, setAnterior] = React.useState({
        chave: chaveDoMes,
        painel,
        direcao: 0,
    });

    let direcao = anterior.direcao;

    if (anterior.chave !== chaveDoMes || anterior.painel !== painel) {
        // Trocar de painel não é viajar no tempo: entra e sai no lugar.
        direcao =
            anterior.painel !== painel || painel !== "dias"
                ? 0
                : Math.sign(chaveDoMes - anterior.chave);
        setAnterior({ chave: chaveDoMes, painel, direcao });
    }

    const medidor = React.useRef<HTMLDivElement>(null);
    const [altura, setAltura] = React.useState<number>();

    React.useLayoutEffect(() => {
        const no = medidor.current;
        if (!no) return;

        // `ResizeObserver`, e não uma medida por render: a grade muda de altura
        // entre meses de cinco e de seis semanas e entre os painéis, e o
        // observador pega as duas coisas antes do primeiro quadro.
        const medir = () => setAltura(no.offsetHeight + FOLGA_DO_CORTE);
        const observador = new ResizeObserver(medir);
        observador.observe(no);
        medir();

        return () => observador.disconnect();
    }, []);

    const irPara = (data: Date) => {
        goToMonth(data);
        abrir("dias");
    };

    const conteudo = {
        dias: (
            <motion.table
                key={`dias-${chaveDoMes}`}
                className={className}
                custom={direcao}
                variants={VARIANTES_GRADE}
                initial="entrando"
                animate="centro"
                exit="saindo"
                transition={TRANSICAO}
                {...props}
            >
                {children}
            </motion.table>
        ),
        meses: (
            <motion.div
                key="meses"
                role="group"
                aria-label="Escolha o mês"
                className="grid grid-cols-3 gap-2"
                custom={0}
                variants={VARIANTES_GRADE}
                initial="entrando"
                animate="centro"
                exit="saindo"
                transition={TRANSICAO}
            >
                {Array.from({ length: 12 }, (_, indice) => {
                    const opcao = new Date(mes.getFullYear(), indice, 1);
                    const disponivel = mesNavegavel(opcao, inicio, fim);

                    return (
                        <CelulaPainel
                            key={indice}
                            selecionada={indice === mes.getMonth()}
                            disabled={!disponivel}
                            onClick={() => irPara(opcao)}
                        >
                            {rotuloMes(opcao, "short")}
                        </CelulaPainel>
                    );
                })}
            </motion.div>
        ),
        anos: (
            <motion.div
                key="anos"
                role="group"
                aria-label="Escolha o ano"
                className="grid grid-cols-3 gap-2"
                custom={0}
                variants={VARIANTES_GRADE}
                initial="entrando"
                animate="centro"
                exit="saindo"
                transition={TRANSICAO}
            >
                {Array.from({ length: ANOS_POR_PAGINA }, (_, indice) => {
                    const ano = paginaAnos + indice;
                    // O mês à vista pode não existir no ano escolhido — em
                    // fevereiro de um ano que acaba em janeiro, por exemplo.
                    // A grade de meses, que vem logo depois, resolve.
                    const disponivel =
                        ano >= inicio.getFullYear() && ano <= fim.getFullYear();

                    return (
                        <CelulaPainel
                            key={ano}
                            selecionada={ano === mes.getFullYear()}
                            disabled={!disponivel}
                            onClick={() => {
                                const destino = new Date(
                                    ano,
                                    mes.getMonth(),
                                    1,
                                );

                                irPara(
                                    mesNavegavel(destino, inicio, fim)
                                        ? destino
                                        : destino < inicio
                                          ? inicio
                                          : fim,
                                );
                            }}
                        >
                            {ano}
                        </CelulaPainel>
                    );
                })}
            </motion.div>
        ),
    }[painel];

    return (
        // A altura é animada como altura, e não com `layout`: aquele anima a
        // caixa escalando o elemento, e escala aplicada a texto é literalmente
        // letra esticada — era o que deformava os nomes dos meses no meio da
        // troca. Ver a seção 3 de `docs/animacoes.md`.
        <motion.div
            // `overflow-hidden` para a grade ser revelada junto com a altura,
            // em vez de aparecer inteira por cima do que vem abaixo do
            // calendário; o `p-1 -m-1` devolve o espaço do anel de foco sem
            // mexer no lugar que a grade ocupa.
            className="relative -m-1 w-full overflow-hidden p-1"
            initial={false}
            animate={altura === undefined ? {} : { height: altura }}
            transition={TRANSICAO}
        >
            {/* Mede o conteúdo que entra: quem sai está fora do fluxo, por
                conta do `popLayout`, e por isso não entra na conta. */}
            <div ref={medidor}>
                <AnimatePresence
                    mode="popLayout"
                    initial={false}
                    custom={direcao}
                >
                    {conteudo}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function CalendarDayButton({
    className,
    day,
    modifiers,
    ...props
}: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames();

    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString()}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={cn(
                "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className,
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };
