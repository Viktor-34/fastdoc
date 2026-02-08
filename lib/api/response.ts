import { NextResponse } from "next/server";

export function apiError(
  error: string,
  status = 400,
  details?: unknown,
) {
  if (details === undefined) {
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ error, details }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
