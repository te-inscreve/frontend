import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

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

export { type AppRouter, appRouter } from "./root";
export { createTRPCContext, type TRPCContext } from "./trpc";
export { ApiValidationError, toTRPCError } from "./rest-error";
export type { RouterInputs, RouterOutputs };
