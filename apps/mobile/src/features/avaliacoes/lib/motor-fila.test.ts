/* eslint-disable @typescript-eslint/require-await -- as portas falsas são
 * assíncronas só para cumprir a interface. */
import { describe, expect, it, vi } from "vitest";

import type {
    AvaliacaoNoServidor,
    Consulta,
    PortasFila,
    Resposta,
} from "./motor-fila";
import type { AvaliacaoLocal, EstadoAvaliacao } from "~/db/schema";
import {
    classificar,
    ESPERA_INICIAL_MS,
    ESPERA_MAXIMA_MS,
    esperaDoBackoff,
    MotorFila,
} from "./motor-fila";

const AVALIADOR = 7;
const INICIO = new Date("2026-10-24T14:00:00Z").getTime();

function avaliacao(
    id: string,
    inscricaoId: number,
    estado: EstadoAvaliacao = "na_fila",
    extra: Partial<AvaliacaoLocal> = {},
): AvaliacaoLocal {
    return {
        id,
        avaliadorId: String(AVALIADOR),
        eventoId: 1,
        modalidadeId: 2,
        categoriaId: 3,
        inscricaoId,
        estado,
        motivoCongelado: null,
        payload: {
            modeloFichaAvaliativaId: 11,
            respostasGerais: [],
            agrupamentos: [],
        },
        modelo: {} as AvaliacaoLocal["modelo"],
        inscricao: {} as AvaliacaoLocal["inscricao"],
        criadoEm: new Date(INICIO),
        atualizadoEm: new Date(INICIO),
        enfileiradoEm: new Date(INICIO + inscricaoId),
        tentativas: 0,
        proximaTentativaEm: null,
        erro: null,
        servidorId: null,
        nota: null,
        enviadoEm: null,
        ...extra,
    };
}

const aceita = (id: number, nota = "8.7500"): Resposta => ({
    status: 201,
    corpo: {
        id,
        inscricaoId: 1,
        avaliadorId: AVALIADOR,
        modeloFichaAvaliativaId: 11,
        dataEnvio: "2026-10-24T14:32:10.123456-03:00",
        nota,
        respostasGerais: [],
        agrupamentos: [],
    },
});

const ok = <T>(dados: T): Consulta<T> => ({ ok: true, dados });

/**
 * O banco e a rede em memória. `respostas` diz o que o `POST` de cada
 * inscrição responde, na ordem das tentativas.
 */
