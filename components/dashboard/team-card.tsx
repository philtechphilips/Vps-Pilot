"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommandPill } from "@/components/copy-button";
import { Badge, FormCard, Select } from "@/components/ui";
import { api } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth-store";

/** Who can use this VPSPilot, and whether they can change things. */
export function TeamCard() {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const admin = me?.role === "admin";
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<User[]>("/users/?limit=100", { auth: true }),
    enabled: admin,
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: User["role"] }) => api<User>(`/users/${id}/role`, { method: "PATCH", body: { role }, auth: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <FormCard
      title="Team"
      description="Admins can change anything. Viewers see everything except secrets (database passwords, exports, query results) and can read logs, but change nothing."
      footer={setRole.error ? <span className="text-err">{setRole.error.message}</span> : "Add people on the control plane's server; they set their own password there."}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <CommandPill command="sudo vpspilot admin teammate@example.com" />
          <CommandPill command="sudo vpspilot viewer client@example.com" />
        </div>
        {admin && (
          <div className="overflow-hidden rounded-md border border-line">
            {(users.data ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0">
                <span className="min-w-0 truncate">{u.name ? `${u.name} · ${u.email}` : u.email}</span>
                {u.id === me?.id && <Badge>You</Badge>}
                <Select
                  aria-label={`Role of ${u.email}`}
                  className="ml-auto h-8 w-32 text-xs"
                  value={u.role === "viewer" ? "viewer" : "admin"}
                  disabled={u.id === me?.id || setRole.isPending}
                  onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value as User["role"] })}
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormCard>
  );
}
