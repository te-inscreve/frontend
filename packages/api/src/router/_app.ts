import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { categoriaRouter } from "./categoria";
import { entidadeRouter } from "./entidade";
import { eventoRouter } from "./evento";
import { grupoRouter } from "./grupo";
import { integranteRouter } from "./integrante";
import { modalidadeRouter } from "./modalidade";
import { perfilRouter } from "./perfil";

export const appRouter = createTRPCRouter({
    auth: authRouter,
    evento: eventoRouter,
    modalidade: modalidadeRouter,
    categoria: categoriaRouter,
    entidade: entidadeRouter,
    perfil: perfilRouter,
    integrante: integranteRouter,
    grupo: grupoRouter,
});

export type AppRouter = typeof appRouter;
