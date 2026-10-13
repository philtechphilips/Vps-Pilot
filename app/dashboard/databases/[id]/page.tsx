import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { DetailHeader } from "@/components/dashboard/detail";
import { Badge, Button, Dot, Mono } from "@/components/ui";
import { databases, dbTone, getDatabase, getServer } from "@/lib/data";
import { DatabaseWorkspace } from "./workspace";

export function generateStaticParams() {
  return databases.map((d) => ({ id: d.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getDatabase(id)?.name ?? "Database" };
}

export default async function DatabasePage({ params }: Props) {
  const { id } = await params;
  const db = getDatabase(id);
  if (!db) notFound();
  const server = db.serverId ? getServer(db.serverId) : null;

  return (
    <>
      <DetailHeader
        back="/dashboard/databases"
        backLabel="Databases"
        title={
          <>
            <BrandChip name={db.engine} size={34} />
            {db.name}
            <Badge tone={db.mode === "Remote" ? "violet" : db.mode === "Docker" ? "blue" : "neutral"}>{db.mode}</Badge>
          </>
        }
        meta={
          <>
            <span className="flex items-center gap-2 capitalize">
              <Dot tone={dbTone[db.status]} pulse={db.status === "healthy"} /> {db.status}
            </span>
            <span>
              {db.engine} {db.version}
            </span>
            {server ? (
              <Link href={`/dashboard/servers/${server.id}`} className="hover:text-fg">
                {server.name}
              </Link>
            ) : (
              <span>Remote</span>
            )}
            <Mono>{db.endpoint}</Mono>
            <span>Checked {db.lastCheck}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="md" icon="zap">
              Test Connection
            </Button>
            <Button variant="primary" size="md" icon="archive">
              Back Up Now
            </Button>
          </>
        }
      />
      <DatabaseWorkspace db={db} />
    </>
  );
}
