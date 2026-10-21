import { A, C, Callout, CodeBlock, Fields, H2, H3, Ol, P, Table, Ul } from "@/components/docs/prose";

export function Applications() {
  return (
    <>
      <P>
        An application is a long-running service on one server, built from a Git repository or pulled from a registry. Each successful
        deployment becomes a release you can roll back to.
      </P>

      <H2>Runtimes</H2>
      <P>Pick how the app runs when you create it. It can&apos;t be changed later; create a new app to switch.</P>
      <Table
        head={["Runtime", "For", "How it runs"]}
        rows={[
          [
            "Docker",
            "Any repository or image",
            <>A container <C key="c">vp-&lt;name&gt;</C>, built from your Dockerfile or from a detected stack (see <A key="b" href="/docs/deployments/builds">Builds</A>).</>,
          ],
          [
            "systemd",
            "Node.js and Python, no Docker",
            <>A service <C key="s">vp-&lt;name&gt;.service</C> running as its own system user, from a release folder in <C key="f">/srv/vpspilot/&lt;name&gt;</C>.</>,
          ],
          [
            "Compose",
            <>A repository with <C key="y">compose.yaml</C></>,
            <>A Compose project <C key="p">vp-&lt;name&gt;</C>. One service receives traffic; the others (a worker, a cache…) run alongside.</>,
          ],
        ]}
      />
      <P>systemd and Compose apps deploy from Git and need agent 1.1.0 or later on the server.</P>

      <H3>systemd (native) apps</H3>
      <Ul>
        <li>
          The stack is detected the same way as Docker builds (npm, pnpm, Yarn; pip, Poetry, uv, Pipenv). If the server&apos;s Node.js major
          version doesn&apos;t match what the project asks for, the right one is downloaded from nodejs.org and checksum-verified. Python uses the
          server&apos;s <C>python3</C> with a virtualenv per release.
        </li>
        <li>
          <strong>Your app must listen on <C>$PORT</C></strong>, which VPSPilot sets to the app&apos;s public port. Bind to{" "}
          <C>0.0.0.0</C> so the domain proxy can reach it.
        </li>
        <li>
          Builds run as the app&apos;s own user in a sandboxed, time-limited systemd unit; your repository&apos;s scripts never run as root.
        </li>
        <li>
          Each release is a new folder; files written there are gone after the next deploy. Keep uploads and SQLite files in{" "}
          <C>$VPSPILOT_SHARED_DIR</C>, which survives releases.
        </li>
        <li>
          The service is hardened (read-only system, private <C>/tmp</C>, no new privileges). Logs go to the systemd journal.
        </li>
      </Ul>

      <H3>Compose apps</H3>
      <Ul>
        <li>
          VPSPilot finds <C>compose.yaml</C> (or <C>docker-compose.yml</C>) in the root directory, or the file you name. With more than one
          service, name the <strong>public service</strong> that receives traffic and its port.
        </li>
        <li>
          Refused for safety: privileged mode, added capabilities, devices, host networking or namespaces, security options, bind mounts
          outside the repository, the Docker socket, and external volumes or networks.
        </li>
        <li>
          Published <C>ports:</C> and fixed <C>container_name</C> values are ignored (with a warning), since they would clash with other apps.
          VPSPilot publishes the public service itself and joins it to the private network as <C>vp-&lt;name&gt;</C>.
        </li>
        <li>
          The app&apos;s variables are available for <C>{"${VAR}"}</C> substitution in the file and are set on the public service. Named volumes
          keep their data across deploys and aren&apos;t deleted when the app is removed.
        </li>
      </Ul>

      <H2>Sources</H2>
      <H3>Git repository</H3>
      <P>
        Pick a repository from your connected <A href="/docs/deployments/github">GitHub App</A>, or paste any public HTTPS clone URL. Choose a
        branch, which defaults to <C>main</C>. Each deploy makes a shallow checkout of that branch, or of a specific branch, tag or commit you
        ask for.
      </P>
      <H3>Container image</H3>
      <P>
        Give an image reference such as <C>ghcr.io/acme/api:1.4.2</C>. VPSPilot pulls it and runs it; there is no build step. Deploying a
        different tag is a deploy with a new image reference.
      </P>

      <H2>Settings</H2>
      <Fields
        rows={[
          ["name", "string", "Lowercase letters, digits and dashes, up to 40 characters. Becomes the container (or service) name vp-<name>."],
          ["runtime", "docker · systemd · compose", "How the app runs (see above). Set at creation."],
          ["compose_file / compose_service", "path / name", "Compose apps: the file, and the service that receives traffic."],
          ["container_port", "1–65535", <>The port your process listens on inside the container. Also exported as <C>PORT</C>.</>],
          ["host_port", "1024–65535", "Port published on the server. Assigned from 20000 upward when left empty."],
          ["dockerfile", "path · Dockerfile", "Path to the Dockerfile, relative to the repository root."],
          ["build_context", "path · .", "Directory sent to the Docker build. Useful for monorepos."],
          ["build_command / start_command", "string", <>Override what the buildpack detected. Ignored when a Dockerfile is used.</>],
          ["health_path", "path · /", "Requested on the candidate container before release. Any status below 400 passes."],
          ["health_timeout_seconds", "5–600 · 60", "How long the candidate has to become healthy."],
          ["cpu_limit", "e.g. 0.5, 2", "CPU cores the container may use."],
          ["memory_limit", "e.g. 512m, 2g", "Hard memory limit."],
          ["auto_deploy", "bool · true", "Deploy on every push to the branch (GitHub apps only)."],
        ]}
      />

      <H2>Networking</H2>
      <P>
        The app joins the private <C>vpspilot</C> Docker network, where the domain proxy reaches it as{" "}
        <C>vp-&lt;name&gt;:&lt;container_port&gt;</C> and where it can reach managed databases by name. Its host port is also published on all
        interfaces, which is handy for testing.
      </P>
      <Callout type="warning" title="Close host ports you don't need">
        <p>
          Once an app has a domain, traffic goes through Caddy on 80 and 443. Use a firewall such as <C>ufw</C> to block the app’s host port
          from the internet if you don’t want it reachable directly.
        </p>
      </Callout>

      <P>
        systemd apps listen directly on their public port on the server; the domain proxy reaches them through the private network&apos;s
        gateway (and VPSPilot opens that path in <C>ufw</C> if it&apos;s on).
      </P>

      <H2>Apps keep running</H2>
      <P>
        Containers run with Docker’s <C>unless-stopped</C> restart policy and systemd apps with <C>Restart=always</C>, so they survive
        reboots and restart after crashes. The <A href="/docs/operations/monitoring">Application down</A> alert tells you if one stays down.
      </P>

      <Callout type="warning" title="localhost inside a container is the container">
        <p>
          A Docker or Compose app that connects to <C>localhost:5432</C> reaches itself, not a database on the server. Use a managed database
          (reachable by name, e.g. <C>vpdb-main</C>) and attach it, or a systemd app, which does share the server&apos;s localhost.
        </p>
      </Callout>
    </>
  );
}

