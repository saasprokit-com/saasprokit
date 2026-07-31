import { Command } from "commander";

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
  .action((options) => {
    // Wired to the real flow in the apply/prompts task
    process.stdout.write(`saasprokit init ${JSON.stringify(options)}\n`);
  });

program.parse();
