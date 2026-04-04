# CI Safeguards

Three complementary mechanisms enforce code quality gates in this repo:

1. **Local pre-commit hooks** — catch issues before they reach GitHub
2. **CI Gate job** — single required check that cannot be bypassed
3. **Auto-merge bot** — merges automatically once the gate passes

See [fusionAIze/faigate docs/process/ci-safeguards.md](https://github.com/fusionAIze/faigate/blob/main/docs/process/ci-safeguards.md) for full documentation.

## Branch protection setup (one-time)

In **Settings → Branches → Branch protection rules** for `main`:

1. Add **`CI Gate`** as the only required status check
2. Check **"Do not allow bypassing the above settings"**
3. Enable **"Allow auto-merge"** in **Settings → General**
