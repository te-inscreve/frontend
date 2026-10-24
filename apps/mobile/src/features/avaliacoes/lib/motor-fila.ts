import type { ErroDeEnvioLocalizado } from "@te-inscreve/schemas";
import {
    avaliacaoEnviadaSchema,
    errosDeEnvioSchema,
} from "@te-inscreve/schemas";

import type { AvaliacaoLocal, ErroDeEnvio } from "~/db/schema";

/*
 * O motor da fila de envio (TE-106): só o app envia, só com ele aberto, um
 * remetente só. Nada aqui toca o banco, a rede ou o relógio direto — vem
 * tudo pelas portas, para o vitest rodar o motor sem aparelho. Quem liga as
 * portas ao SQLite e ao tRPC é `use-motor-fila.ts`.
 */

/**
 * O que o servidor respondeu, ou `status: null` quando a resposta nem
 * chegou (sem rede, timeout, Next fora do ar). É o que `enviar` devolve: o
 * ponto de troca se o envio em segundo plano voltar (TE-105), cujo nativo
 * também devolve status e corpo.
 */
export interface Resposta {
    status: number | null;
    corpo?: unknown;
    /** Segundos do `Retry-After` de um 429. */
    retryAfter?: number | null;
}

/** Uma leitura do servidor: os dados, ou a resposta que falhou. */
export type Consulta<T> =
    { ok: true; dados: T } | { ok: false; resposta: Resposta };

/** Uma avaliação que o servidor já tem, como a conferência a lê. */
export interface AvaliacaoNoServidor {
    id: number;
    inscricaoId: number;
    avaliadorId: number;
    nota: string;
}

/** O que a resposta quer dizer para a fila. */
export type Classe =
    | { tipo: "aceita"; servidorId: number; nota: string }
    | { tipo: "nao_autenticado" }
    | { tipo: "temporaria"; retryAfter: number | null }
    | { tipo: "recusada"; erro: ErroDeEnvio }
    /** 409: só a consulta do TE-68 diz se é "já avaliou". */
    | { tipo: "conflito"; mensagem: string };

/**
 * A classificação da resposta, toda no JS (spec, "Classificação da
 * resposta"): 201 aceita; 401 e 403 pausam a fila e pedem login; transporte,
 * timeout, 5xx e 429 são temporárias; 400 e 404 recusam; 409 vai à consulta.
 */
export function classificar(resposta: Resposta): Classe {
    const { status, corpo } = resposta;
    if (status === null) return { tipo: "temporaria", retryAfter: null };

    if (status >= 200 && status < 300) {
        const enviada = avaliacaoEnviadaSchema.safeParse(corpo);
        // Gravou, mas o corpo não diz o quê: o reenvio dá 409, e a consulta
        // acha a avaliação.
        if (!enviada.success) return { tipo: "temporaria", retryAfter: null };
        return {
            tipo: "aceita",
            servidorId: enviada.data.id,
            nota: enviada.data.nota,
        };
    }

    if (status === 401 || status === 403) return { tipo: "nao_autenticado" };

    if (status === 408 || status === 429 || status >= 500)
        return { tipo: "temporaria", retryAfter: resposta.retryAfter ?? null };

    if (status === 409)
        return {
            tipo: "conflito",
            mensagem:
                detalheDoCorpo(corpo) ??
                "O servidor não aceitou esta avaliação agora.",
        };

    if (status === 400) {
        const erros = errosDeEnvioSchema.safeParse(corpo);
        return {
            tipo: "recusada",
            erro: erros.success
                ? {
                      status,
                      mensagem: mensagemDosErros(erros.data.erros),
                      erros: erros.data.erros,
                  }
                : {
                      status,
                      mensagem:
                          detalheDoCorpo(corpo) ??
                          "O servidor recusou o conteúdo da avaliação.",
                  },
        };
    }

    if (status === 404)
        return {
            tipo: "recusada",
            erro: {
                status,
                mensagem:
                    "A inscrição não existe mais no servidor, ou saiu desta categoria.",
            },
        };

    return {
        tipo: "recusada",
        erro: {
            status,
            mensagem:
                detalheDoCorpo(corpo) ??
                `O servidor recusou a avaliação (${status}).`,
        },
    };
}

