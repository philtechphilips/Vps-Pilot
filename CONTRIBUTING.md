# Contributing to the VPSPilot Dashboard

Thanks for helping. Issues, larger proposals and the API side of a change
belong in [VPS-PIlot-BE](https://github.com/philtechphilips/VPS-PIlot-BE),
which has the main [contributing guide](https://github.com/philtechphilips/VPS-PIlot-BE/blob/main/CONTRIBUTING.md).
A change that needs both repositories gets a pull request in each, linked to
each other. Security issues go through [SECURITY.md](SECURITY.md), never a
public issue.

## Setting up

Run the API locally (its README), then follow [Running it](README.md#running-it).

Next.js 16 changed APIs and conventions. Before writing Next.js code, check
the docs that ship with it in `node_modules/next/dist/docs/`.

## Pull requests

These pass, as in CI:

```bash
npx next typegen && npx tsc --noEmit
npm run lint
npm run build
```

- Colors come from the tokens in `app/globals.css`. Check every screen you
  touch in both the light and the dark theme.
- The dashboard loads nothing from other origins (see the CSP in
  `next.config.ts`). Links to the website go through `lib/site.ts`.
- Keep each pull request to one change, and say what it does and why.

## License

Contributions are licensed under the [Apache License 2.0](LICENSE), like the
rest of the project (section 5 of the license).
