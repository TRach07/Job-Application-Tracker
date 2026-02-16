"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[oklch(0.145_0_0)] text-[oklch(0.985_0_0)] flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="text-[oklch(0.708_0_0)] max-w-md">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-[oklch(0.922_0_0)] text-[oklch(0.205_0_0)] rounded-md hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
