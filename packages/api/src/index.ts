import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./router/_app";

/**
 * Inference helpers for input types
 * @example
 * type EventoByIdInput = RouterInputs['evento']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllEventosOutput = RouterOutputs['evento']['all']
 *      ^? Evento[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export * from "./cache-tags";
export { ApiValidationError, toTRPCError } from "./rest-error";
export { appRouter, type AppRouter } from "./router/_app";
export { createTRPCServerContext, type TRPCContext } from "./trpc";
export type { RouterInputs, RouterOutputs };
