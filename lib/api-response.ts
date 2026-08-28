import { NextResponse } from "next/server";
import { isRecord } from "@/lib/validation";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function errorResponse(error: unknown, fallbackMessage: string, fallbackStatus = 502): NextResponse {
  const status = getErrorStatus(error) ?? fallbackStatus;
  const message = status >= 500 ? fallbackMessage : getErrorMessage(error, fallbackMessage);

  return jsonError(message, status);
}

function getErrorStatus(error: unknown): number | null {
  if (!isRecord(error) || typeof error.status !== "number") return null;

  return Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : null;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}
