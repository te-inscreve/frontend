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
    chaveNome,
    formatarDecimal,
    itensDoTopo,
    nomePadrao,
    tetoDoCampo,
} from "@te-inscreve/schemas";

/*
 * O que a ficha do app monta sobre o builder de `packages/schemas`
 * (`montarFormularioFicha`, `itensDoTopo`): trechos, seções, resumo e prévia da
 * nota. As chaves dos valores são as do builder (TE-98).
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
    /** Na ocorrência, o nome padrão: o que o avaliador escreveu está nos valores. */
    titulo: string;
    subtitulo?: string;
    campos: { chave: string; campo: CampoFicha }[];
    /**
     * Só nos trechos de ocorrência: de qual agrupamento, qual repetição, e a
     * chave do nome dela no formulário.
     */
    ocorrencia?: {
        agrupamento: AgrupamentoFicha;
        ordem: number;
        chaveNome: string;
    };
}

/**
 * Onde a ocorrência está, para o nome que o avaliador deu não apagar a
 * referência: "Danças · ocorrência 2 de 4".
 */
export const posicaoDaOcorrencia = (
    agrupamento: AgrupamentoFicha,
    ordem: number,
) => `${agrupamento.nome} · ocorrência ${ordem} de ${agrupamento.quantidade}`;

/** O nome da ocorrência como está no formulário, ou o padrão. */
export function nomeDaOcorrencia(
    agrupamento: AgrupamentoFicha,
    ordem: number,
    valores: ValoresFicha,
) {
    const nome = valores[chaveNome(agrupamento, ordem)];
    return (
        (typeof nome === "string" && nome.trim()) ||
        nomePadrao(agrupamento, ordem)
    );
}

/** As chaves que o trecho mexe: as dos campos e, na ocorrência, a do nome. */
export function chavesDoTrecho(trecho: TrechoFicha) {
    return [
        ...trecho.campos.map(({ chave }) => chave),
        ...(trecho.ocorrencia ? [trecho.ocorrencia.chaveNome] : []),
    ];
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
                  titulo: nomePadrao(item.agrupamento, item.ordem),
                  subtitulo: posicaoDaOcorrencia(item.agrupamento, item.ordem),
                  ocorrencia: {
                      agrupamento: item.agrupamento,
                      ordem: item.ordem,
                      chaveNome: chaveNome(item.agrupamento, item.ordem),
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

/**
 * Quantos campos da ficha já têm resposta, e de quantos: o progresso que o
 * rodapé do formulário e o card da avaliação atual mostram.
 */
export function progressoDaFicha(
    trechos: TrechoFicha[],
    valores: ValoresFicha,
) {
    const campos = trechos.flatMap((trecho) => trecho.campos);
    const preenchidos = campos.filter(
        ({ chave, campo }) =>
            resumoDoValor(campo, valores[chave] ?? null) !== null,
    ).length;
    return { preenchidos, total: campos.length };
}

/** Uma seção da ficha, com o índice do trecho que cada parte abre. */
export type SecaoDaFicha =
    | {
          chave: string;
          tipo: "campo";
          /** O campo geral, que é o seu próprio trecho. */
          trecho: number;
          campo: CampoFicha;
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
 * As seções da ficha na ordem do topo do modelo: cada campo geral onde ele
 * está, e as ocorrências seguidas de um agrupamento juntas numa seção.
 */
export function secoesDaFicha(trechos: TrechoFicha[]): SecaoDaFicha[] {
    const secoes: SecaoDaFicha[] = [];

    trechos.forEach((trecho, indice) => {
        if (!trecho.ocorrencia) {
            secoes.push(
                ...trecho.campos.map(({ chave, campo }) => ({
                    chave,
                    tipo: "campo" as const,
                    trecho: indice,
                    campo,
                })),
            );
            return;
        }

        const { agrupamento, ordem } = trecho.ocorrencia;
        const ultima = secoes.at(-1);
        const secao =
            ultima?.tipo === "agrupamento" &&
            ultima.agrupamento.id === agrupamento.id
                ? ultima
                : null;
        const linha = { trecho: indice, ordem, campos: trecho.campos };
        if (secao) {
            secao.linhas.push(linha);
            return;
        }
        secoes.push({
            chave: `agrupamento-${agrupamento.id}`,
            tipo: "agrupamento",
            titulo: agrupamento.nome,
            agrupamento,
            linhas: [linha],
        });
    });

    // Dois agrupamentos com o mesmo nome dariam dois títulos iguais: levam o
    // número da vez, entre parênteses para não confundir com a ocorrência.
    const doAgrupamento = secoes.filter(
        (secao): secao is Extract<SecaoDaFicha, { tipo: "agrupamento" }> =>
            secao.tipo === "agrupamento",
    );
    const repeticoes = new Map<string, number>();
    doAgrupamento.forEach(({ titulo }) =>
        repeticoes.set(titulo, (repeticoes.get(titulo) ?? 0) + 1),
    );
    const vistos = new Map<string, number>();
    doAgrupamento.forEach((secao) => {
        if ((repeticoes.get(secao.titulo) ?? 0) < 2) return;
        const vez = (vistos.get(secao.titulo) ?? 0) + 1;
        vistos.set(secao.titulo, vez);
        secao.titulo = `${secao.titulo} (${vez})`;
    });

    return secoes;
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
