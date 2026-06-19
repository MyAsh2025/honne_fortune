const fs = require("fs");
const path = require("path");

const { observe } = require("./runtime/observation");
const { classifyIntent } = require("./runtime/intent");
const { makeDecision } = require("./runtime/decision");
const { buildPlan } = require("./runtime/planner");
const { executePlan } = require("./runtime/executor");

function getArgValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function main() {
  const task = getArgValue("--task", "general ash runtime task");
  const dryRun = process.argv.includes("--dry-run");

  console.log("== Ash Local Runtime v0.1 ==");
  console.log(`Task: ${task}`);
  console.log(`DryRun: ${dryRun}`);

  const observation = observe(task);
  const decision = makeDecision(observation);
  const intent = classifyIntent(observation, decision);
  const plan = buildPlan(intent, task);

  const runtimeResult = {
    mode: "ash-local-runtime",
    version: "v0.1",
    task,
    dryRun,
    observation,
    decision,
    intent,
    plan,
    createdAt: new Date().toISOString(),
  };

  const logDir = path.join(process.cwd(), "ash", "logs");
  fs.mkdirSync(logDir, { recursive: true });

  const logPath = path.join(
    logDir,
    `ash-runtime-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );

  fs.writeFileSync(logPath, JSON.stringify(runtimeResult, null, 2), "utf8");

  console.log("== Observation ==");
  console.log(JSON.stringify(observation, null, 2));

  console.log("== Decision ==");
  console.log(JSON.stringify(decision, null, 2));

  console.log("== Intent ==");
  console.log(JSON.stringify(intent, null, 2));

  console.log("== Plan ==");
  console.log(JSON.stringify(plan, null, 2));

  console.log(`Log: ${logPath}`);

  if (!dryRun) {
    executePlan(plan);
  }

  console.log("== Ash Local Runtime complete ==");
}

main();

