import type {
    AgrupamentoFicha,
    CampoFicha,
    ModeloFichaDetalhe,
    RespostaNota,
    ValorCampo,
    ValoresFicha,
} from "@te-inscreve/schemas";
import {
    calcularNota,
    calcularSubtotal,
    camposDoAgrupamento,
    chaveDaOcorrencia,
    formatarDecimal,
    itensDoTopo,
    tetoDoCampo,
} from "@te-inscreve/schemas";

/*
 * O que a ficha do app monta sobre o builder de `packages/schemas`
 * (`montarFormularioFicha`, `itensDoTopo`): trechos, abas, resumo e prévia da
 * nota. As chaves dos valores seguem a forma do estado ainda em aberto em
 * TE-98.
 */

/**
 * A nota digitada, com o ponto trocado pela vírgula decimal e presa ao teto:
 * quem passa do máximo fica no máximo ("12" vira "10" num campo até 10). O
 * resto — casas demais, texto que não é número — fica para a validação.
 */
export function notaDigitada(campo: CampoFicha, digitado: string) {
    const texto = digitado.replaceAll(".", ",");
    const teto = tetoDoCampo(campo);
    if (teto !== null && Number(texto.replace(",", ".")) > teto)
        return formatarDecimal(teto);
    return texto;
}

/**
 * O que abre na folha de edição ao tocar na ficha: um campo geral sozinho, ou
 * uma ocorrência de agrupamento com todos os campos dela. Campos gerais não
 * se agrupam: o modelo não diz quais andam juntos, então cada um abre só.
 */
export interface TrechoFicha {
    chave: string;
    titulo: string;
    subtitulo?: string;
    campos: { chave: string; campo: CampoFicha }[];
    /** Só nos trechos de ocorrência: de qual agrupamento, e qual repetição. */
    ocorrencia?: { agrupamento: AgrupamentoFicha; ordem: number };
}

/** Os trechos na ordem do topo da ficha, a ordem de "Anterior"/"Próximo". */
export function trechosDaFicha(modelo: ModeloFichaDetalhe): TrechoFicha[] {
    return itensDoTopo(modelo).map((item) =>
        item.tipo === "geral"
            ? {
                  chave: item.chave,
                  titulo: "Campos gerais",
                  campos: [{ chave: item.chave, campo: item.posicao.campo }],
              }
            : {
                  chave: item.chave,
                  titulo: `${item.agrupamento.nome} ${item.ordem}`,
                  subtitulo: `Ocorrência ${item.ordem} de ${item.agrupamento.quantidade}`,
                  ocorrencia: {
                      agrupamento: item.agrupamento,
                      ordem: item.ordem,
                  },
                  campos: camposDoAgrupamento(item.agrupamento).map(
                      (posicao) => ({
                          chave: chaveDaOcorrencia(
                              item.agrupamento,
                              item.ordem,
                              posicao,
                          ),
                          campo: posicao.campo,
                      }),
                  ),
              },
    );
}

/** A resposta como texto curto, para a revisão. */
export function resumoDoValor(campo: CampoFicha, valor: ValorCampo) {
    const nomeDa = (id: number) =>
        campo.alternativas?.find((alternativa) => alternativa.id === id)?.nome;
    const ordemDa = (id: number) =>
        campo.alternativas?.find((alternativa) => alternativa.id === id)
            ?.ordem ?? 0;

    // Na ordem do modelo, não na ordem em que o avaliador tocou.
    if (Array.isArray(valor))
        return valor.length
            ? [...valor]
                  .sort((a, b) => ordemDa(a) - ordemDa(b))
                  .map(nomeDa)
                  .join(", ")
            : null;
    if (typeof valor === "number") return nomeDa(valor) ?? null;
    // Texto só com espaços também é "sem resposta".
    const texto = valor?.trim();
    if (!texto) return null;
    return texto;
}

/** A aba de um trecho: a dos campos gerais ou a do agrupamento dele. */
export function abaDoTrecho(trecho: TrechoFicha) {
    return trecho.ocorrencia
        ? `agrupamento-${trecho.ocorrencia.agrupamento.id}`
        : "gerais";
}

