import { z } from "zod";

const MAX_ERROR_MESSAGE_LENGTH = 240;
const errorMessageSchema = z.object({ message: z.string() });

export function getErrorMessage(error: unknown, fallback: string): string {
  const parsedError = errorMessageSchema.safeParse(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : parsedError.success
          ? parsedError.data.message
          : "";
  const normalizedMessage = message.trim();

  return normalizedMessage && normalizedMessage.length <= MAX_ERROR_MESSAGE_LENGTH
    ? normalizedMessage
    : fallback;
}
