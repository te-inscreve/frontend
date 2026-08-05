export { HttpClient, type HttpClientOptions } from "./http-client";

export {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    HttpError,
    httpErrorFor,
    NetworkError,
    NotAcceptableError,
    NotFoundError,
    ParseError,
    RestError,
    ServerError,
    TooManyRequestsError,
    UnauthorizedError,
    UnprocessableEntityError,
    type AnyRestError,
    type HttpErrorOpts,
} from "./errors";

export {
    isHttpError,
    isNetworkError,
    isParseError,
    isRestError,
    matchHttpError,
    type HttpErrorHandlers,
} from "./error-handling";

export type { Client, Result } from "./types/client";

export {
    extractErrorMessage,
    isOk,
    isResponseError,
    isValidationError,
    toFieldErrors,
    type ApiErrorDetail,
    type CustomFetchProps,
    type ResponseError,
    type ValidationError,
} from "./types/http";
