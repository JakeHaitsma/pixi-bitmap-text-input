import { spawn } from "child_process";
import fs from "fs";

const audit = spawn("yarn", ["audit", "--json"]);

let output = "";

audit.stdout.on("data", data => {
  output += data;
});

audit.stderr.on("data", data => {
  console.error(`stderr: ${data}`);
});

audit.on("error", error => {
  console.error(`Error: ${error.message}`);
});

// From https://classic.yarnpkg.com/lang/en/docs/cli/audit/#toc-yarn-audit.
const severityExitCodeMap = {
  info: 1,
  low: 2,
  moderate: 4,
  high: 8,
  critical: 16,
};

audit.on("close", code => {
  // Per https://classic.yarnpkg.com/lang/en/docs/cli/audit/#toc-yarn-audit, yarn audit's exit code is the sum of each severity kind's.
  // If the exit code is greater than the sum of all severities, then there was an error in the execution.
  const sumOfAllExitCodes = Object.values(severityExitCodeMap).reduce(
    (acc, curr) => acc + curr,
    0
  );
  if (code > sumOfAllExitCodes) {
    console.error(`Error: yarn audit exited with code ${code}`);
    process.exit(code);
  }

  const results = output
    .split("\n")
    .filter(line => line)
    .map(line => JSON.parse(line));

  generateFilteredAuditResults(results);
});

function getIgnoredModules() {
  if (!fs.existsSync(".auditignore")) {
    return [];
  }

  const auditignore = fs.readFileSync(".auditignore", "utf8");
  return auditignore
    .split("\n")
    .filter(x => Boolean(x) && !x.startsWith("#"))
    .map(x => x.trim());
}

function generateFilteredAuditResults(results) {
  const allAdvisories = results.filter(x => x.type === "auditAdvisory");
  const ignoredModules = getIgnoredModules().map(x => x.toLowerCase());
  const filteredAdvisories = allAdvisories.filter(
    x => !ignoredModules.includes(x.data.advisory.module_name.toLowerCase())
  );
  const severities = filteredAdvisories.map(x =>
    x.data.advisory.severity.toLowerCase()
  );

  const deduplicatedSeverities = [...new Set(severities)];
  const exitCode = deduplicatedSeverities.reduce(
    (acc, curr) => acc + severityExitCodeMap[curr],
    0
  );

  if (exitCode === 0) {
    console.log("🔒 No vulnerabilities found.");
  } else {
    console.log("🚨 Vulnerabilities found.");
    console.table(filteredAdvisories.map(x => x.data.advisory));
  }

  process.exit(exitCode);
}
