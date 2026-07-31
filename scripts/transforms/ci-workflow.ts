// The CLI deletes itself, so any CI that invokes it has to go too — otherwise
// the customer's first push fails on scripts this repo no longer has.
const CLI_STEP_NAMES = ["Run setup CLI tests", "Typecheck setup CLI"];
const CLI_JOB_NAMES = ["setup-cli"];

function stripStep(yaml: string, name: string): string {
  const pattern = new RegExp(`\\n+( *)- name: ${name}\\n(?:\\1  [^\\n]*\\n)*`);
  return yaml.replace(pattern, "\n");
}

function stripJob(yaml: string, name: string): string {
  const pattern = new RegExp(`\\n+ {2}${name}:\\n(?:(?: {3,}[^\\n]*)?\\n)*`);
  return yaml.replace(pattern, "\n");
}

export function stripCliCi(yaml: string): string {
  let out = yaml.endsWith("\n") ? yaml : `${yaml}\n`;
  for (const name of CLI_STEP_NAMES) {
    out = stripStep(out, name);
  }
  for (const name of CLI_JOB_NAMES) {
    out = stripJob(out, name);
  }
  return out;
}