function mensagemDosErros(erros: ErroDeEnvioLocalizado[]) {
    const [primeiro] = erros;
    if (!primeiro) return "O servidor recusou o conteúdo da avaliação.";
    if (erros.length === 1) return primeiro.mensagem;
    return `${primeiro.mensagem} (e mais ${erros.length - 1})`;
}

function detalheDoCorpo(corpo: unknown) {
    if (typeof corpo !== "object" || corpo === null) return undefined;
    const { detail } = corpo as { detail?: unknown };
    return typeof detail === "string" && detail.trim() ? detail : undefined;
}

/** A primeira espera depois de uma falha temporária. */
export const ESPERA_INICIAL_MS = 15_000;
/** O teto do backoff: com o app na frente, nunca mais que isso parado. */
export const ESPERA_MAXIMA_MS = 15 * 60_000;

/**
 * Quanto esperar antes da tentativa seguinte à `tentativas`-ésima falha:
 * 15 s, 30 s, 1 min, 2 min… até 15 min. O `Retry-After` de um 429 manda,
 * se pedir mais.
 */
export function esperaDoBackoff(tentativas: number, retryAfter: number | null) {
    const exponencial = Math.min(
        ESPERA_INICIAL_MS * 2 ** Math.max(0, tentativas - 1),
        ESPERA_MAXIMA_MS,
    );
    return Math.max(exponencial, (retryAfter ?? 0) * 1000);
}

/**
 * O banco e a rede, do jeito que o motor os vê. Cada transição de estado é
 * condicional à de origem: o motor nunca tira uma avaliação de um estado em
 * que ela já não está (o avaliador a tirou da fila para editar, por exemplo).
 */
export interface PortasFila {
    /** O avaliador logado, como o backend o identifica. */
    avaliadorId: number;
    /** `enviando` → `na_fila`: o envio que ficou no meio quando o app morreu. */
    retomarInterrompidas: () => Promise<void>;
    /** As `na_fila` do avaliador, na ordem FIFO. */
    naFila: () => Promise<AvaliacaoLocal[]>;
    /** `na_fila` → `enviando`. `false` se ela já não estava na fila. */
    marcarEnviando: (id: string) => Promise<boolean>;
    /** `na_fila` ou `enviando` → `sincronizada`, com o que o servidor gravou. */
    marcarSincronizada: (
        id: string,
        servidor: { servidorId: number; nota: string },
    ) => Promise<void>;
    /** `enviando` → `com_erro`. */
    marcarComErro: (id: string, erro: ErroDeEnvio) => Promise<void>;
    /**
     * `enviando` → `na_fila`, no mesmo lugar. Com `falha`, conta a tentativa e
     * marca até quando esperar.
     */
    devolverAFila: (
        id: string,
        falha?: { tentativas: number; proximaTentativaEm: Date },
    ) => Promise<void>;
    enviar: (avaliacao: AvaliacaoLocal) => Promise<Resposta>;
    /** `avaliacao.getMinhasAvaliacoes`, achatada. */
    minhasAvaliacoes: () => Promise<Consulta<AvaliacaoNoServidor[]>>;
    /** A consulta do 409 (TE-68): as avaliações da inscrição. */
    avaliacoesDaInscricao: (
        avaliacao: AvaliacaoLocal,
    ) => Promise<Consulta<AvaliacaoNoServidor[]>>;
}

/** O tempo, injetável nos testes. */
export interface Relogio {
    agora(): number;
    /** Chama `fn` daqui a `ms`; devolve o cancelamento. */
    agendar(ms: number, fn: () => void): () => void;
}

/** O que o motor está fazendo, para a dock e o detalhe da fila. */
export interface EstadoMotor {
    fase: "parado" | "conferindo" | "enviando";
    /** Aceitas na rodada em curso, e quantas ela tinha ao começar. */
    enviadas: number;
    total: number;
    semRede: boolean;
    /** O servidor recusou a sessão: nada sai até entrar de novo. */
    pedeLogin: boolean;
}

/** Por que uma rodada começa. A abertura e o `active` tratam o envio interrompido e conferem. */
export type Gatilho = "abertura" | "conexao" | "salvou" | "backoff";

interface Pedido {
    abertura: boolean;
    furarBackoff: boolean;
}

/**
 * O motor de um avaliador logado. Roda uma rodada por vez: um gatilho no
 * meio só marca que, ao terminar, a fila roda de novo.
 */
