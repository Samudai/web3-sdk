# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`@samudai_xyz/web3-sdk` is a TypeScript library bundling Samudai's web3 integrations
(Gnosis Safe, Lit Protocol token gating, NFT profile photos, Snapshot, SIWE, Biconomy,
Farcaster, ENS subdomains, DeBank, token balances, NFT claims, points). It ships as a
multi-target npm package (CommonJS, ESM, UMD, and type declarations).

## Commands

```sh
npm run build        # full build: cjs + esm + umd + types into dist/
npm run build:cjs    # tsc -p config/tsconfig.cjs.json   -> dist/cjs
npm run build:esm    # tsc -p config/tsconfig.esm.json   -> dist/esm
npm run build:umd    # webpack (config/webpack.config.js) -> dist/umd
npm run build:types  # tsc -p config/tsconfig.types.json -> dist/types
npm run clean        # delete dist/ (tools/cleanup.js)
npm run typecheck    # tsc --noEmit (fast type-only check)
npm run lint         # eslint src
npm run package      # build + npm pack
npm test             # jest --no-cache --runInBand --passWithNoTests
npm run test:cov     # jest with coverage
```

Requires **Node ≥ 22** (`engines` / `.nvmrc`). Lint is ESLint 9 **flat config**
(`eslint.config.js`, using the `typescript-eslint` meta-package) + Prettier 3. Prettier
config is unusual: no semicolons, single quotes, 80-char width. The flat config keeps
`@typescript-eslint/no-explicit-any` and `no-require-imports` OFF and `no-unused-vars`
as a warning — the codebase predates strict linting and uses these pervasively, so they
are intentionally non-blocking (don't "fix" them wholesale).

### Tests

There are **no tests yet**. `jest.config.js` `roots` points at `<rootDir>/src` and the
`test` script uses `--passWithNoTests`, so the Husky `pre-commit` hook (`npm test`)
passes. Add tests as `src/**/*.spec.ts` (or `__tests__/`); run a single one with
`npx jest src/path/file.spec.ts -t "name"`. Because there are no tests, **`npm run build`
(all 4 targets must compile) is the real safety net** — the UMD/webpack build is the
canary since it bundles the heavy web3 deps (Lit pulls WASM + Buffer polyfill).

### Commits

Husky 9 enforces [Conventional Commits](https://www.conventionalcommits.org/) via
`commitlint` (`commit-msg` hook). Use prefixes like `feat:`, `fix:`, `chore:`.

### Publishing

CI (`.github/workflows/publish.yml`) builds and `npm publish`es on pushing a `v*` git
tag, using Node 22. There is no CI build/test on regular pushes or PRs.

## Architecture

Every integration is a self-contained module under `src/<module>/` following the same
layout, so once you understand one you understand all:

```
src/<module>/
  index.ts            # barrel: re-exports from ./src/<file>
  src/<file>.ts       # the exported class (the public API)
  utils/types.ts      # request/response interfaces, including ErrorResponse
  utils/networks.ts   # chainId -> RPC/service URL / API config maps (where relevant)
  utils/enums.ts      # enums (e.g. TokenGatingType)
  utils/constants.ts  # addresses, ABIs references
  lib/                # internal helpers, GraphQL queries, contract factories
  contracts/          # Solidity sources / ABIs (subdomain, ens-redirection, NFTClaim)
```

`src/index.ts` is the single aggregate barrel that re-exports every module's class plus
selected type namespaces (`export * as GnosisTypes from ...`). When adding a new module,
wire it in here for it to be part of the published surface.

### Module conventions

- Each module's public surface is a **class** (e.g. `Gnosis`, `LitProtocol`,
  `UserTokenBalance`). Methods are written as **arrow-function class properties**
  (`method = async (...) => {}`), not normal methods.
- Runtime uses **ethers v6**: browser providers are `BrowserProvider` (constructors take
  one and/or a `chainId`/`networkType`), `provider.getSigner()` is **async**, and helpers
  are top-level (`ethers.parseUnits`, `ethers.getAddress`, `ethers.formatUnits`, native
  `bigint` instead of `BigNumber`). Safe protocol-kit v7 takes an EIP-1193 provider, so
  `Gnosis` adapts the `BrowserProvider` via a small `{ request }` shim (`buildEip1193`).
- The Lit module (`LitProtocol`) uses Lit v7's encrypt/decrypt model: `encryptGate` /
  `verifyGate` (the old `init`→JWT / `verifyLit` API is gone). Biconomy (`ClaimSubdomain`)
  uses `@biconomy/account` v4's `createSmartAccountClient`.
- Methods generally `try/catch` and **return** an `ErrorResponse` object on failure
  rather than throwing — callers must check the returned shape (union return types like
  `Promise<Result | ErrorResponse>`).
- Chain support is data-driven: a `Networks` array in `utils/networks.ts` maps `chainId`
  to service URLs / Alchemy config; methods look up the entry and error on unknown chains.

### Build targets

Each `config/tsconfig.*.json` extends the root `tsconfig.json` (strict mode, target
ES2020, `resolveJsonModule`) and only overrides `module`/`outDir`. The root tsconfig uses
`moduleResolution: node` plus a `paths` redirect for **`ox`** (a transitive dep of
viem/biconomy/safe that ships `.ts` source and relies on `exports`) → its shipped `.d.ts`;
without it `tsc` compiles ox's raw source and fails. UMD is built with webpack + `ts-loader`;
its config sets Node-core `fallback` shims (crypto-browserify, buffer, stream) and a
`ProvidePlugin` for `Buffer`, needed because the web3 deps (esp. Lit) assume Node globals.
