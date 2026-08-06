import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { entidadeRouter } from "./entidade";
import { eventoRouter } from "./evento";

export const appRouter = createTRPCRouter({
    auth: authRouter,
    evento: eventoRouter,
    entidade: entidadeRouter,
});

export type AppRouter = typeof appRouter;
