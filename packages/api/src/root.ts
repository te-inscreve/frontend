import { authRouter } from "./router/auth";
import { eventoRouter } from "./router/evento";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    auth: authRouter,
    // `evento` is a reference implementation — see src/router/evento.ts for the
    // pattern (ctx.rest + unwrap + Next cache tags). Add your other domain
    // routers alongside it.
    evento: eventoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
