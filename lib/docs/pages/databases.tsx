import { A, C, Callout, CodeBlock, H2, H3, Ol, P, Table, Ul } from "@/components/docs/prose";
import { BrandChip } from "@/components/brand-chip";

function Engine({ name }: { name: "PostgreSQL" | "MySQL" | "MariaDB" | "Redis" }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandChip name={name} size={22} />
      {name}
    </span>
  );
}

export function DatabaseOverview() {
  return (
    <>
      <P>
        The database center gives every database you run one place for status, connections, queries, users and backups, whether VPSPilot
        created it or it was already there.
      </P>

      <H2>Supported engines</H2>
      <Table
        head={["Engine", "Managed versions", "Default port", "Admin user"]}
        rows={[
          [<Engine key="p" name="PostgreSQL" />, "17, 16", "5432", <C key="u">postgres</C>],
          [<Engine key="m" name="MySQL" />, "8.4", "3306", <C key="u">root</C>],
          [<Engine key="a" name="MariaDB" />, "11", "3306", <C key="u">root</C>],
          [<Engine key="r" name="Redis" />, "7", "6379", <C key="u">default</C>],
        ]}
      />
      <P>MongoDB, SQLite and SQL Server are planned.</P>

      <H2>Managed instances</H2>
      <P>
        A managed instance is a container VPSPilot creates on a server: <C>vpdb-&lt;name&gt;</C> on the private <C>vpspilot</C> network, with
        its data in a Docker volume of the same name. A strong admin password is generated and stored encrypted.
      </P>
      <Ul>
        <li>
          Apps on the <strong>same server</strong> reach it at <C>vpdb-&lt;name&gt;:&lt;port&gt;</C>.
        </li>
        <li>
          It isn’t published on the server’s public interfaces. Set a <strong>local port</strong> to also expose it on{" "}
          <C>127.0.0.1</C>, for an SSH tunnel or a tool running on the host.
        </li>
        <li>Start, stop and restart it from the dashboard.</li>
      </Ul>
      <Callout type="note" title="Removing an instance">
        <p>
          Removing a managed instance deletes the container. Its data volume is kept unless you also choose to delete the data, so an accidental
          removal can be undone by creating it again with the same name.
        </p>
      </Callout>

      <H2>External instances</H2>
      <P>
        An external instance is a database you already run: installed with apt, in your own container, or a hosted service. Register it with
        its host, port and credentials, and pick which server should reach it. That server’s agent connects with a throwaway client
        container on the host network, so no database client has to be installed on the server.
      </P>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/databases/external
{
  "name": "legacy-mysql",
  "server_id": "c1f0…",
  "engine": "mysql",
  "host": "127.0.0.1",
  "port": 3306,
  "user": "vpspilot_monitor",
  "password": "…"
}`}
      />
      <Callout type="tip">
        <p>
          Give VPSPilot a dedicated, least-privileged login for an external database rather than the admin account. Read-only grants are
          enough for monitoring and the data browser.
        </p>
      </Callout>

      <H3>A database installed on the server itself</H3>
      <P>
        Use host <C>127.0.0.1</C>. On Ubuntu, the <C>postgres</C> user has no password by default; give it one (or create a dedicated
        login) so VPSPilot can connect over TCP:
      </P>
      <CodeBlock code={`sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'a-strong-password';"`} />
      <P>
        Apps in Docker containers can&apos;t reach it as <C>localhost</C>; see{" "}
        <A href="/docs/deployments/applications">Applications</A>. Moving the data into a managed instance is described in{" "}
        <A href="/docs/databases/data-browser">Import and export</A>.
      </P>

      <H3>Connection security</H3>
      <Table
        head={["Mode", "Behaviour"]}
        rows={[
          ["Verify certificate (default)", "Encrypted, and the certificate must match the host. Uses the public CAs, or a CA certificate you paste (e.g. your provider's bundle)."],
          ["Encrypt, don't verify", "Encrypted, any certificate accepted. For self-signed certificates."],
          ["No TLS", <>Plain connection. Chosen automatically for <C key="l">127.0.0.1</C>; use only on the server itself or a private network.</>],
        ]}
      />
      <P>
        Change it later under the database&apos;s <strong>Settings → Connection security</strong>; saving tests the connection again. The same
        settings apply to queries, backups and imports.
      </P>
      <Callout type="security" title="Addresses VPSPilot won't connect to">
        <p>
          Link-local addresses (such as the <C>169.254.169.254</C> cloud metadata service), unspecified, multicast and reserved addresses are
          refused, both when you register the database and again on the server after resolving its name. The agent then connects to the
          address it checked, so a DNS change can&apos;t redirect it.
        </p>
      </Callout>

      <H2>History</H2>
      <P>
        Every five minutes, VPSPilot samples each running database: connections and size on disk for SQL engines; memory, keys and operations
        per second for Redis. The Overview tab charts the last 6 hours, 24 hours or 7 days.
      </P>

      <H2>Connection strings</H2>
      <P>The connection panel builds a ready-to-paste URL for the instance. Viewing it is audited because it contains a password.</P>
      <CodeBlock
        lang="text"
        code={`
postgresql://app_user:••••@vpdb-main:5432/app
mysql://app_user:••••@vpdb-shop:3306/shop
redis://worker:••••@vpdb-cache:6379/0`}
      />
    </>
  );
}

