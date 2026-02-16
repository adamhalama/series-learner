import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sanitizeNextPath } from "@/lib/app-gate";

type UnlockPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(firstValue(params.next));
  const hasError = firstValue(params.error) === "1";

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="atmosphere" aria-hidden />

      <Card className="panel-card relative z-10 w-full max-w-md border-[var(--color-panel-border)]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            Protected Session
          </p>
          <CardTitle className="font-display text-4xl tracking-[0.08em]">
            Unlock Tracker
          </CardTitle>
          <CardDescription className="text-[var(--color-text-muted)]">
            Enter the shared access password to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form action="/api/auth/unlock" method="post" className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />

            <label className="block text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Shared password
            </label>

            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-12 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
              placeholder="Enter password"
            />

            <Button type="submit" className="min-h-12 w-full">
              <LockKeyhole className="size-4" />
              Unlock
            </Button>
          </form>

          {hasError ? (
            <div className="rounded-lg border border-[var(--color-danger)]/70 bg-[var(--color-danger)]/12 p-3 text-sm text-[var(--color-text-primary)]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-[var(--color-danger)]" />
                Incorrect password. Try again.
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
