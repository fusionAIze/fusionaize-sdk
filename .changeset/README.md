# Changesets

This directory contains changeset files that describe the changes in each package.

## Adding a changeset

Run `pnpm changeset` and follow the prompts. This will create a new markdown file in this directory.

## Releasing

When changes are merged to `main`, the CI will automatically run `changeset version` and `changeset publish` if there are changesets present.

## Manual release

If you need to manually release, you can run:

```bash
pnpm changeset version
pnpm changeset publish
```

But prefer the automated workflow.