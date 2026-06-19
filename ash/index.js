const fs = require("fs");
const path = require("path");

const { observeConversation } = require("./sensors/conversation");
const { observeRepository } = require("./sensors/repository");
const { mergeObservations } = require("./runtime/observation");
const { classifyIntent } = require("./runtime/intent");
const { makeDecision } = require("./runtime/decision");
const { applyPolicy } = require("./runtime/policy");
const { makeExecutiveDecision } = require("./runtime/executive");
const { applyGovernance } = require("./runtime/governance");
const { buildPlan } = require("./runtime/planner");
const { buildWorkflow } = require("./runtime/workflow");
const { selectAgents } = require("./runtime/agent-selector");
const { runAgentBus } = require("./runtime/agent-bus");
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

  const conversation = observeConversation(task);
  const repository = observeRepository();
  const observation = mergeObservations({ conversation, repository });
  const decision = makeDecision(observation);
  const policy = applyPolicy(observation, decision);
  const executive = makeExecutiveDecision({ observation, policy, repository });
  const governance = applyGovernance({ observation, policy, executive });
  const intent = classifyIntent(observation, decision, policy);
  const plan = buildPlan(intent, task);
  const workflow = buildWorkflow({ governance, plan });
  const agentSelection = selectAgents({ task, intent, workflow });
  const agentBus = workflow.autoExecutable
    ? runAgentBus(agentSelection)
    : {
        mode: "agent-bus-runtime",
        version: "ash-local-runtime-v0.1",
        executedAgents: [],
        skippedAgents: agentSelection.selectedAgents || [],
        results: [],
        blocked: true,
        reason: workflow.message,
        completedAt: new Date().toISOString()
      };

  const runtimeResult = {
    mode: "ash-local-runtime",
    version: "v0.1",
    task,
    dryRun,
    conversation,
    repository,
    observation,
    decision,
    policy,
    executive,
    governance,
    intent,
    plan,
    workflow,
    agentSelection,
    agentBus,
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

  console.log("== Repository ==");
  console.log(JSON.stringify(repository, null, 2));

  console.log("== Decision ==");
  console.log(JSON.stringify(decision, null, 2));

  console.log("== Policy ==");
  console.log(JSON.stringify(policy, null, 2));

  console.log("== Executive ==");
  console.log(JSON.stringify(executive, null, 2));

  console.log("== Governance ==");
  console.log(JSON.stringify(governance, null, 2));

  console.log("== Intent ==");
  console.log(JSON.stringify(intent, null, 2));

  console.log("== Plan ==");
  console.log(JSON.stringify(plan, null, 2));

  console.log("== Workflow ==");
  console.log(JSON.stringify(workflow, null, 2));

  console.log("== Agent Selection ==");
  console.log(JSON.stringify(agentSelection, null, 2));

  console.log("== Agent Bus ==");
  console.log(JSON.stringify(agentBus, null, 2));

  console.log(`Log: ${logPath}`);

  if (!dryRun) {
    if (workflow.autoExecutable) {
      executePlan({
        ...plan,
        steps: workflow.executableSteps
      });
    } else {
      console.log("== Execution blocked by Governance ==");
      console.log(workflow.message);
    }
  }

  console.log("== Ash Local Runtime complete ==");
}

main();

