# Snap Keyring

Keyring implementation for arbitrary JSON data designed to be used by MetaMask for managing accounts managed by snaps.

Accounts for each snap are isolated by identifier so callers should ensure that the identifiers are stable and safe to use for isolation purposes.

## Setup

```
yarn setup
```

## Test

```
yarn test
```

## Dist

The `dist` build is not the same as the build used for testing as the requirements differ; the distribution build requires an `ES2016` target so that class member variables are stripped as they are not supported by the MetaMask build system:

```
yarn dist
```

This script is always run in `prepare` so that publishing includes the latest `dist` and not any test artifacts.
