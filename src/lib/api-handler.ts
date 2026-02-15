import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

interface AuthenticatedContext {
  userId: string;
  userName: string | null;
  params: Record<string, string>;
}

type HandlerFn = (
  request: NextRequest,
  ctx: AuthenticatedContext
) => Promise<NextResponse>;

interface HandlerOptions {
  /** Route label for error logging, e.g. "GET /api/applications" */
  route: string;
  /** Optional custom error handler for route-specific fallbacks */
  onError?: (error: unknown) => NextResponse | null;
}

/**
 * Wraps an API route handler with auth check, Zod error handling,
 * and a generic error catch with structured logging.
 */
export function withAuth(handler: HandlerFn, opts: HandlerOptions) {
  return async (
    request: NextRequest,
    routeCtx?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const params = routeCtx?.params ? await routeCtx.params : {};

      return await handler(request, {
        userId: session.user.id,
        userName: session.user.name ?? null,
        params,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.issues },
          { status: 400 }
        );
      }
      if (opts.onError) {
        const custom = opts.onError(error);
        if (custom) return custom;
      }
      const message =
        error instanceof Error ? error.message : "Unknown error";
      logger.error({ msg: `${opts.route} failed`, error: message });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
