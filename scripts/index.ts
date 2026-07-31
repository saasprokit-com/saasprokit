import { Command } from "commander";
import { type InitFlags, runInit } from "./prompts";

const program = new Command("saasprokit");

program
  .command("init")
  .description("Initialize this SaaSProKit clone for your deploy target")
  .option("--name <name>", "project name")
  .option("--host <host>", "deploy target: cloudflare | vercel | docker")
  .option("--yes", "accept defaults, no interactive prompts", false)
  .option("--no-commit", "skip the git commit at the end")
  .option("--keep-setup", "keep the CLI tooling in the repo", false)
  .option("--keep-all-hosts", "skip host pruning", false)
  .option("--no-install", "skip pnpm install + prisma generate")
  .action(async (options: InitFlags) => {
    await runInit(process.cwd(), options);
  });

// pnpm keeps a literal "--" when forwarding script args; commander would
// treat everything after it as positionals. This CLI has no positionals,
// so dropping the separator is safe.
//
// parseAsync (not parse): commander does not await async .action handlers
// under parse(), so a throw inside runInit (e.g. renderEnvLocal's
// both-quotes error) would surface as a raw unhandled rejection instead
// of a clean CLI failure.
await program.parseAsync(process.argv.filter((arg) => arg !== "--"));
