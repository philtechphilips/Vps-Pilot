"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export type LogSource = { kind: "journal"; unit: string | null } | { kind: "container"; container: string };

export type Level = "error" | "warn" | "info" | "debug";

export type Entry = { key: string; time: number; origin: string; level: Level; message: string; stream?: "out" | "err" };

export type Sources = {
  units: string[];
  containers: { name: string; label: string; kind: "app" | "database" | "container"; state: string; image: string }[];
};

type JournalLine = { t: number; u: string; p: number; m: string };
type ContainerLine = { t: string; s: "out" | "err"; m: string };
type Reply = { status: string; error: string | null; cursor?: string | null; lines: (JournalLine | ContainerLine)[] };

const MAX_LINES = 5000;
const FOLLOW_EVERY_MS = 3000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ERROR_RE = /\b(error|exception|fatal|panic|traceback|critical|uncaught|failed)\b/i;
const WARN_RE = /\b(warn|warning|deprecated)\b/i;
const DEBUG_RE = /\b(debug|trace)\b/i;

function journalLevel(p: number): Level {
  return p <= 3 ? "error" : p === 4 ? "warn" : p === 7 ? "debug" : "info";
}

function guessLevel(message: string, stream: "out" | "err"): Level {
  if (ERROR_RE.test(message)) return "error";
  if (WARN_RE.test(message)) return "warn";
  if (DEBUG_RE.test(message)) return "debug";
  return stream === "err" ? "warn" : "info";
}

function normalise(source: LogSource, line: JournalLine | ContainerLine): Entry {
  if (source.kind === "journal") {
    const l = line as JournalLine;
    return { key: `${l.t}|${l.u}|${l.m}`, time: Math.floor(l.t / 1000), origin: l.u, level: journalLevel(l.p), message: l.m };
  }
  const l = line as ContainerLine;
  return { key: `${l.t}|${l.s}|${l.m}`, time: new Date(l.t).getTime(), origin: source.container, level: guessLevel(l.m, l.s), message: l.m, stream: l.s };
}

function useSignedIn() {
  return useAuthStore((s) => s.status === "authenticated");
}

export function useLogSources(serverId: string | undefined) {
  return useQuery({
    queryKey: ["logs", "sources", serverId ?? ""],
    queryFn: () => api<Sources>(`/logs/sources?server_id=${serverId}`, { auth: true }),
    enabled: useSignedIn() && !!serverId,
    refetchInterval: 30_000,
  });
}

async function readOnce(serverId: string, source: LogSource, lines: number, resume: { cursor?: string | null; since?: string | null }, alive: () => boolean) {
  const body: Record<string, unknown> = { server_id: serverId, source: source.kind, lines };
  if (source.kind === "journal") {
    if (source.unit) body.unit = source.unit;
    if (resume.cursor) body.cursor = resume.cursor;
  } else {
    body.container = source.container;
    if (resume.since) body.since = resume.since;
  }
  const { job_id } = await api<{ job_id: string }>("/logs", { method: "POST", body, auth: true });
  const deadline = Date.now() + 45_000;
  while (alive() && Date.now() < deadline) {
    await sleep(700);
    const reply = await api<Reply>(`/logs/${job_id}`, { auth: true });
    if (reply.status === "succeeded") return reply;
    if (reply.status !== "queued" && reply.status !== "running") throw new ApiError(502, reply.error ?? `Couldn't read logs (${reply.status})`);
  }
  if (!alive()) return null;
  throw new ApiError(504, "The agent didn't answer in time. Is the server online?");
}

/** Logs from one source; with `follow`, new lines are appended every few
 * seconds (journal: exact cursor; containers: last timestamp). */
export function useLogFeed(serverId: string | undefined, source: LogSource | null, lines: number, follow: boolean) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const followRef = useRef(follow);
  const runId = useRef(0);
  const running = useRef(false);
  const resume = useRef<{ cursor?: string | null; since?: string | null }>({});
  const buffer = useRef<Entry[]>([]);
  const sourceKey = source ? JSON.stringify(source) : "";
  const currentKey = `${serverId}|${sourceKey}|${lines}|${nonce}`;

  const loop = useCallback(
    async (reset: boolean, key: string) => {
      if (!serverId || !source) return;
      const mine = ++runId.current;
      const alive = () => runId.current === mine;
      if (reset) {
        resume.current = {};
        buffer.current = [];
      }
      running.current = true;
      try {
        while (alive()) {
          try {
            const first = !resume.current.cursor && !resume.current.since;
            const reply = await readOnce(serverId, source, lines, resume.current, alive);
            if (!reply || !alive()) return;
            if (!first && !followRef.current) return; // paused mid-refresh: stay frozen
            const fresh = reply.lines.map((l) => normalise(source, l));
            if (first) {
              buffer.current = fresh;
            } else {
              const seen = new Set(buffer.current.slice(-300).map((e) => e.key));
              buffer.current = [...buffer.current, ...fresh.filter((e) => !seen.has(e.key))].slice(-MAX_LINES);
            }
            if (source.kind === "journal") resume.current = { cursor: reply.cursor ?? resume.current.cursor };
            else {
              const last = reply.lines.at(-1) as ContainerLine | undefined;
              resume.current = { since: last?.t ?? resume.current.since ?? new Date().toISOString().replace(/\.\d+Z$/, "Z") };
            }
            setEntries(buffer.current);
            setError(null);
            setLoadedKey(key);
          } catch (e) {
            if (!alive()) return;
            setError(e instanceof Error ? e.message : "Couldn't read logs");
            setLoadedKey(key);
          }
          if (!followRef.current) return;
          await sleep(FOLLOW_EVERY_MS);
        }
      } finally {
        if (alive()) running.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverId, sourceKey, lines],
  );

  useEffect(() => {
    const ids = runId;
    const busy = running;
    void loop(true, `${serverId}|${sourceKey}|${lines}|${nonce}`);
    return () => {
      ids.current++;
      busy.current = false;
    };
  }, [loop, serverId, sourceKey, lines, nonce]);

  useEffect(() => {
    followRef.current = follow;
    if (follow && !running.current && (resume.current.cursor || resume.current.since)) void loop(false, currentKey);
  }, [follow, loop, currentKey]);

  return {
    // Lines from a previous source are hidden until the new one answers.
    entries: source && loadedKey === currentKey ? entries : [],
    error,
    loading: !!source && loadedKey !== currentKey,
    refresh: () => setNonce((n) => n + 1),
  };
}
