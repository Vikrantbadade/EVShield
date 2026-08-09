export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const createSuccessResponse = <T>(data: T): ApiSuccessResponse<T> => {
  return {
    success: true,
    data,
  };
};

export const createErrorResponse = (
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
};
