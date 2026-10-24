"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Container, Input, Mono, Select } from "@/components/ui";
import { useApps } from "@/lib/api/apps";
import { api } from "@/lib/api/client";
import { isActive, useJob } from "@/lib/api/jobs";

type Search = { server: string; job_id: string | null; error: string | null };
type Matches = { matches: { app: string; t: number; line: string }[]; truncated: boolean; timed_out: boolean };

function parse(output: string | null | undefined): Matches | null {
  try {
    return output ? (JSON.parse(output) as Matches) : null;
  } catch {
    return null;
  }
}

/** Search what the apps logged, on every server that runs them. */
export function LogSearch() {
  const { data: apps } = useApps();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("24h");
  const [appId, setAppId] = useState("");
  const [searches, setSearches] = useState<Search[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await api<{ searches: Search[] }>("/logs/search", {
        method: "POST",
        auth: true,
        body: { query: query.trim(), range, application_ids: appId ? [appId] : [] },
      });
      setSearches(out.searches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Search logs</h1>
        <Link href="/dashboard/logs" className="ml-auto text-sm text-muted hover:text-fg">
          Live logs
        </Link>
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void run();
        }}
      >
        <Input aria-label="Text to find" className="min-w-64 flex-1 font-mono" placeholder="order 4521, ECONNREFUSED, a user's email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select aria-label="App" className="w-44" value={appId} onChange={(e) => setAppId(e.target.value)}>
          <option value="">All apps</option>
          {apps?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Time range" className="w-36" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </Select>
        <Button type="submit" variant="primary" size="md" icon="search" disabled={!query.trim() || busy}>
          Search
        </Button>
      </form>
      <p className="text-xs text-subtle">
        Searches what each server still has: Docker keeps the last 30 MB of each app&apos;s output, the journal keeps systemd apps&apos; logs. Plain text, any
        case; secrets are masked.
      </p>
      {error && <p className="text-sm text-err">{error}</p>}
      {searches?.length === 0 && <Card className="p-4 text-sm text-muted">No apps to search.</Card>}
      {searches?.map((s) => (
        <ServerResults key={`${s.server}-${s.job_id}`} search={s} />
      ))}
    </Container>
  );
}

function ServerResults({ search }: { search: Search }) {
  const job = useJob(search.job_id);
  const data = parse(job.data?.output);
  const running = !!search.job_id && (!job.data || isActive(job.data.status));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm">
        <span className="font-medium">{search.server}</span>
        <span className="ml-auto text-xs text-subtle">
          {search.error ?? (running ? "Searching…" : job.data?.status === "failed" ? job.data.error : data ? `${data.matches.length} lines${data.truncated ? " (newest 500)" : ""}` : "")}
        </span>
      </div>
      {data && data.matches.length > 0 && (
        <div className="max-h-[480px] overflow-auto font-mono text-[12px] leading-5">
          {data.matches.map((m, i) => (
            <div key={i} className="flex gap-3 border-b border-line/50 px-4 py-1 last:border-0 hover:bg-ink/[0.02]">
              <span className="shrink-0 text-subtle">{new Date(m.t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              <Mono className="w-24 shrink-0 truncate text-muted">{m.app}</Mono>
              <span className="break-all whitespace-pre-wrap">{m.line}</span>
            </div>
          ))}
        </div>
      )}
      {data?.timed_out && <p className="px-4 py-2 text-xs text-warn">The search stopped after 40 seconds; narrow the time range or pick an app.</p>}
    </Card>
  );
}