export function Builds() {
  return (
    <>
      <P>
        Every Git deployment ends up as a Docker image tagged with its commit. If the repository has a Dockerfile at the configured path,
        VPSPilot builds it as-is. Otherwise it inspects the checkout and writes a Dockerfile for the stack it finds.
      </P>

      <H2>Detection order</H2>
      <Ol>
        <li>
          <C>package.json</C>: Node.js, or Bun when it is the package manager.
        </li>
        <li>
          <C>requirements.txt</C>, <C>pyproject.toml</C>, <C>Pipfile</C>, <C>setup.py</C>, <C>uv.lock</C> or <C>poetry.lock</C>: Python.
        </li>
        <li>
          <C>go.mod</C>: Go.
        </li>
        <li>
          <C>Cargo.toml</C>: Rust.
        </li>
        <li>
          <C>index.html</C>: a static site.
        </li>
        <li>
          <C>main.py</C> or <C>app.py</C>: Python without a manifest.
        </li>
      </Ol>
      <P>If nothing matches, the deploy fails and asks you to add a Dockerfile or deploy a container image.</P>

      <H2>Node.js and Bun</H2>
      <Table
        head={["Concern", "How it's decided"]}
        rows={[
          ["Package manager", <>The <C key="a">packageManager</C> field, then the lockfile: bun, pnpm, Yarn, otherwise npm.</>],
          ["Node version", <><C key="a">engines.node</C> or <C key="b">.nvmrc</C>; defaults to 22.</>],
          ["Build", <>The <C key="a">build</C> script, when there is one.</>],
          [
            "Start",
            <>
              A <C key="a">Procfile</C> <C key="b">web:</C> line, then the <C key="c">start</C> script, then framework defaults (Nuxt, SvelteKit),
              then <C key="d">main</C> or <C key="e">server.js</C> / <C key="f">index.js</C>.
            </>,
          ],
          ["Static builds", "Vite, Create React App, Astro and Angular builds are served from their output directory."],
        ]}
      />
      <P>Recognised frameworks: Next.js, Nuxt, Remix, SvelteKit, Astro, NestJS, Angular, Create React App, Vite, Fastify, Hono, Express and Koa.</P>
      <Callout type="security" title="Security releases">
        <p>
          Every build fetches the newest base image (<C>node:22</C>, <C>python:3.12</C>…), and systemd apps get the newest release of
          their Node.js major from nodejs.org, so redeploying picks up runtime security fixes. Needs agent 1.1.1 or later.
        </p>
      </Callout>

      <H2>Python</H2>
      <Table
        head={["Concern", "How it's decided"]}
        rows={[
          ["Installer", "uv, Poetry, Pipenv or pip, from the lockfile or manifest present."],
          ["Version", <><C key="a">.python-version</C> or <C key="b">runtime.txt</C>; defaults to 3.12.</>],
          [
            "Start",
            <>
              A <C key="a">Procfile</C> <C key="b">web:</C> line; Django runs under gunicorn; FastAPI under uvicorn; Flask under gunicorn; otherwise{" "}
              <C key="c">python main.py</C>, <C key="d">app.py</C> or <C key="e">server.py</C>.
            </>,
          ],
        ]}
      />

      <H2>Go, Rust and static sites</H2>
      <Ul>
        <li>
          <strong>Go</strong> builds the main package in the root or <C>cmd/&lt;name&gt;</C> into a static binary (Go 1.23 by default).
        </li>
        <li>
          <strong>Rust</strong> builds with Cargo in release mode.
        </li>
        <li>
          <strong>Static sites</strong> are served by a tiny busybox web server on <C>$PORT</C>.
        </li>
      </Ul>

      <H2>Overriding commands</H2>
      <P>Set a build or start command on the app when detection gets it wrong. Both are single-line shell commands run inside the container:</P>
      <CodeBlock
        lang="text"
        title="example overrides"
        code={`
build_command:  pnpm turbo run build --filter=web
start_command:  node apps/web/server.js`}
      />

      <H2>Build-time variables</H2>
      <P>
        Non-secret environment variables are passed to the build as Docker build arguments, so values like <C>NEXT_PUBLIC_API_URL</C> are
        available while building. Secret variables are only given to the running container.
      </P>
      <Callout type="security">
        <p>
          Repository content is untrusted. Files are read with size limits and only inside the checkout, and anything copied from them into the
          generated Dockerfile must match strict patterns.
        </p>
      </Callout>
    </>
  );
}

