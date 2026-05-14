# `.agents/` — AI Agent Skills (Source of Truth)

This directory is the **canonical home** for all AI coding-assistant skills used by this boilerplate. Every other AI-tool config folder at the repo root (`.claude/skills/`, `.continue/skills/`, `.windsurf/skills/`, …) contains **symlinks pointing here** — there's only one real copy of each skill on disk.

```
.agents/skills/                              ← real skill files live here
├── better-auth-best-practices/
├── prisma-cli/
├── shadcn/
└── …17 skills total

.claude/skills/better-auth-best-practices    → ../../.agents/skills/better-auth-best-practices
.continue/skills/better-auth-best-practices  → ../../.agents/skills/better-auth-best-practices
.windsurf/skills/better-auth-best-practices  → ../../.agents/skills/better-auth-best-practices
```

## Why this layout

AI coding assistants each invented their own folder for project-level skills:

| Tool | Expected location |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Continue | `.continue/skills/` |
| Windsurf | `.windsurf/skills/` |
| Cursor | `.cursorrules` or `.cursor/rules/` |
| GitHub Copilot | `.github/copilot-instructions.md` |

Duplicating skill files into every tool's folder causes drift — edit one, forget the others, and your AI assistants disagree about your conventions. Symlinking to a single `.agents/skills/` directory keeps them in sync forever:

- **Single source of truth** — edit once, every tool sees the change.
- **Tiny git footprint** — symlinks are stored as ~50-byte text blobs, not full file copies.
- **Vendor-neutral** — `.agents/` follows the emerging convention for a tool-agnostic agent config home, so new AI tools can be added without restructuring.

## Managing skills

Skills are version-pinned in [`skills-lock.json`](../skills-lock.json) (analogous to `package-lock.json`) and managed by the `skills` CLI:

```bash
npx skills check    # see which skills are out of date
npx skills update   # pull the latest versions
npx skills add <skill-name>    # add a new skill
```

When `npx skills update` runs, it rewrites files inside `.agents/skills/` only. The symlinks in the sibling tool folders update automatically because they point here.

## Cross-platform note

Symlinks work natively on macOS and Linux. On Windows, git needs `core.symlinks=true` (set globally or via `git config core.symlinks true`) and may require Developer Mode or admin rights to create symlinks. If a Windows contributor reports issues, the workaround is to clone with `git clone -c core.symlinks=true …`.

## Adding support for a new AI tool

If you want to expose these skills to a new tool that expects them at `.newtool/skills/`:

```bash
mkdir -p .newtool/skills
cd .newtool/skills
for skill in ../../.agents/skills/*/; do
  ln -s "../../.agents/skills/$(basename "$skill")" "$(basename "$skill")"
done
```

That's it — the new tool now sees the same skills as every other tool, with no duplication.
