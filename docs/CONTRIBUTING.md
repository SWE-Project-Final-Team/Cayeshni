# Contributing guide

## Branching

| Branch | Purpose | Merges into |
|--------|---------|-------------|
| `main` | Production | — |
| `develop` | Integration | `main` |
| `feature/*` | New features | `develop` |
| `fix/*` | Bug fixes (non-production) | `develop` |
| `hotfix/*` | Urgent production fixes | `main` + `develop` |
| `chore/*` | Setup, CI, tooling, structure | `develop` |
| `docs/*` | Documentation | `develop` |
| `refactor/*` | Code improvements (no behavior change) | `develop` |
| `test/*` | Adding or modifying tests | `develop` |

## Day-to-day workflow

```bash
# 1. Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Work, commit often using conventional commits (see below)
git add .
git commit -m "feat: add transaction split by percentage"

# 3. Push and open PR into develop
git push origin feature/your-feature-name
```

Then open a PR on GitHub. Fill in the PR template. Request at least 1 reviewer.

## Commit message format

```
<type>(<scope>): <short description>

Types:
  feat     → new feature          → triggers minor release
  fix      → bug fix              → triggers patch release
  chore    → maintenance, deps    → no release
  docs     → documentation        → no release
  refactor → no behaviour change  → no release
  test     → tests only           → no release

Breaking change:
add ! after type: feat!: change auth API  → triggers major release
```

**Examples:**
```
feat(transactions): add split by percentage
fix(auth): resolve JWT refresh token expiry
chore(deps): update EF Core to 8.1
docs: update API setup instructions
test: add unit tests for TransactionService
```

## PR rules

- `feature/*` → `develop`: **1 approval** required, CI must pass
- `develop` → `main`: **2 approvals** required, CI must pass
- No direct pushes to `main` or `develop`
- Resolve all review comments before merging

## Releases

Releases are fully automated via `semantic-release` when `develop` is merged into `main`.

- It reads your commit messages since the last tag
- Bumps the version (major / minor / patch)
- Generates `CHANGELOG.md`
- Creates a GitHub release with release notes

You do not need to manually tag or version anything.

## Tests

Run before pushing:

```bash
# Backend
cd backend
dotnet test

# Frontend
cd frontend
npm test -- --run
```

CI runs both automatically on every PR.
