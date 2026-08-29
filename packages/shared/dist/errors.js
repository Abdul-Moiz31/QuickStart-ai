export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = "APP_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, "FORBIDDEN");
    }
}
export class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(message, 404, "NOT_FOUND");
    }
}
export class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, "RATE_LIMITED");
    }
}
export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409, "CONFLICT");
    }
}
//# sourceMappingURL=errors.js.map