function montar(
    linhas: AvaliacaoLocal[],
    opcoes: {
        respostas?: Record<number, Resposta[]>;
        minhas?: () => Consulta<AvaliacaoNoServidor[]>;
        daInscricao?: () => Consulta<AvaliacaoNoServidor[]>;
    } = {},
) {
    const banco = new Map(linhas.map((linha) => [linha.id, { ...linha }]));
    let agora = INICIO;
    const agendados: { em: number; fn: () => void }[] = [];
    const enviadas: number[] = [];

    function mover(
        id: string,
        de: EstadoAvaliacao[],
        mudanca: Partial<AvaliacaoLocal>,
    ) {
        const linha = banco.get(id);
        if (!linha || !de.includes(linha.estado)) return false;
        banco.set(id, { ...linha, ...mudanca });
        return true;
    }

    const portas: PortasFila = {
        avaliadorId: AVALIADOR,
        retomarInterrompidas: vi.fn(async () => {
            for (const linha of banco.values())
                if (linha.estado === "enviando") linha.estado = "na_fila";
        }),
        naFila: async () =>
            [...banco.values()]
                .filter((linha) => linha.estado === "na_fila")
                .sort(
                    (a, b) =>
                        (a.enfileiradoEm?.getTime() ?? 0) -
                        (b.enfileiradoEm?.getTime() ?? 0),
                )
                .map((linha) => ({ ...linha })),
        marcarEnviando: async (id) =>
            mover(id, ["na_fila"], { estado: "enviando" }),
        marcarSincronizada: async (id, servidor) => {
            mover(id, ["na_fila", "enviando"], {
                estado: "sincronizada",
                ...servidor,
            });
        },
        marcarComErro: async (id, erro) => {
            mover(id, ["enviando"], { estado: "com_erro", erro });
        },
        devolverAFila: async (id, falha) => {
            mover(id, ["enviando"], { estado: "na_fila", ...falha });
        },
        enviar: vi.fn(async (linha: AvaliacaoLocal) => {
            enviadas.push(linha.inscricaoId);
            const fila = opcoes.respostas?.[linha.inscricaoId];
            return fila?.shift() ?? aceita(100 + linha.inscricaoId);
        }),
        minhasAvaliacoes: vi.fn(async () => opcoes.minhas?.() ?? ok([])),
        avaliacoesDaInscricao: vi.fn(
            async () => opcoes.daInscricao?.() ?? ok([]),
        ),
    };

    const relogio = {
        agora: () => agora,
        agendar(ms: number, fn: () => void) {
            const item = { em: agora + ms, fn };
            agendados.push(item);
            return () => {
                agendados.splice(agendados.indexOf(item), 1);
            };
        },
    };

    const aoPedirLogin = vi.fn();
    const motor = new MotorFila(portas, relogio, aoPedirLogin);

    return {
        motor,
        portas,
        aoPedirLogin,
        enviadas,
        agendados,
        linha: (id: string) => banco.get(id),
        /** Passa o tempo e roda o que venceu. */
        async avancar(ms: number) {
            agora += ms;
            for (const item of agendados.filter((a) => a.em <= agora)) {
                agendados.splice(agendados.indexOf(item), 1);
                item.fn();
            }
            // As portas falsas só resolvem promessas: uma macrotarefa roda
            // depois de a rodada inteira terminar.
            await new Promise((resolver) => setTimeout(resolver, 0));
        },
    };
}

describe("classificar", () => {
    it("201 é aceita, com o id e a nota do servidor", () => {
        expect(classificar(aceita(55))).toEqual({
            tipo: "aceita",
            servidorId: 55,
            nota: "8.7500",
        });
    });

    it.each([401, 403])("%i pede login", (status) => {
        expect(classificar({ status })).toEqual({ tipo: "nao_autenticado" });
    });

    it.each([null, 408, 500, 502, 503])("%s é temporária", (status) => {
        expect(classificar({ status }).tipo).toBe("temporaria");
    });

    it("429 é temporária e leva o Retry-After", () => {
        expect(classificar({ status: 429, retryAfter: 120 })).toEqual({
            tipo: "temporaria",
            retryAfter: 120,
        });
    });

    it("400 é recusa com os erros localizados", () => {
        const erros = [
            {
                local: "agrupamentos",
                agrupamentoId: 4,
                ordem: 2,
                campoFichaId: 21,
                mensagem: "Campo obrigatório sem resposta.",
            },
            {
                local: "respostasGerais",
                campoFichaId: 10,
                indiceResposta: 0,
                mensagem: "valor_numerico excede valor_maximo do campo.",
            },
        ];
        expect(classificar({ status: 400, corpo: { erros } })).toEqual({
            tipo: "recusada",
            erro: {
                status: 400,
                mensagem: "Campo obrigatório sem resposta. (e mais 1)",
                erros,
            },
        });
    });

    it("404 é recusa", () => {
        expect(classificar({ status: 404 })).toMatchObject({
            tipo: "recusada",
            erro: { status: 404 },
        });
    });

    it("409 vai à consulta, com o detail", () => {
        expect(
            classificar({
                status: 409,
                corpo: { detail: "Categoria encerrada." },
            }),
        ).toEqual({ tipo: "conflito", mensagem: "Categoria encerrada." });
    });

    it("2xx sem o corpo esperado é temporária: o reenvio cai no 409", () => {
        expect(classificar({ status: 201, corpo: {} }).tipo).toBe("temporaria");
    });
});