export class MotorFila {
    private estado: EstadoMotor = {
        fase: "parado",
        enviadas: 0,
        total: 0,
        semRede: false,
        pedeLogin: false,
    };
    private readonly ouvintes = new Set<() => void>();
    /** Liga a cada abertura e `active`; só desliga com a conferência feita. */
    private conferenciaPendente = false;
    private rodando: Promise<void> | null = null;
    /** O que chegou durante a rodada, para a próxima. */
    private proxima: Pedido | null = null;
    private cancelarBackoff: (() => void) | null = null;
    private ativo = true;

    constructor(
        private readonly portas: PortasFila,
        private readonly relogio: Relogio,
        private readonly aoPedirLogin: () => void = () => undefined,
    ) {}

    lerEstado(): EstadoMotor {
        return this.estado;
    }

    inscrever(ouvinte: () => void) {
        this.ouvintes.add(ouvinte);
        return () => {
            this.ouvintes.delete(ouvinte);
        };
    }

    /** A conexão mudou. Voltar dispara uma rodada; cair só marca. */
    conexao(online: boolean) {
        const voltou = this.estado.semRede && online;
        this.mudar({ semRede: !online });
        if (voltou) void this.disparar("conexao");
    }

    /**
     * O app foi para segundo plano: o backoff só corre com ele na frente. O
     * envio em curso segue até a resposta; o que ficar `enviando` se o SO
     * matar o processo volta na próxima abertura.
     */
    pausar() {
        this.cancelarBackoff?.();
        this.cancelarBackoff = null;
    }

    /** O avaliador saiu, ou o motor foi trocado: nada mais roda. */
    encerrar() {
        this.ativo = false;
        this.pausar();
        this.ouvintes.clear();
    }

    /** Começa uma rodada, ou agenda uma ao fim da que está em curso. */
    disparar(gatilho: Gatilho): Promise<void> {
        const pedido: Pedido = {
            abertura: gatilho === "abertura",
            // Abrir, voltar para a frente e a conexão voltar tentam na hora.
            furarBackoff: gatilho === "abertura" || gatilho === "conexao",
        };
        if (pedido.abertura) this.conferenciaPendente = true;

        if (this.rodando) {
            this.proxima = {
                abertura: pedido.abertura || !!this.proxima?.abertura,
                furarBackoff:
                    pedido.furarBackoff || !!this.proxima?.furarBackoff,
            };
            return this.rodando;
        }

        this.rodando = (async () => {
            let atual: Pedido | null = pedido;
            while (atual && this.ativo) {
                this.proxima = null;
                await this.rodada(atual);
                atual = this.proxima;
            }
        })().finally(() => {
            this.rodando = null;
            this.mudar({ fase: "parado", enviadas: 0, total: 0 });
        });
        return this.rodando;
    }

    /**
     * A sequência da spec (TE-94): na abertura, o envio interrompido volta à
     * fila; com rede, a conferência (se pendente e há algo na fila); depois o
     * envio, em FIFO.
     */
    private async rodada({ abertura, furarBackoff: furar }: Pedido) {
        let furarBackoff = furar;
        if (abertura) await this.portas.retomarInterrompidas();
        if (this.estado.pedeLogin || this.estado.semRede) return;

        let fila = await this.portas.naFila();
        if (fila.length === 0) {
            this.conferenciaPendente = false;
            return;
        }

        if (this.conferenciaPendente) {
            this.mudar({ fase: "conferindo", enviadas: 0, total: fila.length });
            const conferida = await this.conferir(fila);
            if (!conferida) return;
            fila = await this.portas.naFila();
        }

        this.mudar({ fase: "enviando", enviadas: 0, total: fila.length });
        for (const avaliacao of fila) {
            if (!this.ativo) return;
            const espera = avaliacao.proximaTentativaEm?.getTime();
            if (!furarBackoff && espera && espera > this.relogio.agora()) {
                // A cabeça ainda espera: a fila inteira espera com ela.
                this.agendarBackoff(espera - this.relogio.agora());
                return;
            }
            const seguir = await this.enviarUma(avaliacao);
            if (!seguir) return;
            // Uma a uma: depois da cabeça, as demais não esperam o backoff.
            furarBackoff = true;
        }
    }