export function DataBrowser() {
  return (
    <>
      <P>
        Look inside a database without installing a client or opening a tunnel. Every request runs as a job on the server that hosts or
        reaches the database, and results come back to the dashboard.
      </P>

      <H2>Explore</H2>
      <P>Browse what is in an instance, level by level:</P>
      <Table
        head={["View", "Shows"]}
        rows={[
          ["Databases", "The databases on the instance."],
          ["Users", "Logins and roles."],
          ["Stats", "Server version and engine statistics."],
          ["Tables", "Tables in a database, grouped by schema where the engine has them."],
          ["Columns", "The columns of a table and their types."],
        ]}
      />

      <H2>Run SQL</H2>
      <P>
        The query editor runs SQL against a chosen database. Queries are <strong>read-only by default</strong>: PostgreSQL, MySQL and MariaDB
        run them in a read-only transaction, so an accidental <C>UPDATE</C> is rejected by the database itself.
      </P>
      <Table
        head={["Limit", "Value"]}
        rows={[
          ["Rows returned", "500 by default, up to 1,000"],
          ["Statement timeout", "15 seconds, enforced by the database"],
          ["SQL size", "100,000 characters"],
        ]}
      />
      <P>
        Turn off read-only to make changes. Every query is recorded in the audit log as read-only or read-write with a fingerprint of the
        SQL rather than the SQL itself, which may contain secrets. SQL reaches the database client on stdin, never on a command line.
      </P>

      <H2 id="import-and-export">Import and export</H2>
      <P>
        The <strong>Import &amp; Export</strong> tab of a PostgreSQL, MySQL or MariaDB instance moves whole databases in and out, without SSH.
      </P>
      <Table
        head={["", "Export", "Import"]}
        rows={[
          ["Format", "Plain SQL, gzipped (.sql.gz), usable with psql or mysql anywhere", ".sql, .sql.gz, or a pg_dump archive (PostgreSQL)"],
          ["Size", "Up to 1 GB", "Up to 1 GB per upload"],
          ["On failure", "—", "PostgreSQL: one transaction, so nothing changes. MySQL/MariaDB: statements before the error stay applied."],
        ]}
      />
      <P>
        Files pass through the control plane encrypted (AES-GCM) and are deleted after a day, or as soon as an import finishes. Exports and
        downloads are audited. On PostgreSQL, imported tables belong to the database&apos;s owner, so an app&apos;s own login can use them.
      </P>
      <H3>Move a database into VPSPilot</H3>
      <Ol>
        <li>Connect the existing database (host <C>127.0.0.1</C> if it&apos;s on the same server) and <strong>Export</strong> it.</li>
        <li>Create a managed instance, then <strong>Attach</strong> it to the app: this creates the app&apos;s database, login and <C>DATABASE_URL</C>.</li>
        <li>
          On the managed instance, <strong>Import</strong> the file into the app&apos;s database, then deploy the app.
        </li>
      </Ol>
      <P>Do it at a quiet time: writes to the old database after the export aren&apos;t copied.</P>

      <H2>Redis</H2>
      <P>For Redis instances the browser speaks Redis instead of SQL:</P>
      <Ul>
        <li>
          <strong>info</strong>: memory, clients, keyspace and persistence.
        </li>
        <li>
          <strong>scan</strong>: iterate keys matching a pattern, 100 at a time by default.
        </li>
        <li>
          <strong>get</strong>: show a key’s type, TTL and value.
        </li>
        <li>
          <strong>delete</strong>: remove a key.
        </li>
      </Ul>
    </>
  );
}

export function DatabaseUsers() {
  return (
    <>
      <P>
        Manage databases and logins on PostgreSQL, MySQL, MariaDB and Redis instances from the dashboard, and hand an application its own
        credentials in one step.
      </P>

      <H2>Databases</H2>
      <P>
        Create a database with an optional owner, or drop one. Names are lowercase letters, digits and underscores, starting with a letter or
        underscore, up to 63 characters.
      </P>

      <H2>Users</H2>
      <P>Create a login with one of three access levels on a database:</P>
      <Table
        head={["Access", "Grants"]}
        rows={[
          ["owner", "Full control of the database, including schema changes."],
          ["readwrite", "Read and write data in existing tables."],
          ["readonly", "Read data only."],
        ]}
      />
      <P>
        VPSPilot generates the password and stores it encrypted. <strong>Rotate</strong> sets a new random password on the database and updates
        the stored copy, and any app it is attached to picks up the new value on its next deploy.
      </P>

      <H2>Redis logins</H2>
      <P>
        The <strong>Logins</strong> tab of a Redis instance creates logins with Redis ACLs: read-only or read-write, optionally limited to a
        key pattern such as <C>cache:*</C>. Dangerous commands (<C>FLUSHALL</C>, <C>CONFIG</C>, <C>KEYS</C> and similar) are never
        allowed. Only a hash of the password is written to Redis.
      </P>
      <P>
        On managed instances, logins are saved in the instance&apos;s configuration and survive restarts. On an external Redis they last until
        it restarts, unless its own configuration saves ACLs. Needs agent 1.1.0 or later.
      </P>

      <H2>Attach to an application</H2>
      <P>Attaching wires a database into an app without copying credentials around by hand:</P>
      <Ul>
        <li>PostgreSQL, MySQL and MariaDB: VPSPilot creates a database and a login dedicated to the app.</li>
        <li>Redis: VPSPilot creates a read-write login for the app (agent 1.1.0 or later; older agents use the admin password).</li>
        <li>
          The connection URL is added to the app’s environment as a secret, under <C>DATABASE_URL</C> or a name you choose.
        </li>
      </Ul>
      <CodeBlock
        lang="http"
        code={`
POST /api/v1/databases/{instance_id}/attach
{ "application_id": "9ab2…", "env_key": "DATABASE_URL" }`}
      />
      <H3>Rules</H3>
      <Ul>
        <li>A managed database can only be attached to apps on its own server, since it is only reachable there.</li>
        <li>The app must not already have a variable with that name.</li>
        <li>
          Redeploy the app to start using the new variable. See <A href="/docs/deployments/environment">Environment Variables</A>.
        </li>
      </Ul>
    </>
  );
}
