import { A, C, Callout, H2, H3, P, Table, Ul } from "@/components/docs/prose";

export function SecurityChecks() {
  return (
    <>
      <P>
        Every deploy, VPSPilot checks what the app is made of: the packages its lockfiles pin, the OS packages inside its container, files in
        its repository that look like secrets, and whether its runtime still gets security fixes. Results are on each app&apos;s page under{" "}
        <strong>Security</strong> and, for every app at once, on the <A href="/dashboard/security">Security</A> page. Needs agent 1.1.7 or later.
      </P>

      <H2>What is checked</H2>
      <Table
        head={["Check", "Read from", "Looked up in"]}
        rows={[
          [
            "Dependencies",
            <>
              <C key="a">package-lock.json</C>, <C key="b">pnpm-lock.yaml</C>, <C key="c">yarn.lock</C>, <C key="d">bun.lock</C>, <C key="e">uv.lock</C>,{" "}
              <C key="f">poetry.lock</C>, <C key="g">Pipfile.lock</C>, pinned <C key="h">requirements.txt</C>, <C key="i">go.mod</C>,{" "}
              <C key="j">Cargo.lock</C>, <C key="k">composer.lock</C>, <C key="l">Gemfile.lock</C>: at the repository root, the build context and
              folders one level down
            </>,
            "OSV.dev",
          ],
          ["OS packages", "The running container (Debian, Ubuntu, Alpine). Only issues the distro has already fixed count.", "OSV.dev"],
          ["Committed secrets", "Files git tracks: private keys, cloud and API tokens, .env files with real values", "Nothing: it stays on the server"],
          ["End of life", "The Node.js or Python version of the build and the container's distro", "endoflife.date"],
        ]}
      />
      <P>
        Lockfiles are re-checked against OSV.dev every day, so an advisory published after the deploy still shows up. To scan again now (after
        changing a lockfile on the server, for example), use <strong>Scan now</strong> on the app&apos;s page.
      </P>
      <Callout type="security" title="What leaves your servers">
        <p>
          Only package names and versions go to <A href="https://osv.dev">OSV.dev</A>, the open database behind GitHub&apos;s and the Linux
          distros&apos; advisories. To keep even those private, turn off <strong>Vulnerability Checks</strong> in Settings → Security; the
          secret scan keeps working. The secret scan reports the file, the line and the kind of secret, never the value.
        </p>
      </Callout>

      <H2>Reading the results</H2>
      <P>
        Advisories for the same package and version are one row, with the release that fixes all of them. Open a row for each advisory, its
        severity and a link to its page. Upgrade the package, commit the lockfile and deploy. Something that doesn&apos;t apply to you (a
        vulnerable function your app never calls) can be ignored: it stops counting for alerts and stays ignored on later checks.
      </P>
      <P>
        Vulnerable OS packages come from the base image. They are fixed by rebuilding: redeploy, or tick <strong>Rebuild weekly</strong> under
        Security on the app&apos;s page to redeploy the live version every week and pick up fixes as the distro publishes them.
      </P>
      <H3>Committed secrets</H3>
      <P>
        A secret in the repository is in its history and in every clone, even after the file is deleted. Move it to the app&apos;s{" "}
        <A href="/docs/deployments/environment">environment variables</A>, then rotate it with whoever issued it. Deploys also point them out in
        the build log.
      </P>

      <H2>Alerts</H2>
      <Table
        head={["Rule", "Fires when"]}
        rows={[
          ["Vulnerable dependencies", "An app has at least this many critical or high vulnerabilities with a fixed release (default 1)"],
          ["Secrets in the repository", "The repository has files that look like secrets"],
          ["Runtime end of life", "The app's Node.js, Python or distro stops getting security fixes within this many days (default 30), or already has"],
          ["Agent out of date", "A server's agent has been older than the control plane's for three days"],
        ]}
      />
      <P>
        They work like every other rule: see <A href="/docs/operations/monitoring">Monitoring and Alerts</A>. The weekly report has a
        Security section with the same.
      </P>

      <H2>Account and team changes</H2>
      <P>These go to the audit log, every admin&apos;s inbox, alert channels with <strong>Security</strong> ticked and, by email, the account they&apos;re about:</P>
      <Ul>
        <li>a sign-in from an address the account hasn&apos;t used in 180 days;</li>
        <li>a recovery code used to sign in;</li>
        <li>a password changed or reset;</li>
        <li>an account locked after repeated wrong passwords;</li>
        <li>an authenticator app set up;</li>
        <li>a role changed or an admin added, from the dashboard or the server&apos;s command line.</li>
      </Ul>
    </>
  );
}