describe("esperaDoBackoff", () => {
    it("dobra a cada tentativa até o teto", () => {
        expect(esperaDoBackoff(1, null)).toBe(ESPERA_INICIAL_MS);
        expect(esperaDoBackoff(2, null)).toBe(ESPERA_INICIAL_MS * 2);
        expect(esperaDoBackoff(30, null)).toBe(ESPERA_MAXIMA_MS);
    });

    it("respeita um Retry-After maior", () => {
        expect(esperaDoBackoff(1, 300)).toBe(300_000);
    });
});

describe("MotorFila", () => {
    it("envia em FIFO e marca cada uma sincronizada com a nota do servidor", async () => {
        const t = montar([avaliacao("b", 2), avaliacao("a", 1)]);
        await t.motor.disparar("salvou");

        expect(t.enviadas).toEqual([1, 2]);
        expect(t.linha("a")).toMatchObject({
            estado: "sincronizada",
            servidorId: 101,
            nota: "8.7500",
        });
        expect(t.linha("b")?.estado).toBe("sincronizada");
    });

    it("400 e 404 vão para com erro e não travam a fila", async () => {
        const t = montar(
            [avaliacao("a", 1), avaliacao("b", 2), avaliacao("c", 3)],
            {
                respostas: {
                    1: [
                        {
                            status: 400,
                            corpo: {
                                erros: [
                                    {
                                        local: "payload",
                                        mensagem: "Chave desconhecida.",
                                    },
                                ],
                            },
                        },
                    ],
                    2: [{ status: 404 }],
                },
            },
        );
        await t.motor.disparar("salvou");

        expect(t.linha("a")).toMatchObject({
            estado: "com_erro",
            erro: { status: 400, mensagem: "Chave desconhecida." },
        });
        expect(t.linha("a")?.erro?.erros).toHaveLength(1);
        expect(t.linha("b")).toMatchObject({
            estado: "com_erro",
            erro: { status: 404 },
        });
        expect(t.linha("c")?.estado).toBe("sincronizada");
    });

    it("409 com avaliação do avaliador na inscrição vira sincronizada", async () => {
        const t = montar([avaliacao("a", 1)], {
            respostas: {
                1: [{ status: 409, corpo: { detail: "Já avaliou." } }],
            },
            daInscricao: () =>
                ok([
                    { id: 9, inscricaoId: 1, avaliadorId: 3, nota: "5.0000" },
                    {
                        id: 55,
                        inscricaoId: 1,
                        avaliadorId: AVALIADOR,
                        nota: "8.2500",
                    },
                ]),
        });
        await t.motor.disparar("salvou");

        expect(t.linha("a")).toMatchObject({
            estado: "sincronizada",
            servidorId: 55,
            nota: "8.2500",
        });
    });

    it("409 sem avaliação do avaliador vai para com erro com o detail", async () => {
        const t = montar([avaliacao("a", 1)], {
            respostas: {
                1: [
                    {
                        status: 409,
                        corpo: {
                            detail: "A categoria não está pronta_avaliacao.",
                        },
                    },
                ],
            },
            daInscricao: () =>
                ok([{ id: 9, inscricaoId: 1, avaliadorId: 3, nota: "5.0000" }]),
        });
        await t.motor.disparar("salvou");

        expect(t.linha("a")).toMatchObject({
            estado: "com_erro",
            erro: {
                status: 409,
                mensagem: "A categoria não está pronta_avaliacao.",
            },
        });
    });

    it("409 com a consulta fora do ar é temporária", async () => {
        const t = montar([avaliacao("a", 1)], {
            respostas: { 1: [{ status: 409, corpo: { detail: "x" } }] },
            daInscricao: () => ({ ok: false, resposta: { status: null } }),
        });
        await t.motor.disparar("salvou");

        expect(t.linha("a")).toMatchObject({
            estado: "na_fila",
            tentativas: 1,
        });
    });

    it.each([401, 403])(
        "%i devolve à fila sem contar tentativa, pausa tudo e pede login",
        async (status) => {
            const t = montar([avaliacao("a", 1), avaliacao("b", 2)], {
                respostas: { 1: [{ status }] },
            });
            await t.motor.disparar("salvou");

            expect(t.linha("a")).toMatchObject({
                estado: "na_fila",
                tentativas: 0,
            });
            expect(t.enviadas).toEqual([1]);
            expect(t.motor.lerEstado().pedeLogin).toBe(true);
            expect(t.aoPedirLogin).toHaveBeenCalledOnce();

            await t.motor.disparar("conexao");
            await t.motor.disparar("abertura");
            expect(t.enviadas).toEqual([1]);
        },
    );

    it("falha temporária deixa a cabeça na fila, para a rodada e tenta de novo no backoff", async () => {
        const t = montar([avaliacao("a", 1), avaliacao("b", 2)], {
            respostas: { 1: [{ status: 503 }] },
        });
        await t.motor.disparar("salvou");

        expect(t.enviadas).toEqual([1]);
        expect(t.linha("a")).toMatchObject({
            estado: "na_fila",
            tentativas: 1,
            proximaTentativaEm: new Date(INICIO + ESPERA_INICIAL_MS),
        });
        expect(t.linha("b")?.estado).toBe("na_fila");

        await t.avancar(ESPERA_INICIAL_MS);
        expect(t.enviadas).toEqual([1, 1, 2]);
        expect(t.linha("a")?.estado).toBe("sincronizada");
        expect(t.linha("b")?.estado).toBe("sincronizada");
    });

    it("salvar durante o backoff não fura a espera; voltar para a frente fura", async () => {
        const t = montar([
            avaliacao("a", 1, "na_fila", {
                tentativas: 2,
                proximaTentativaEm: new Date(INICIO + 60_000),
            }),
        ]);
        await t.motor.disparar("salvou");
        expect(t.enviadas).toEqual([]);

        await t.motor.disparar("abertura");
        expect(t.enviadas).toEqual([1]);
    });

    it("parado em segundo plano, o backoff não corre", async () => {
        const t = montar([avaliacao("a", 1)], {
            respostas: { 1: [{ status: null }] },
        });
        await t.motor.disparar("salvou");
        expect(t.agendados).toHaveLength(1);

        t.motor.pausar();
        expect(t.agendados).toHaveLength(0);
    });

    describe("abertura", () => {
        it("o envio interrompido volta para na_fila e é reenviado", async () => {
            const t = montar([avaliacao("a", 1, "enviando")]);
            await t.motor.disparar("abertura");

            expect(t.portas.retomarInterrompidas).toHaveBeenCalledOnce();
            expect(t.enviadas).toEqual([1]);
            expect(t.linha("a")?.estado).toBe("sincronizada");
        });

        it("o envio interrompido que já chegou vira sincronizada sem reenvio", async () => {
            const t = montar(
                [avaliacao("a", 1, "enviando"), avaliacao("b", 2)],
                {
                    minhas: () =>
                        ok([
                            {
                                id: 55,
                                inscricaoId: 1,
                                avaliadorId: AVALIADOR,
                                nota: "9.0000",
                            },
                        ]),
                },
            );
            await t.motor.disparar("abertura");

            expect(t.linha("a")).toMatchObject({
                estado: "sincronizada",
                servidorId: 55,
                nota: "9.0000",
            });
            expect(t.enviadas).toEqual([2]);
        });

        it("sem nada na fila, não confere", async () => {
            const t = montar([avaliacao("a", 1, "com_erro")]);
            await t.motor.disparar("abertura");
            expect(t.portas.minhasAvaliacoes).not.toHaveBeenCalled();
        });

        it("a conferência só roda na abertura, não a cada salvar", async () => {
            const t = montar([avaliacao("a", 1)]);
            await t.motor.disparar("salvou");
            expect(t.portas.minhasAvaliacoes).not.toHaveBeenCalled();
        });

        it("falha temporária na conferência não envia nesta rodada e mantém a flag", async () => {
            let fora = true;
            const t = montar([avaliacao("a", 1)], {
                minhas: () =>
                    fora ? { ok: false, resposta: { status: 502 } } : ok([]),
            });
            await t.motor.disparar("abertura");
            expect(t.enviadas).toEqual([]);

            fora = false;
            await t.avancar(ESPERA_INICIAL_MS);
            expect(t.portas.minhasAvaliacoes).toHaveBeenCalledTimes(2);
            expect(t.enviadas).toEqual([1]);
        });

        it("401 na conferência pede login", async () => {
            const t = montar([avaliacao("a", 1)], {
                minhas: () => ({ ok: false, resposta: { status: 401 } }),
            });
            await t.motor.disparar("abertura");
            expect(t.aoPedirLogin).toHaveBeenCalledOnce();
            expect(t.enviadas).toEqual([]);
        });

        it("aberto sem rede, confere antes do primeiro envio quando a conexão volta", async () => {
            const t = montar([avaliacao("a", 1), avaliacao("b", 2)], {
                minhas: () =>
                    ok([
                        {
                            id: 55,
                            inscricaoId: 1,
                            avaliadorId: AVALIADOR,
                            nota: "9.0000",
                        },
                    ]),
            });
            t.motor.conexao(false);
            await t.motor.disparar("abertura");
            expect(t.portas.retomarInterrompidas).toHaveBeenCalledOnce();
            expect(t.portas.minhasAvaliacoes).not.toHaveBeenCalled();
            expect(t.motor.lerEstado().semRede).toBe(true);

            t.motor.conexao(true);
            await vi.waitFor(() =>
                expect(t.linha("b")?.estado).toBe("sincronizada"),
            );
            expect(t.portas.minhasAvaliacoes).toHaveBeenCalledOnce();
            expect(t.enviadas).toEqual([2]);
        });
    });

    it("uma rodada por vez: o gatilho no meio só agenda outra ao fim", async () => {
        let liberar = () => undefined as void;
        const t = montar([avaliacao("a", 1)]);
        const enviarOriginal = t.portas.enviar;
        let emCurso = 0;
        let maximo = 0;
        t.portas.enviar = async (linha) => {
            emCurso++;
            maximo = Math.max(maximo, emCurso);
            await new Promise<void>((resolver) => (liberar = resolver));
            emCurso--;
            return enviarOriginal(linha);
        };

        const primeira = t.motor.disparar("salvou");
        await vi.waitFor(() => expect(emCurso).toBe(1));
        // Voltar para a frente no meio do envio não pode devolver a linha
        // em curso para a fila.
        void t.motor.disparar("abertura");
        expect(t.portas.retomarInterrompidas).not.toHaveBeenCalled();
        liberar();
        await primeira;

        expect(maximo).toBe(1);
        expect(t.portas.retomarInterrompidas).toHaveBeenCalledOnce();
        expect(t.linha("a")?.estado).toBe("sincronizada");
    });

    it("a avaliação que saiu da fila depois da leitura não é enviada", async () => {
        const t = montar([avaliacao("a", 1), avaliacao("b", 2)]);
        const marcar = t.portas.marcarEnviando;
        t.portas.marcarEnviando = async (id) =>
            id === "a" ? false : marcar(id);
        await t.motor.disparar("salvou");

        expect(t.enviadas).toEqual([2]);
    });

    it("conta as aceitas da rodada para a dock", async () => {
        const t = montar([avaliacao("a", 1), avaliacao("b", 2)]);
        const fases: string[] = [];
        t.motor.inscrever(() => {
            const { fase, enviadas, total } = t.motor.lerEstado();
            fases.push(`${fase} ${enviadas}/${total}`);
        });
        await t.motor.disparar("salvou");

        expect(fases).toEqual([
            "enviando 0/2",
            "enviando 1/2",
            "enviando 2/2",
            "parado 0/0",
        ]);
    });
});
