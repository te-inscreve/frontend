import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Evento } from "@te-inscreve/schemas";

import { getQueryClient, trpc } from "~/shared/api/trpc/server";
import { formatDateRange } from "~/shared/utils/format-date";
import { parseInteger } from "~/shared/utils/parsers";

/** Prévias de link cortam bem antes disso; o resto só pesa no HTML. */
const LIMITE_DESCRICAO = 200;

function resumir(texto: string) {
    const limpo = texto.replace(/\s+/g, " ").trim();
    if (limpo.length <= LIMITE_DESCRICAO) return limpo;

    return `${limpo.slice(0, LIMITE_DESCRICAO - 1).trimEnd()}…`;
}

/**
 * A prévia de um evento ao compartilhar o link: o cartaz como imagem e período
 * e local na frente da descrição, que é o que decide se alguém abre.
 *
 * O logo só entra sem cartaz — é quadrado e pequeno, então a prévia vira o
 * cartão compacto em vez do grande.
 */
export function metadataDoEvento(evento: Evento, caminho: string): Metadata {
    const periodo = formatDateRange(
        new Date(evento.dataInicio),
        new Date(evento.dataFim),
    );
    const descricao = resumir(
        [`${periodo} · ${evento.local}`, evento.descricao]
            .filter(Boolean)
            .join(" — "),
    );
    // A API manda `""` quando não há imagem, então vazio conta como ausente.
    const imagem =
        [evento.cartaz, evento.logo].find(Boolean) ?? "/assets/gauchinho.png";

    return {
        title: `${evento.nome} | Te Inscreve`,
        description: descricao,
        alternates: { canonical: caminho },
        openGraph: {
            type: "website",
            locale: "pt_BR",
            siteName: "Te Inscreve",
            url: caminho,
            title: evento.nome,
            description: descricao,
            images: [{ url: imagem, alt: `Cartaz de ${evento.nome}` }],
        },
        twitter: {
            card: evento.cartaz ? "summary_large_image" : "summary",
            title: evento.nome,
            description: descricao,
            images: [imagem],
        },
    };
}

/**
 * O `generateMetadata` das telas de evento, pelo segmento da rota. A busca é a
 * mesma do `prefetch` da página — o query client é `cache`ado por request.
 *
 * O canônico aponta sempre para a página pública: é ela que se compartilha,
 * mesmo quando o link copiado foi o da administração.
 */
export async function metadataDoEventoPorSegmento(
    segmento: string,
): Promise<Metadata> {
    const id = parseInteger(segmento);
    if (!id) notFound();

    const evento = await getQueryClient().fetchQuery(
        trpc.evento.getById.queryOptions({ id }),
    );
    // Também aqui, e não só no conteúdo: lá o `notFound` chega depois de o
    // stream começar e a resposta já saiu 200. Robôs esperam o metadata, então
    // daqui o 404 vira status de verdade.
    if (!evento) notFound();

    return metadataDoEvento(evento, `/eventos/${id}`);
}