export function Environment() {
  return (
    <>
      <P>
        Each application has up to 100 environment variables. They are encrypted at rest and written to a private file for the container on
        each deploy, so changes take effect on the next deployment.
      </P>

      <H2>Plain and secret variables</H2>
      <Table
        head={["", "Plain", "Secret"]}
        rows={[
          ["Shown in the dashboard", "Yes", "Never again after saving"],
          ["Available while building", "Yes, as a build argument", "No"],
          ["Available at runtime", "Yes", "Yes"],
          ["Encrypted at rest", "Yes", "Yes"],
        ]}
      />
      <P>
        Keys must start with a letter or underscore and contain only letters, digits and underscores. When you edit the list, send a secret
        without a value to keep its stored value unchanged.
      </P>

      <H2>Variables VPSPilot sets</H2>
      <Table
        head={["Variable", "Value"]}
        rows={[
          [<C key="p">PORT</C>, "The port to listen on: the container port for Docker apps, the public port for systemd apps. Reserved: you can't set it yourself."],
          [<C key="s">VPSPILOT_SHARED_DIR</C>, "systemd apps: a folder that survives releases, for uploads and other files."],
          [<C key="h">HOST / HOSTNAME</C>, <>systemd apps: <C key="z">0.0.0.0</C>, so frameworks that read them bind to every interface.</>],
          [<C key="d">DATABASE_URL</C>, <>Added when you attach a database (the name is configurable). See <A key="a" href="/docs/databases/users">Users and Attaching</A>.</>],
        ]}
      />

      <H2>Updating through the API</H2>
      <CodeBlock
        lang="http"
        code={`
PATCH /api/v1/applications/{app_id}
{
  "env": [
    { "key": "NODE_ENV", "value": "production" },
    { "key": "STRIPE_SECRET_KEY", "value": "sk_live_...", "secret": true },
    { "key": "SESSION_SECRET", "secret": true }
  ]
}`}
      />
      <P>
        The list replaces the whole environment. <C>SESSION_SECRET</C> above has no value, so its stored value is kept.
      </P>
    </>
  );
}

