import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Classes de erro padronizadas para o BolaoGB.
 * Use handleApiError() em todos os Route Handlers para resposta consistente.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Handler de erro centralizado para Route Handlers.
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   try {
 *     // ...
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  // Erro não mapeado — não expor detalhes internos ao cliente
  return NextResponse.json(
    { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}

// Re-exporta NextRequest para facilitar uso nos handlers
export type { NextRequest };
