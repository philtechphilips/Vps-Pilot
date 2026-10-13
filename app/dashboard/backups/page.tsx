import type { Metadata } from "next";
import Link from "next/link";
import { BrandChip, type Brand } from "@/components/brand-chip";
import { Icon } from "@/components/icons";
import { Button, Card, Container, Dot, Mono, PageHeader, Table, Td, Th } from "@/components/ui";
import { backups, backupTone } from "@/lib/data";

export const metadata: Metadata = { title: "Backups" };

export default function BackupsPage() {
  const verified = backups.filter((b) => b.status === "verified").length;
  return (
    <>
      <PageHeader
        title="Backups"
        description="Encrypted, checksummed backups with retention and restore verification."
        actions={
          <>
            <Button variant="secondary" size="md" icon="settings">
              Storage
            </Button>
            <Button variant="primary" size="md" icon="plus">
              Create Backup
            </Button>
          </>
        }
      />
      <Container className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Protected targets", v: "6", s: "5 databases + control plane" },
            { k: "Last 24h", v: "7 / 8", s: "1 failed · pg-analytics" },
            { k: "Restore-verified", v: `${verified}`, s: "most recent 11m ago" },
            { k: "Off-host storage", v: "184 GB", s: "s3://acme-backups · AES-256-GCM" },
          ].map((x) => (
            <Card key={x.k} className="p-4">
              <div className="text-[13px] text-muted">{x.k}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{x.v}</div>
              <div className="mt-0.5 truncate text-xs text-subtle">{x.s}</div>
            </Card>
          ))}
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Target</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Size</Th>
              <Th>Checksum</Th>
              <Th>Encrypted</Th>
              <Th>Retention</Th>
              <Th>Restore verification</Th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id} className="hover:bg-white/[0.02]">
                <Td>
                  <span className="flex items-center gap-3">
                    {b.engine === "VPSPilot" ? (
                      <span className="flex size-7 items-center justify-center rounded-md border border-line bg-bg text-muted">
                        <Icon name="layers" size={14} />
                      </span>
                    ) : (
                      <BrandChip name={b.engine as Brand} size={28} />
                    )}
                    <span>
                      {b.targetType === "database" ? (
                        <Link href={`/dashboard/databases/${b.target}`} className="font-medium hover:underline">
                          {b.target}
                        </Link>
                      ) : (
                        <span className="font-medium">{b.target}</span>
                      )}
                      <Mono className="block text-subtle">{b.id}</Mono>
                    </span>
                  </span>
                </Td>
                <Td>
                  <span className="flex items-center gap-2 capitalize">
                    <Dot tone={backupTone[b.status]} pulse={b.status === "running"} /> {b.status}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-muted">{b.created}</Td>
                <Td className="font-mono text-[13px] text-muted">{b.size}</Td>
                <Td className="font-mono text-xs text-subtle">{b.checksum}</Td>
                <Td>{b.encrypted ? <Icon name="lock" className="text-ok" aria-label="Encrypted" /> : <span className="text-xs text-warn">No</span>}</Td>
                <Td className="text-muted">{b.retention}</Td>
                <Td className="text-xs text-muted">{b.restoreTest}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}
