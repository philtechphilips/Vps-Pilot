# Security policy

This is VPSPilot's dashboard. It signs people in to a control plane that
holds credentials for their servers and databases, so reports are welcome
and taken seriously.

## Reporting a vulnerability

Please report privately through GitHub:
**[Report a vulnerability](https://github.com/philtechphilips/Vps-Pilot/security/advisories/new)**
(this repository's *Security* tab). Don't open a public issue.

Include what you found, how to reproduce it and what it lets an attacker do.
You'll get a reply within a week. Once a fix is released we'll publish an
advisory and credit you, unless you'd rather not be named.

## Supported versions

Fixes go into the latest release on `main`; `sudo vpspilot upgrade` on the
control plane rebuilds the dashboard.

## Scope

In scope: this repository. Especially interesting:

- script injection (XSS) through anything a server, an app, a repository or
  another user can put on screen;
- tricking a signed-in admin into an action they didn't mean (clickjacking,
  cross-site requests);
- leaking access tokens or secrets to other origins.

The API, agent and installer live in
[VPS-PIlot-BE](https://github.com/philtechphilips/VPS-PIlot-BE) and have
their own policy. Out of scope: reports that need someone who is already an
admin, and automated scanner output without a way to exploit it.

## How the code is kept safe

Every push and a weekly scheduled run type-check, lint and build the
dashboard and scan it with [Trivy](https://trivy.dev): dependencies,
committed secrets, the Dockerfile and the built image. High and critical
issues with a fix fail the build. Dependabot opens pull requests for updates
weekly. Pages are served with a Content Security Policy and anti-framing
headers.
