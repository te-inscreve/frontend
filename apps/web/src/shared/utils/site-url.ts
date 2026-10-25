import "server-only";

import { env } from "./env";

/**
 * A origem pública do site. As prévias de link só aceitam URL absoluta, então
 * é daqui que o `metadataBase` do layout raiz completa os caminhos relativos.
 */
export const siteUrl = new URL(
    env.SITE_URL ??
        (env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
            : "http://localhost:3000"),
);
