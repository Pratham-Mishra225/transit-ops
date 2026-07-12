import { Prisma } from "@prisma/client";

/**
 * Narrows an unknown catch value to a Prisma known request error,
 * enabling safe access to `.code` without TypeScript strict-mode complaints.
 */
export function isPrismaError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

/** Prisma error code constants used across route handlers. */
export const PrismaErrorCode = {
  UNIQUE_CONSTRAINT: "P2002",
  FOREIGN_KEY_CONSTRAINT: "P2003",
  RECORD_NOT_FOUND: "P2025",
} as const;
