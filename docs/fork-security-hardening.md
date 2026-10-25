# Evaluate this fork's security hardening

This branch updates Zod to 4.6.6, pins the checkout's transitive `fast-uri` to
3.1.9, refuses non-loopback HTTP listeners, and limits inherited variables for
process captures. It is a source patch to this fork, not a published npm release.
`npx rea-agents@latest` still downloads the upstream package and does not select
these changes.

## Build the patched checkout

Use an isolated environment for the first evaluation, with a supported Node.js
runtime and npm. The repository pins its development tools in `.nvmrc` and
`package.json#packageManager`.

```sh
git clone --branch codex/security-hardening https://github.com/TheMissingElephant/Reverse-Engineering.git
cd Reverse-Engineering
npm ci --ignore-scripts
npm run build:cached
node scripts/rea.mjs --version
```

`--ignore-scripts` skips dependency lifecycle hooks, including Frida's native
download/build. Frida instrumentation may therefore be unavailable; static
analysis and other providers do not require it. The `fast-uri` override is
enforced for this checkout by npm and its lockfile; npm does not apply a
dependency package's overrides when another project consumes that package.

To inspect a registration plan for Codex, run the local launcher directly:

```sh
node scripts/rea.mjs setup --client codex --dry-run --json
```

Review the proposed configuration and skill changes. If you choose to apply
them, use `node scripts/rea.mjs setup --client codex` and approve that plan.
Restart the selected client afterward. Calling the local launcher directly
preserves a registration pointing to this checkout; a package-runner invocation
can instead register a published npm package. Keep the checkout in place while
using its registration.

## Compatibility changes

- `rea mcp --http --host 0.0.0.0`, wildcard IPv6, and LAN binds now fail before
  the MCP server is constructed. Use loopback or the default stdio connection.
  Environment replay servers use the same listener restriction.
- Process captures inherit only basic host settings and standard locale
  categories. Set required application variables explicitly in the scenario's
  `environment`; those overrides are recorded in Evidence, so avoid secrets.
  New comparison contracts include `process_environment_version: "minimal-host-v1"`
  and do not claim the same environment policy as older captures.

## Remaining boundaries

These changes do not sandbox target programs. Debugger consoles, Frida scripts,
device operations, and other runtime tools retain their documented effects and
can execute or modify software with your user permissions. Other provider
workflows can retain their selected environment. Keep the client's approval
controls enabled and use a disposable VM for unknown software.

Loopback HTTP still has no client authentication or TLS and does not isolate
other local processes or users. Prefer the normal dedicated stdio connection.
External providers, native binaries, and dependencies remain separate trust
decisions; a clean advisory report does not certify them as safe.
