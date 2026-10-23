import { A, C, Callout, CodeBlock, H2, H3, P, Table, Ul } from "@/components/docs/prose";

export function Domains() {
  return (
    <>
      <P>
        Each server runs one Caddy container, <C>vpspilot-proxy</C>, on ports 80 and 443. A domain maps a hostname to an application on that
        server, and Caddy obtains and renews its certificate automatically.
      </P>

      <H2>Add a domain</H2>
      <P>Pick the application, enter the hostname, and point DNS at the server:</P>
      <CodeBlock
        lang="text"
        title="DNS"
        code={`
app.example.com.   300  IN  A     203.0.113.10
app.example.com.   300  IN  AAAA  2001:db8::10`}
      />
      <P>
        Once the record resolves, the first HTTPS request triggers certificate issuance through Let’s Encrypt. The owner’s email is given to
        the certificate authority for expiry notices.
      </P>

      <H2>TLS modes</H2>
      <Table
        head={["Mode", "Behaviour"]}
        rows={[
          [<C key="a">auto</C>, "Publicly trusted certificate from Let's Encrypt, renewed automatically. HTTP redirects to HTTPS. The default."],
          [<C key="i">internal</C>, "Certificate from Caddy's internal CA. For private hostnames and staging behind a VPN."],
          [<C key="o">off</C>, "Plain HTTP only. For hosts behind another TLS-terminating proxy or CDN."],
        ]}
      />

      <H2>www redirects</H2>
      <P>
        Turn on <strong>redirect www</strong> to add the other variant as a permanent redirect: <C>www.example.com</C> to{" "}
        <C>example.com</C>, or the other way round, depending on which one you add.
      </P>

      <H2>DNS and certificate status</H2>
      <Table
        head={["DNS status", "Meaning"]}
        rows={[
          ["ok", "The hostname resolves to one of the server's addresses."],
          ["elsewhere", "It resolves, but to another address. Common behind a CDN; certificates may fail with auto TLS."],
          ["missing", "No A or AAAA record yet."],
        ]}
      />
      <P>
        DNS is checked from the control plane. Certificate issuer and expiry are read from the server every six hours, or right away with{" "}
        <strong>Check</strong>. The <strong>Certificate expiring</strong> alert fires 14 days before a Let’s Encrypt certificate expires.
      </P>

      <H2>How config is applied</H2>
      <P>
        Every change re-renders the server’s whole Caddyfile from the desired state in the control plane, validates it with Caddy, swaps it in
        and reloads. If the reload fails, the previous file is restored. VPSPilot only manages its own proxy configuration.
      </P>
      <CodeBlock
        lang="text"
        title="/var/lib/vpspilot-proxy/Caddyfile (generated)"
        code={`
# Managed by VPSPilot. Changes here are overwritten.
{
	email owner@acme.dev
}

import /etc/caddy/extra/*.caddy

app.example.com {
	log {
		output stderr
		format json
	}
	encode zstd gzip
	reverse_proxy vp-web:3000
}

www.app.example.com {
	redir https://app.example.com{uri} permanent
}`}
      />
      <P>
        Docker and Compose apps are reached by name on the private network (<C>vp-&lt;app&gt;:&lt;port&gt;</C>); systemd apps through the
        network&apos;s gateway on their public port. Files you put in <C>/var/lib/vpspilot-proxy/extra/*.caddy</C> are imported and never
        rewritten: the self-hosted dashboard&apos;s own site lives there, and you can add sites VPSPilot doesn&apos;t manage. The access log
        feeds each app&apos;s <A href="/docs/operations/monitoring">traffic metrics</A>.
      </P>
      <Callout type="warning" title="Ports 80 and 443">
        <p>
          The proxy needs ports 80 and 443 free on the server. Stop any nginx or Apache that holds them, or move those sites behind VPSPilot
          first.
        </p>
      </Callout>
    </>
  );
}

export function Monitoring() {
  return (
    <>
      <P>
        Agents send host metrics every 15 seconds. The control plane keeps every sample for 7 days and hourly averages and peaks for 90
        days, charts them per server and across the fleet, and evaluates alert rules every 30 seconds.
      </P>

      <H2>Metrics</H2>
      <Ul>
        <li>CPU, memory and swap usage</li>
        <li>Disk and inode usage on the root filesystem</li>
        <li>Load average and network throughput</li>
        <li>Services, containers and listening ports (inventory, every 60 seconds)</li>
      </Ul>
      <P>
        Server and fleet charts show the last hour, 24 hours, 7, 30 or 90 days; 7 days and longer are drawn from the hourly rollups.
      </P>

      <H2>Application traffic</H2>
      <P>
        Every site on VPSPilot&apos;s proxy writes an access log. Once a minute the agent counts requests per domain (total, 4xx, 5xx, bytes,
        and p50/p95 latency) and reports the counts, never the requests themselves. Each app&apos;s page shows its <strong>Traffic</strong>{" "}
        over 1 hour, 24 hours or 7 days, for requests through its domains (not its direct port). Counts are kept for 7 days.
      </P>

      <H2>Alert rules</H2>
      <P>
        VPSPilot ships with a rule for each of these. Change thresholds, durations and severities, or add more rules of the same kinds.
        Percentage thresholds stay below 100; app error rules count lines; certificate rules take days and backup rules hours (168 suits
        weekly backups), and those two are checked once rather than over a duration.
      </P>
      <Table
        head={["Rule", "Target", "Default", "Severity"]}
        rows={[
          ["Agent offline", "Server", "No heartbeat for 5 min", "critical"],
          ["CPU sustained high", "Server", "≥ 90% for 15 min", "warning"],
          ["Memory pressure", "Server", "≥ 90% for 10 min", "warning"],
          ["Disk almost full", "Server", "≥ 85% for 30 min", "warning"],
          ["Inodes almost exhausted", "Server", "≥ 85% for 30 min", "warning"],
          ["Heavy swapping", "Server", "≥ 80% for 15 min (off by default)", "info"],
          ["Application down", "Application", "Not running for 2 min", "critical"],
          ["App logging errors", "Application", "1 error line within 5 min", "warning"],
          ["High error rate", "Application", "> 5% of requests fail with 5xx for 5 min", "warning"],
          ["Site down", "Domain", "Uptime check failing for 2 min", "critical"],
          ["Security updates pending", "Server", "1 or more for 3 days", "warning"],
          ["Certificate expiring", "Domain", "< 14 days left", "warning"],
          ["Backups stale or failing", "Database or app", "Last backup failed, or none good in 36 h", "warning"],
        ]}
      />

      <H3>How rules avoid noise</H3>
      <Ul>
        <li>Metric rules average samples over the rule’s duration, so a single spike never alerts.</li>
        <li>They resolve only once the value falls 3 points below the threshold, so values at the edge don’t flap.</li>
        <li>
          App error alerts resolve after three quiet windows (15 minutes by default), so an app that fails every few minutes is one
          incident, not a page every time.
        </li>
        <li>There is at most one open alert per rule and target.</li>
      </Ul>

      <H3 id="app-errors">App logging errors</H3>
      <P>
        Once a minute the agent reads what each app logged (its container, every service of a Compose app, or its systemd journal) and
        counts the error lines. The alert says how many there were and shows the latest one, so a Telegram or Slack message tells you
        what broke.
      </P>
      <Table
        head={["Counted as an error", "Examples"]}
        rows={[
          ["JSON logs at error level", <C key="j">{`{"level":"error",…}`}, pino level 50+</C>],
          ["Journal entries at priority err or worse", "systemd apps"],
          [
            "Lines with an error marker",
            <C key="m">ERROR · FATAL · Traceback · TypeError: · Error: · [error] · level=error · npm ERR!</C>,
          ],
        ]}
      />
      <P>
        Output on stderr alone doesn&apos;t count, since many apps log everything there. Passwords, tokens and credentials in URLs are
        masked on the server before the line is sent, and stored lines are encrypted and kept for 7 days. Raise the threshold (for
        example 20 lines in 5 minutes) for a noisy app, or turn the rule off. Needs agent 1.1.3 or later.
      </P>

      <H3 id="uptime">Uptime checks</H3>
      <P>
        Once a minute the control plane requests each live domain&apos;s health check path, the way a visitor reaches it: DNS, the proxy,
        HTTPS and the app. A connection error, timeout, certificate problem or 5xx answer counts as down; a 4xx is up (a login page is a
        working site). The app&apos;s page charts availability and response time over 24 hours, 7 or 30 days, and the{" "}
        <strong>Site down</strong> rule alerts when checks fail for 2 minutes. When the control plane runs on the same server, these checks
        don&apos;t see network problems between the server and the internet.
      </P>

      <H3>High error rate</H3>
      <P>
        Uses the request counts from the proxy (see Application traffic): it fires when more than 5% of requests through an app&apos;s
        domains are answered with 5xx over 5 minutes, and only with at least 20 requests in that time, so one failure on a quiet app
        doesn&apos;t page you.
      </P>

      <H3>Security updates pending</H3>
      <P>
        Agents read pending package updates from apt every 6 hours; each server&apos;s page lists them, flags a needed reboot, and has
        buttons to install security updates, all updates, or reboot. The rule waits 3 days by default, since unattended-upgrades usually
        installs security fixes overnight. Needs agent 1.1.4 or later.
      </P>

      <H3>Rules for one app</H3>
      <P>
        App rules (down, errors, error rate, site down) can be limited to one app when you create them, for example a stricter error rule
        for your main app, while the default rule covers the rest.
      </P>

      <H2 id="maintenance">Snoozing and maintenance</H2>
      <Table
        head={["", "What it does"]}
        rows={[
          ["Snooze", "Holds back one incident's notifications for an hour, a day or a week. It stays open and still resolves; nothing is sent while snoozed."],
          [
            "Maintenance",
            <>
              <strong key="p">Pause alerts</strong> on the Monitoring page for everything, one server (and what runs on it) or one app. While it
              lasts no new incidents open and nothing notifies; a problem still there when it ends alerts then.
            </>,
          ],
        ]}
      />

      <H2>Alert states</H2>
      <Table
        head={["State", "Meaning"]}
        rows={[
          ["pending", "The condition is true but hasn't held for the full duration yet."],
          ["firing", "The condition held. Notifications go out."],
          ["acknowledged", "Someone is on it. It stays open until the condition clears."],
          ["resolved", "The condition cleared."],
        ]}
      />
      <P>
        Firing and resolved alerts appear in every admin’s inbox, are emailed to those with alert emails on, and go to any alert channels
        (Slack, Telegram, webhook) that subscribe to them. See <A href="/docs/operations/notifications">Notifications and Audit</A>.
      </P>
    </>
  );
}

export function Logs() {
  return (
    <>
      <P>Read logs from any server without SSH: the systemd journal, a single service, or any container, including apps and databases.</P>

      <H2>Sources</H2>
      <Table
        head={["Source", "Reads"]}
        rows={[
          ["Journal", "All units, or one unit such as nginx.service, read as JSON so every line keeps its unit and priority."],
          ["Container", "A container's stdout and stderr, merged by timestamp."],
          ["Application", "The current release of an app, with its state and restart count: container output, the public service of a Compose app, or the journal of a systemd app."],
        ]}
      />

      <H2>Following</H2>
      <P>
        Follow mode polls for new lines. The journal is followed with its cursor and containers with a timestamp, so no line is skipped or
        shown twice.
      </P>

      <H2>Limits</H2>
      <Ul>
        <li>Up to 1,000 lines per read; the newest lines are kept when output is large.</li>
        <li>Very long lines are truncated at 2,000 characters.</li>
        <li>Reads are jobs whose output is encrypted at rest and deleted after an hour.</li>
        <li>Opening a log is audited once per session, not on every poll.</li>
      </Ul>

      <H2>On the server</H2>
      <P>VPSPilot’s own services log to the journal:</P>
      <CodeBlock
        code={`
journalctl -u vpspilot-agent -f
journalctl -u vpspilot-helper -f`}
      />
    </>
  );
}

export function Notifications() {
  return (
    <>
      <H2>Notifications</H2>
      <P>
        The bell in the dashboard collects deployment results and alert changes for every admin. Notifications are kept for 90 days.
      </P>
      <Table
        head={["Event", "In-app", "Email setting"]}
        rows={[
          ["Deployment succeeded", "Yes", "Deploy success (on by default)"],
          ["Deployment failed", "Yes", "Deploy failure (on by default)"],
          ["Alert firing / resolved", "Yes", "Alerts (on by default)"],
        ]}
      />
      <P>
        Each admin chooses their own email settings in <strong>Settings → Notifications</strong>. Email is delivered through Resend; see{" "}
        <A href="/docs/reference/configuration">Configuration</A>.
      </P>

      <H2>Alert channels</H2>
      <P>
        Channels send alerts and deployment results to your team&apos;s chat or your own endpoint, shared by every admin. Add them in{" "}
        <strong>Settings → Notifications → Alert channels</strong>, pick the events each one receives (alert fired, alert resolved,
        deployment failed, deployment succeeded) and use <strong>Send test</strong> to check it.
      </P>
      <Table
        head={["Type", "You provide", "Notes"]}
        rows={[
          ["Slack", "An incoming webhook URL", "Mattermost and other Slack-compatible incoming webhooks work too."],
          ["Telegram", <>A bot token from <C key="b">@BotFather</C> and a chat ID</>, "Add the bot to the group or channel first."],
          ["Webhook", "Any URL", "A JSON POST, signed with a secret shown once when you create it."],
        ]}
      />
      <P>
        Destinations are stored encrypted. Channels can&apos;t point at the control plane&apos;s own host or link-local addresses, and
        redirects aren&apos;t followed; private network addresses are fine. Each channel shows when it last delivered, or why it failed.
      </P>
      <H3 id="telegram-commands">Telegram commands</H3>
      <P>
        Turn on <strong>Commands</strong> for a Telegram channel and its bot answers, in that chat only:
      </P>
      <Table
        head={["Command", "Answer"]}
        rows={[
          [<C key="s">/status</C>, "Each server: online or offline, CPU, memory and disk."],
          [<C key="a">/apps</C>, "Each app: up, down (and why), or not deployed."],
          [<C key="l">/alerts</C>, "Open alerts with their details."],
          [<C key="h">/help</C>, "The list of commands."],
        ]}
      />
      <P>
        Commands only read; nothing can be changed from Telegram. Messages from any other chat are ignored. VPSPilot fetches the bot&apos;s
        messages itself (long polling), so it needs no public webhook, but the bot can&apos;t be used by another program at the same time.
      </P>

      <H3>Verifying webhook signatures</H3>
      <P>
        Each request carries <C>X-VPSPilot-Event</C> and <C>X-VPSPilot-Signature: sha256=…</C>, the HMAC-SHA256 of the raw body with the
        channel&apos;s secret:
      </P>
      <CodeBlock
        lang="text"
        title="verify.py"
        code={`
import hashlib, hmac

def verified(body: bytes, header: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)`}
      />
      <CodeBlock
        lang="json"
        title="body"
        code={`
{
  "event": "alert.firing",
  "sent_at": "2026-10-14T09:00:42+00:00",
  "title": "Memory pressure: web-1",
  "detail": "Memory averaged 92% over 10 min (limit 90%)",
  "severity": "warning",
  "url": "https://pilot.example.com/dashboard/monitoring"
}`}
      />

      <H2>Audit log</H2>
      <P>Every change made through VPSPilot is recorded with:</P>
      <Ul>
        <li>
          <strong>Who</strong>: the user, or the system for automated actions such as push deploys and scheduled backups.
        </li>
        <li>
          <strong>What</strong>: an action such as <C>app.deploy</C> or <C>database.credentials.view</C>, its target and its result.
        </li>
        <li>
          <strong>Where from</strong>: the client IP address.
        </li>
        <li>
          <strong>Correlation</strong>: an id that ties the entry to the job it started.
        </li>
      </Ul>
      <P>The log is append-only from the API. Read it in the dashboard or page through it with the API:</P>
      <CodeBlock code={`curl "https://pilot.example.com/api/v1/audit-logs?limit=50&action=server.revoke" \\\n  -H "Authorization: Bearer $TOKEN"`} />
    </>
  );
}

export function Troubleshooting() {
  return (
    <>
      <H2>A server shows offline</H2>
      <P>A server is offline when no heartbeat arrived in 35 seconds. On the server:</P>
      <CodeBlock
        code={`
systemctl status vpspilot-agent vpspilot-helper
journalctl -u vpspilot-agent -n 100
sudo -u vpspilot python3 -m vpspilot_agent status --config /etc/vpspilot/agent.json`}
      />
      <Ul>
        <li>
          <strong>Connection refused or timeouts</strong>: the server can’t reach <C>AGENT_API_URL</C>. Check DNS, firewalls and that the proxy
          routes <C>/agent/*</C> to the API.
        </li>
        <li>
          <strong>Agent exited with status 78</strong>: its credential was revoked or the server deleted. Enroll it again with a new token.
        </li>
        <li>
          <strong>Clock skew</strong>: keep time in sync with <C>systemd-timesyncd</C> or chrony.
        </li>
      </Ul>

      <H2>The control plane installer fails</H2>
      <Table
        head={["Message", "Fix"]}
        rows={[
          ["Port 80 (or 443) is in use", <>Another web server holds it. See <A key="n" href="/docs/getting-started/install#nginx-or-apache-already-running">nginx or Apache already running</A>.</>],
          ["The API didn't come up", <>Read <C key="l">sudo vpspilot logs api</C>. Re-running the installer is safe.</>],
          ["The dashboard has no certificate", "DNS for the domain must point at this server, and ports 80/443 must be open in your provider's firewall."],
        ]}
      />

      <H2>The agent installer fails</H2>
      <Table
        head={["Message", "Fix"]}
        rows={[
          ["Enrollment token is invalid or already used", "Tokens are single use. Create a new enrollment."],
          ["Enrollment token has expired", "Tokens last 15 minutes. Create a new one and run the command right away."],
          ["Unsupported OS", "Only Ubuntu and Debian are supported."],
          ["Run as root", <>Pipe into <C key="s">sudo bash</C>, as in the generated command.</>],
        ]}
      />

      <H2>A deployment failed</H2>
      <P>Open the deployment: the log shows the stage that failed.</P>
      <Table
        head={["Symptom", "Likely cause"]}
        rows={[
          ["Docker isn't installed on this server", <>Install Docker Engine, for example with <C key="d">apt install docker.io</C>, then redeploy.</>],
          ["No Dockerfile, and this doesn't look like…", "Add a Dockerfile, set build and start commands, or deploy an image."],
          ["Health check failed after 60s", "The app isn't listening on the container port, binds to 127.0.0.1 instead of 0.0.0.0, or the health path returns 4xx/5xx."],
          ["The container exited", "The process crashed on start. The log includes the container's last output."],
          ["Port … is already used by the container …", "Another container holds the host port. Pick another port in the app's settings, or stop that container."],
          [<>connection to server at &quot;localhost&quot; … refused</>, <>Inside a container, <C key="h">localhost</C> is the container. Point the app at a managed database (<C key="v">vpdb-&lt;name&gt;</C>) or run it as a systemd app.</>],
          ["The app is up but answers HTTP 404 on /", <>Your app has no page at the health check path (common for APIs). Set it in the app&apos;s settings to a route that returns 200, such as <C key="h">/health</C>.</>],
          ["Health check failed (no response, systemd apps)", <>The app must listen on <C key="p">$PORT</C> on <C key="z">0.0.0.0</C>.</>],
          ["Service … uses privileged mode (Compose)", "The compose file uses a setting VPSPilot refuses. See Applications → Compose apps."],
          ["No space left on device", <>Check <C key="d">df -h</C> and <C key="s">docker system df</C>. Remove old images with <C key="p2">docker image prune</C>; agents 1.1.0+ clean up after failed deployments.</>],
        ]}
      />
      <Callout type="tip">
        <p>
          Most frameworks listen on <C>PORT</C>. Make sure yours binds to <C>0.0.0.0</C>, not <C>localhost</C>, inside the container.
        </p>
      </Callout>

      <H2>A certificate isn’t issued</H2>
      <Ul>
        <li>
          DNS status must be <strong>ok</strong>. Behind a CDN proxy, use TLS mode <C>off</C> and let the CDN terminate TLS.
        </li>
        <li>Ports 80 and 443 must be open in the server’s firewall and your provider’s security group.</li>
        <li>
          Check the proxy’s own log with <C>docker logs vpspilot-proxy</C>.
        </li>
      </Ul>

      <H2>Emails don’t arrive</H2>
      <Ul>
        <li>
          Without <C>RESEND_API_KEY</C>, emails are written to the API log instead of being sent (<C>sudo vpspilot logs api</C>). After adding
          the key to <C>.env</C>, run <C>sudo vpspilot restart</C>.
        </li>
        <li>
          Resend’s test sender only delivers to your own Resend account address. Set <C>EMAIL_OVERRIDE_TO</C> to it while testing, or verify
          a domain and set <C>EMAIL_FROM</C>.
        </li>
      </Ul>

      <H2>Locked out</H2>
      <P>
        After 5 wrong passwords the account is locked for 15 minutes. If you lost your authenticator, sign in with a recovery code. If you
        have neither, someone with root on the control plane&apos;s server can create a new admin with <C>sudo vpspilot admin EMAIL</C> (or{" "}
        <C>uv run poe createadmin</C> on a manual install).
      </P>
    </>
  );
}
