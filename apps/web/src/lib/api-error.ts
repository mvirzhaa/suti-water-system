type ApiErrorData = {
  message?: string | string[];
};

type ApiError = {
  response?: {
    data?: ApiErrorData;
  };
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  const message = (error as ApiError)?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}
