import type { TRPCRouterRecord } from "@trpc/server";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
    getSession: publicProcedure.query(({ ctx }) => {
        return ctx.session;
    }),
    getSecretMessage: authenticatedProcedure.query(() => {
        return "you can see this secret message!";
    }),
} satisfies TRPCRouterRecord;