export function Lifecycle() {
  return (
    <>
      <P>
        A deployment never replaces a working release with a broken one. The new version is started next to the old one and checked before
        it takes over.
      </P>

      <H2>Stages</H2>
      <CodeBlock
        lang="text"
        title="app.deploy"
        code={`
fetch      shallow git checkout (or docker pull for image apps)
build      docker build → vpspilot/<app>:<commit>-<deployment>
candidate  start vp-<app>-candidate on a random loopback port
health     GET <health_path> until < 400, the container exits, or the timeout
release    stop the live container, start the new one on the host port
verify     if the new container fails, restore the previous one`}
      />
      <Ul>
        <li>
          <strong>Failed before release</strong>: the live version is untouched and keeps serving. The deployment is marked failed with the
          build or health-check output.
        </li>
        <li>
          <strong>Failed after release</strong>: the previous container is renamed back and started, and the deployment is marked failed.
        </li>
        <li>
          <strong>Succeeded</strong>: the deployment becomes the app’s current release. The last five images are kept for rollbacks.
        </li>
      </Ul>
      <Callout type="note">
        <p>
          The switch from the old container to the new one takes a few seconds while the host port moves over. Plan deploys of
          latency-sensitive services accordingly.
        </p>
      </Callout>

      <H3>systemd apps</H3>
      <CodeBlock
        lang="text"
        title="app.deploy (systemd)"
        code={`
fetch      shallow git checkout
build      copy into /srv/vpspilot/<app>/releases/<deployment>, install and build
           as the app's user in a sandboxed systemd unit
candidate  run the release on a spare port ($PORT) as a transient unit
health     GET <health_path> until < 400, the process exits, or the timeout
release    point "current" at the new release, restart vp-<app>.service
verify     if it fails, point "current" back at the previous release`}
      />
      <P>The last five releases are kept for rollbacks; a release that never went live is deleted.</P>

      <H3>Compose apps</H3>
      <CodeBlock
        lang="text"
        title="app.deploy (compose)"
        code={`
fetch      shallow git checkout, copied into a release folder
check      docker compose config, then refuse unsafe settings
build      images tagged per release
release    docker compose up -d, then GET <health_path> on the public service
verify     if it fails, bring the previous release back up`}
      />
      <P>
        Compose apps have no candidate stage, so changed services restart in place during the release. The previous release is restored if
        the health check fails.
      </P>

      <H3>Failed deployments clean up</H3>
      <P>
        An image or release built by a deployment that never went live is removed, together with leftover build layers, so failing pushes
        don&apos;t fill the server&apos;s disk.
      </P>

      <H2>Triggers</H2>
      <Table
        head={["Trigger", "Started by"]}
        rows={[
          ["manual", "Deploy button or POST /applications/{id}/deployments, optionally with a ref."],
          ["push", "A GitHub push to the app's branch when auto-deploy is on."],
          ["rollback", "Rolling back to an earlier deployment."],
        ]}
      />

      <H2>Rollbacks</H2>
      <P>
        A rollback re-releases the image of an earlier successful deployment (for systemd and Compose apps, its kept release). It doesn’t
        rebuild, so it is fast and gives you exactly what ran before. It goes through the same health check as any deploy.
      </P>
      <CodeBlock code={`curl -X POST https://pilot.example.com/api/v1/deployments/$DEPLOYMENT_ID/rollback \\\n  -H "Authorization: Bearer $TOKEN"`} />
      <P>Only successful deployments whose image or release is still on the server can be rolled back to (the last five are kept).</P>

      <H2>Deployment statuses</H2>
      <Table
        head={["Status", "Meaning"]}
        rows={[
          ["queued", "Waiting for the server's agent to claim it."],
          ["running", "In progress. Events stream to the deployment page."],
          ["succeeded", "Released and serving."],
          ["failed", "Stopped with an error; see the log for the stage that failed."],
          ["canceled", "Canceled before it started."],
        ]}
      />
    </>
  );
}