/** Uma aba da ficha, com o índice do trecho que cada linha abre. */
export type AbaDaFicha =
    | {
          chave: string;
          tipo: "campos";
          titulo: string;
          /** Uma linha por campo geral, cada um o seu trecho. */
          linhas: { trecho: number; chave: string; campo: CampoFicha }[];
      }
    | {
          chave: string;
          tipo: "agrupamento";
          titulo: string;
          agrupamento: AgrupamentoFicha;
          /** Uma linha por ocorrência, cada uma o seu trecho. */
          linhas: {
              trecho: number;
              ordem: number;
              campos: TrechoFicha["campos"];
          }[];
      };

/**
 * As abas da ficha: uma com todos os campos gerais, primeiro, e uma por
 * agrupamento, na ordem em que aparecem no modelo. Os campos gerais vêm
 * misturados aos agrupamentos na ordem do topo; numa aba só, ficam juntos.
 */
export function abasDaFicha(trechos: TrechoFicha[]): AbaDaFicha[] {
    const gerais: Extract<AbaDaFicha, { tipo: "campos" }> = {
        chave: "gerais",
        tipo: "campos",
        titulo: "Campos gerais",
        linhas: [],
    };
    const agrupamentos = new Map<
        number,
        Extract<AbaDaFicha, { tipo: "agrupamento" }>
    >();

    trechos.forEach((trecho, indice) => {
        if (!trecho.ocorrencia) {
            gerais.linhas.push(
                ...trecho.campos.map(({ chave, campo }) => ({
                    trecho: indice,
                    chave,
                    campo,
                })),
            );
            return;
        }

        const { agrupamento, ordem } = trecho.ocorrencia;
        const aba = agrupamentos.get(agrupamento.id) ?? {
            chave: abaDoTrecho(trecho),
            tipo: "agrupamento" as const,
            titulo: agrupamento.nome,
            agrupamento,
            linhas: [],
        };
        aba.linhas.push({ trecho: indice, ordem, campos: trecho.campos });
        agrupamentos.set(agrupamento.id, aba);
    });

    // Dois agrupamentos com o mesmo nome dariam duas abas iguais: levam o
    // número da vez, entre parênteses para não confundir com a ocorrência.
    const doAgrupamento = [...agrupamentos.values()];
    const repeticoes = new Map<string, number>();
    doAgrupamento.forEach(({ titulo }) =>
        repeticoes.set(titulo, (repeticoes.get(titulo) ?? 0) + 1),
    );
    const vistos = new Map<string, number>();
    doAgrupamento.forEach((aba) => {
        if ((repeticoes.get(aba.titulo) ?? 0) < 2) return;
        const vez = (vistos.get(aba.titulo) ?? 0) + 1;
        vistos.set(aba.titulo, vez);
        aba.titulo = `${aba.titulo} (${vez})`;
    });

    return [...(gerais.linhas.length ? [gerais] : []), ...doAgrupamento];
}

/** As respostas numéricas de uns campos, na forma que a nota recebe. */
function respostasDaNota(
    campos: TrechoFicha["campos"],
    valores: ValoresFicha,
): RespostaNota[] {
    return campos.flatMap(({ chave, campo }) => {
        const valor = valores[chave];
        if (!campo.modificadorNota || typeof valor !== "string") return [];
        return [{ modificador: campo.modificadorNota, valor }];
    });
}

/**
 * A nota da ficha preenchida até aqui, pela fórmula do backend (TE-95): cada
 * trecho de ocorrência é uma unidade, os campos gerais entram depois da
 * média. É prévia — campo vazio ou inválido fica de fora — e quem vale é a
 * nota que o servidor grava.
 */
export function notaDaFicha(trechos: TrechoFicha[], valores: ValoresFicha) {
    return Number(
        calcularNota({
            gerais: respostasDaNota(
                trechos
                    .filter((trecho) => !trecho.ocorrencia)
                    .flatMap((trecho) => trecho.campos),
                valores,
            ),
            unidades: trechos
                .filter((trecho) => trecho.ocorrencia)
                .map((trecho) => respostasDaNota(trecho.campos, valores)),
        }),
    );
}

/**
 * O total de uma ocorrência — soma menos desconto, sem teto —, ou nulo
 * enquanto nenhuma nota dela foi escrita.
 */
export function subtotalDaOcorrencia(
    campos: TrechoFicha["campos"],
    valores: ValoresFicha,
) {
    const respostas = respostasDaNota(campos, valores);
    if (!respostas.some(({ valor }) => valor?.trim())) return null;
    return Number(calcularSubtotal(respostas));
}
