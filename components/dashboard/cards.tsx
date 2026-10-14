import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { alerts } from "@/lib/data";

const sevTone = { critical: "err", warning: "warn", info: "blue" } as const;

export function AlertList({ limit, compact }: { limit?: number; compact?: boolean }) {
  const list = alerts.filter((a) => a.state !== "resolved").slice(0, limit);
  return (
    <Card className="overflow-hidden">
      {list.map((a) => (
        <Link
          key={a.id}
          href="/dashboard/monitoring"
          className="flex items-start gap-3 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
        >
          <Icon name="alert" className={a.severity === "critical" ? "mt-0.5 shrink-0 text-err" : "mt-0.5 shrink-0 text-warn"} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm">{a.title}</span>
              {a.state === "acknowledged" && <Badge>Ack</Badge>}
            </div>
            <div className="truncate text-xs text-subtle">
              {a.target}
              {!compact && <> · {a.rule}</>}
            </div>
          </div>
          <Badge tone={sevTone[a.severity]}>{a.since}</Badge>
        </Link>
      ))}
    </Card>
  );
}
