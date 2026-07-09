export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'error',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, msg, 'bad_request', details);
export const unauthorized = (msg = 'Unauthorized') =>
  new AppError(401, msg, 'unauthorized');
export const forbidden = (msg = 'Forbidden') =>
  new AppError(403, msg, 'forbidden');
export const notFound = (msg = 'Not found') =>
  new AppError(404, msg, 'not_found');
export const serverError = (msg = 'Internal server error', details?: unknown) =>
  new AppError(500, msg, 'server_error', details);
