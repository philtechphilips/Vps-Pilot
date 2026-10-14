"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api/client";

export type LogLine = { t: string; s: "out" | "err"; m: string };

type LogsReply = {
  status: "queued" | "running" | "succeeded" | "failed" | "expired" | "canceled";
  error: string | null;
  state: string | null;
  started_at: string | null;
  restarts: number;
  lines: LogLine[];
};

export type RuntimeLogs = {
  lines: LogLine[];
  state: string | null;
  startedAt: string | null;
  restarts: number;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
};

const MAX_LINES = 5000;
const FOLLOW_EVERY_MS = 3000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (l: LogLine) => `${l.t}|${l.s}|${l.m}`;

/** One read: queue it on the agent and wait for the answer. */
async function readOnce(appId: string, lines: number, since: string | null, alive: () => boolean): Promise<LogsReply | null> {
  const { job_id } = await api<{ job_id: string }>(`/applications/${appId}/logs`, {
    method: "POST",
    body: since ? { lines, since } : { lines },
    auth: true,
  });
  const deadline = Date.now() + 45_000;
  while (alive() && Date.now() < deadline) {
    await sleep(700);
    const reply = await api<LogsReply>(`/applications/${appId}/logs/${job_id}`, { auth: true });
    if (reply.status !== "queued" && reply.status !== "running") return reply;
  }
  if (!alive()) return null;
  throw new ApiError(504, "The agent didn't answer in time. Is the server online?");
}

/** The app's runtime output; with `follow`, keeps appending new lines.
 * Pausing freezes the view; resuming continues from the last line. */
export function useRuntimeLogs(appId: string | undefined, lines: number, follow: boolean): RuntimeLogs & { refresh: () => void } {
  const [state, setState] = useState<Omit<RuntimeLogs, "loading"> & { loadedKey: string | null }>({
    lines: [],
    state: null,
    startedAt: null,
    restarts: 0,
    error: null,
    updatedAt: null,
    loadedKey: null,
  });
  const [nonce, setNonce] = useState(0);
  // Loading until the first answer for the current app/line count/refresh.
  const currentKey = `${appId}:${lines}:${nonce}`;
  const followRef = useRef(follow);
  const runId = useRef(0); // bumping it stops the running loop
  const running = useRef(false);
  const since = useRef<string | null>(null);
  const buffer = useRef<LogLine[]>([]);

  const loop = useCallback(
    async (reset: boolean, loadKey: string) => {
      if (!appId) return;
      const mine = ++runId.current;
      const alive = () => runId.current === mine;
      if (reset) {
        since.current = null;
        buffer.current = [];
      }
      running.current = true;
      try {
        while (alive()) {
          try {
            const reply = await readOnce(appId, lines, since.current, alive);
            if (!reply || !alive()) return;
            // Paused while this refresh was in flight: keep the view frozen
            // (resuming reads these lines again from `since`).
            if (since.current !== null && !followRef.current) return;
            if (reply.status !== "succeeded") throw new ApiError(502, reply.error ?? `Couldn't read logs (${reply.status})`);
            if (since.current === null) {
              buffer.current = reply.lines;
            } else {
              // `since` is inclusive, so the last line comes back again.
              const seen = new Set(buffer.current.slice(-200).map(key));
              buffer.current = [...buffer.current, ...reply.lines.filter((l) => !seen.has(key(l)))].slice(-MAX_LINES);
            }
            since.current = buffer.current.at(-1)?.t ?? since.current;
            setState({
              lines: buffer.current,
              state: reply.state,
              startedAt: reply.started_at,
              restarts: reply.restarts,
              error: null,
              updatedAt: Date.now(),
              loadedKey: loadKey,
            });
          } catch (error) {
            if (!alive()) return;
            setState((s) => ({ ...s, loadedKey: loadKey, error: error instanceof Error ? error.message : "Couldn't read logs" }));
          }
          if (!followRef.current) return;
          await sleep(FOLLOW_EVERY_MS);
        }
      } finally {
        if (alive()) running.current = false;
      }
    },
    [appId, lines],
  );

  // (Re)load from scratch when the app, the line count or "refresh" changes.
  useEffect(() => {
    const ids = runId;
    const busy = running;
    void loop(true, `${appId}:${lines}:${nonce}`);
    return () => {
      ids.current++;
      busy.current = false;
    };
  }, [loop, appId, lines, nonce]);

  // Resume following without reloading.
  useEffect(() => {
    followRef.current = follow;
    if (follow && !running.current && since.current !== null) void loop(false, currentKey);
  }, [follow, loop, currentKey]);

  const { loadedKey, ...rest } = state;
  return { ...rest, loading: loadedKey !== currentKey, refresh: () => setNonce((n) => n + 1) };
}
