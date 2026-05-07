export function isPrismaDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const prismaError = error as Error & {
    code?: string;
    name?: string;
    message: string;
  };

  return (
    prismaError.name === "PrismaClientInitializationError" ||
    prismaError.code === "P1001" ||
    prismaError.message.includes("Can't reach database server") ||
    prismaError.message.includes("Authentication failed against database server") ||
    prismaError.message.includes("Environment variable not found: DATABASE_URL")
  );
}
