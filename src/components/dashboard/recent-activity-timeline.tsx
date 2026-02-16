"use client";

import { Film, Trash2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatLoggedAt, formatMinutes } from "@/lib/format";
import type { RecentLogItem } from "@/lib/types";

type RecentActivityTimelineProps = {
  logs: RecentLogItem[];
  onDelete: (logId: Id<"watchLogs">) => void;
  deletingLogId?: Id<"watchLogs">;
};

export const RecentActivityTimeline = ({
  logs,
  onDelete,
  deletingLogId,
}: RecentActivityTimelineProps) => {
  return (
    <Card className="panel-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg tracking-wide">
          <Film className="size-5 text-[var(--color-signal)]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No logs yet. Start with a quick session.
          </p>
        ) : (
          <ScrollArea className="h-[260px] pr-3">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-surface-soft)] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium leading-tight">{log.titleName}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                        {log.languageCode} • {log.contentType}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                      onClick={() => onDelete(log._id)}
                      disabled={deletingLogId === log._id}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>{log.units} x {log.unitMinutes}m</span>
                    <span className="font-mono font-medium">
                      {formatMinutes(log.totalMinutes)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {formatLoggedAt(log.loggedAt)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