    /**
     * Cada `na_fila` cuja inscrição o servidor já tem deste avaliador vira
     * sincronizada: o envio interrompido que chegou, ou o enviado de outro
     * aparelho. `false` quando a conferência falhou e a rodada para.
     */
    private async conferir(fila: AvaliacaoLocal[]) {
        const consulta = await this.portas.minhasAvaliacoes();
        if (!consulta.ok) {
            this.falhaSemItem(classificar(consulta.resposta));
            return false;
        }

        const porInscricao = new Map(
            consulta.dados.map((avaliacao) => [
                avaliacao.inscricaoId,
                avaliacao,
            ]),
        );
        for (const avaliacao of fila) {
            const noServidor = porInscricao.get(avaliacao.inscricaoId);
            if (noServidor)
                await this.portas.marcarSincronizada(avaliacao.id, {
                    servidorId: noServidor.id,
                    nota: noServidor.nota,
                });
        }
        this.conferenciaPendente = false;
        return true;
    }

    /** Envia uma; `false` quando a fila tem de parar nesta rodada. */
    private async enviarUma(avaliacao: AvaliacaoLocal) {
        // O avaliador a tirou da fila depois da leitura: segue para a próxima.
        if (!(await this.portas.marcarEnviando(avaliacao.id))) return true;

        let classe = classificar(await this.portas.enviar(avaliacao));
        if (classe.tipo === "conflito")
            classe = await this.resolverConflito(avaliacao, classe.mensagem);

        switch (classe.tipo) {
            case "aceita":
                await this.portas.marcarSincronizada(avaliacao.id, {
                    servidorId: classe.servidorId,
                    nota: classe.nota,
                });
                this.mudar({ enviadas: this.estado.enviadas + 1 });
                return true;
            case "recusada":
                await this.portas.marcarComErro(avaliacao.id, classe.erro);
                return true;
            case "nao_autenticado":
                await this.portas.devolverAFila(avaliacao.id);
                this.pedirLogin();
                return false;
            case "temporaria": {
                const tentativas = avaliacao.tentativas + 1;
                const espera = esperaDoBackoff(tentativas, classe.retryAfter);
                await this.portas.devolverAFila(avaliacao.id, {
                    tentativas,
                    proximaTentativaEm: new Date(this.relogio.agora() + espera),
                });
                this.agendarBackoff(espera);
                return false;
            }
        }
    }

    /**
     * O 409 (TE-68): se a inscrição já tem uma avaliação deste avaliador, o
     * envio tinha chegado — a resposta é que se perdeu. Senão, é recusa, com
     * a mensagem do servidor.
     */
    private async resolverConflito(
        avaliacao: AvaliacaoLocal,
        mensagem: string,
    ): Promise<Exclude<Classe, { tipo: "conflito" }>> {
        const consulta = await this.portas.avaliacoesDaInscricao(avaliacao);
        if (!consulta.ok) {
            const classe = classificar(consulta.resposta);
            // A consulta não decide nada sozinha: só pede login ou repete.
            if (classe.tipo === "nao_autenticado") return classe;
            return { tipo: "temporaria", retryAfter: null };
        }

        const minha = consulta.dados.find(
            (outra) => outra.avaliadorId === this.portas.avaliadorId,
        );
        if (minha)
            return { tipo: "aceita", servidorId: minha.id, nota: minha.nota };
        return { tipo: "recusada", erro: { status: 409, mensagem } };
    }

    /** Uma falha fora do envio de um item: a conferência. */
    private falhaSemItem(classe: Classe) {
        if (classe.tipo === "nao_autenticado") {
            this.pedirLogin();
            return;
        }
        this.agendarBackoff(
            esperaDoBackoff(
                1,
                classe.tipo === "temporaria" ? classe.retryAfter : null,
            ),
        );
    }

    private pedirLogin() {
        if (this.estado.pedeLogin) return;
        this.pausar();
        this.mudar({ pedeLogin: true });
        this.aoPedirLogin();
    }

    private agendarBackoff(ms: number) {
        this.cancelarBackoff?.();
        this.cancelarBackoff = this.relogio.agendar(ms, () => {
            this.cancelarBackoff = null;
            void this.disparar("backoff");
        });
    }

    private mudar(parcial: Partial<EstadoMotor>) {
        const proximo = { ...this.estado, ...parcial };
        if (
            (Object.keys(parcial) as (keyof EstadoMotor)[]).every(
                (chave) => proximo[chave] === this.estado[chave],
            )
        )
            return;
        this.estado = proximo;
        for (const ouvinte of this.ouvintes) ouvinte();
    }
}
