import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { entidadeRouter } from "./entidade";
import { eventoRouter } from "./evento";
import { perfilRouter } from "./perfil";

export const appRouter = createTRPCRouter({
    auth: authRouter,
    evento: eventoRouter,
    entidade: entidadeRouter,
    perfil: perfilRouter,
});

export type AppRouter = typeof appRouter;
