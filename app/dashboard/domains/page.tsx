import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Container, Input, Mono, PageHeader, Select } from "@/components/ui";
import { apps, domains, getApp, getServer } from "@/lib/data";

export const metadata: Metadata = { title: "Domains" };

export default function DomainsPage() {
  return (
    <>
      <PageHeader title="Domains" description="Hostnames mapped to applications through validated, per-app proxy configuration." />
      <Container className="space-y-6">
        <Card className="p-4">
          <form className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="app.example.com" className="flex-1 font-mono" aria-label="Domain" />
            <Select defaultValue="" className="sm:w-56" aria-label="Application">
              <option value="" disabled>
                Assign to application…
              </option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="primary" size="md">
              Add
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {domains.map((d) => {
            const app = getApp(d.appId);
            const server = getServer(d.serverId);
            const invalid = d.proxy === "invalid";
            return (
              <Card key={d.host} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <a href="#" className="inline-flex items-center gap-1.5 text-[17px] font-semibold tracking-tight hover:underline">
                      {d.host} <Icon name="external-link" size={14} className="text-subtle" />
                    </a>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <span className={`flex items-center gap-1.5 ${invalid ? "text-err" : "text-blue-fg"}`}>
                        <Icon name={invalid ? "x-circle" : "check-circle"} size={16} />
                        {invalid ? "Invalid Configuration" : "Valid Configuration"}
                      </span>
                      {d.redirect ? (
                        <span className="flex items-center gap-1.5 text-muted">
                          <Icon name="arrow-right" size={14} /> Redirects to <span className="text-fg">{d.redirect}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted">
                          <Icon name="box" size={14} />
                          <Link href={`/dashboard/applications/${app?.id}`} className="text-fg hover:underline">
                            {app?.name}
                          </Link>
                          <span className="text-subtle">on {server?.name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Icon name="lock" size={14} className="text-subtle" />
                        {d.tls === "active" && <span className="text-muted">TLS active · renews before {d.expires}</span>}
                        {d.tls === "expiring" && <Badge tone="warn">Expires {d.expires}</Badge>}
                        {d.tls === "failed" && <Badge tone="err">Issuance failed</Badge>}
                        {d.tls === "issuing" && <Badge tone="blue">Issuing…</Badge>}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="sm" icon="refresh">
                      Refresh
                    </Button>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>

                {invalid && (
                  <div className="border-t border-line bg-bg px-5 py-4">
                    <p className="text-sm text-muted">Set the following record on your DNS provider to continue:</p>
                    <div className="thin-scrollbar mt-3 overflow-x-auto rounded-md border border-line">
                      <table className="w-full min-w-[420px] text-sm">
                        <thead>
                          <tr className="text-left text-xs text-subtle">
                            <th className="border-b border-line px-4 py-2 font-normal">Type</th>
                            <th className="border-b border-line px-4 py-2 font-normal">Name</th>
                            <th className="border-b border-line px-4 py-2 font-normal">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2.5 font-mono">A</td>
                            <td className="px-4 py-2.5 font-mono">staging.shop</td>
                            <td className="px-4 py-2.5 font-mono">{server?.ip}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
                      <Icon name="info" size={13} /> Proxy validation also failed because <Mono>staging-01</Mono> is offline. Unrelated sites were left untouched.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line bg-bg-200 px-5 py-2.5 text-xs text-subtle">
                  <span>Issuer: {d.issuer}</span>
                  <span>Proxy file: /etc/nginx/sites-enabled/vpspilot-{d.appId}.conf</span>
                  <span>Added {d.added}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </>
  );
}
