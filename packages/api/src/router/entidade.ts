import { authenticatedProcedure } from "../trpc";

export const entidadeRouter = {
    getAll: authenticatedProcedure.query(async ({ ctx }) => {
        const result = await ctx.restClient.get(`/entidades`, {
            next: { revalidate: 30, tags: ["entidades"] },
        });
        if (!result.ok) throw result.error;
        return result.data;
    }),
};