export function GitHub() {
  return (
    <>
      <P>
        VPSPilot connects to GitHub through a GitHub App that your install creates for itself, using GitHub’s app manifest flow. There is no
        shared OAuth app, and the app’s credentials never leave your control plane.
      </P>

      <H2>Connect</H2>
      <Ol>
        <li>
          Open <strong>Settings → GitHub</strong> and choose your personal account or an organization.
        </li>
        <li>GitHub creates the app from VPSPilot’s manifest and redirects back. VPSPilot stores its private key, encrypted.</li>
        <li>Install the app on your account or organization and pick which repositories it may access.</li>
      </Ol>
      <P>The app asks for read-only access to code and metadata: enough to list repositories, clone them and receive push events.</P>

      <H2>Deploy on push</H2>
      <P>
        GitHub sends push events to <C>/api/v1/github/webhook</C>. VPSPilot checks the signature and deploys every app linked to that
        repository and branch that has auto-deploy on.
      </P>
      <Callout type="warning" title="Webhooks need a public HTTPS URL">
        <p>
          Set <C>PUBLIC_API_URL</C> to the https URL GitHub can reach. When it is empty, <C>AGENT_API_URL</C> is used if it is https. Without
          either, repositories still deploy manually but pushes are not received.
        </p>
      </Callout>

      <H2>Per-deployment tokens</H2>
      <P>
        For each deployment of a linked repository, VPSPilot mints a short-lived installation token scoped to that single repository with
        read-only access, and hands it only to the agent running the deploy. The token is never stored.
      </P>

      <H2>Disconnect</H2>
      <P>
        Disconnecting removes the app’s credentials from VPSPilot. Existing applications keep running, but they can’t be redeployed from
        private repositories until you connect again. Delete the app on GitHub as well if you no longer need it.
      </P>
    </>
  );
}
