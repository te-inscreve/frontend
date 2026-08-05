# `types` export resolves to source instead of `dist`

**Open in:** `@te-inscreve/api`, `@te-inscreve/validators`
**Fixed in:** `@te-inscreve/rest` (see [the fix](#the-fix))
**Impact:** low today — no runtime effect. It removes a compile-time guarantee.

## What happens

`package.json` points the `types` condition at a file `tsc` never writes:

```jsonc
// packages/api/package.json
"exports": {
    ".": {
        "types": "./dist/index.d.ts",   // ← does not exist
        "default": "./src/index.ts"
    }
}
```

The build emits `dist/src/index.d.ts` instead, one directory deeper.

TypeScript does not report this. It skips the broken condition and falls through
to `default`, which is the raw source:

```text
File '.../@te-inscreve/api/dist/index.d.ts' does not exist.
File '.../@te-inscreve/api/src/index.ts' exists - use it as a name resolution result.
```

So consumers typecheck against source. Meanwhile `dist/` still gets built before
every `typecheck` and `lint` (turbo's `dependsOn: ["^build"]`) and cached
(`outputs: ["dist/**"]`) — and nothing reads it.

## Why the path is wrong

TypeScript infers `rootDir` as the common ancestor of every included file. These
packages include files that sit at the package root:

```jsonc
// packages/api/tsconfig.json
"include": ["src", "eslint.config.ts"]
```

`eslint.config.ts` drags the common ancestor up from `src` to the package root.
Every emitted file shifts down a level to match:

```text
dist/
├── eslint.config.d.ts    ← junk, nobody imports this
└── src/
    └── index.d.ts        ← the real barrel, at the wrong path
```

`packages/rest` had the same problem with an extra file, `env.ts`.

## What it costs

A broken barrel export stops being a build error.

Consumers read source directly, so the `exports` map is never enforced. Delete a
name from `src/index.ts` and every importer still resolves it through the source
tree. The package's public surface — the whole point of the barrel — is not
checked by anything.

Proven on `packages/rest` before the fix: removing `matchHttpError` from the
barrel and rebuilding left the monorepo typechecking clean. After the fix, the
same edit fails:

```text
src/rest-credentials.ts(7,10): error TS2305:
  Module '"@te-inscreve/rest"' has no exported member 'matchHttpError'.
```

## How to check a package

```bash
yarn workspace @te-inscreve/api build && find packages/api/dist -name "index.d.ts"
```

A healthy package prints `packages/api/dist/index.d.ts`. An affected one prints
`packages/api/dist/src/index.d.ts`.

To see which file a consumer actually resolves, run this from any package:

```bash
../../node_modules/.bin/tsc --noEmit --traceResolution | grep "resolved to.*@te-inscreve" | sed "s|.*resolved to '||;s|'.*||" | sort -u
```

From `packages/api` today:

```text
packages/auth/src/index.ts          ← by design, auth is a source-only package
packages/rest/dist/index.d.ts       ← fixed
packages/validators/src/index.ts    ← affected: claims a types path, falls back to source
```

Any package that declares a `types` condition and still shows `src/` here is
affected.

## The fix

Separate what gets typechecked from what gets emitted. Add a build-only config:

```jsonc
// packages/<name>/tsconfig.build.json
{
    "extends": "./tsconfig.json",
    "include": ["src"],
    "compilerOptions": {
        "rootDir": "src",
        "tsBuildInfoFile": "${configDir}/.cache/tsbuildinfo.build.json",
    },
}
```

Then point the build script at it:

```jsonc
"build": "tsc -p tsconfig.build.json"
```

Two details matter:

- **Give it its own `tsBuildInfoFile`.** This config sees a different file set
  than `tsconfig.json`. Sharing one buildinfo thrashes both incremental builds.
- **Leave `tsconfig.json` alone.** It still includes `env.ts` and
  `eslint.config.ts`, so `yarn typecheck` and `yarn lint` keep covering them.
  They only stop being _emitted_, which they never needed — `exports["./env"]`
  points at `env.ts` as source.

`packages/rest/tsconfig.build.json` is the working reference.

## Why `auth` and `ui` are unaffected

They never opted into the compiled pattern. Their exports point straight at
source, they extend `base.json` (which sets `noEmit`), and they have no `build`
script:

```jsonc
// packages/auth/package.json
"exports": { ".": "./src/index.ts" }
```

That is a valid choice — it just trades the barrel guarantee for a simpler
build. Only packages claiming a `types` path need that path to be real.
