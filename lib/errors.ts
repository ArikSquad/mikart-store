import { isRecord } from "@/lib/validation";

const MAX_ERROR_MESSAGE_LENGTH = 240;

export function getErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : isRecord(error) && typeof error.message === "string"
          ? error.message
          : "";
  const normalizedMessage = message.trim();

  return normalizedMessage && normalizedMessage.length <= MAX_ERROR_MESSAGE_LENGTH
    ? normalizedMessage
    : fallback;
}
