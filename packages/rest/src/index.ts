export {
    createRestClient,
    HttpClient,
    type HttpClientOptions,
} from "./http-client";

export {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    HttpError,
    httpErrorFor,
    isHttpError,
    isNetworkError,
    isParseError,
    isRestError,
    matchHttpError,
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
    type HttpErrorHandlers,
    type HttpErrorOpts,
} from "./errors";

export type { Client, Result } from "./types/client";

export {
    extractErrorMessage,
    isOk,
    isResponseError,
    isValidationError,
    toFieldErrors,
    type ApiErrorDetail,
    type ApiResponse,
    type CustomFetchProps,
    type CustomResponse,
    type ResponseError,
    type ValidationError,
} from "./types/http";
