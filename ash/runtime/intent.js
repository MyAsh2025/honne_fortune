function classifyIntent(observation, decision = null) {
  const signals = observation?.signals || [];

  const intent = {
    mode: "intent-runtime",
    version: "ash-local-runtime-v0.2",
    primary: observation?.domain || "general",
    requiresCoreCheck: Boolean(decision?.requiresCoreCheck),
    requiresCheckpoint: Boolean(decision?.requiresCheckpoint),
    requiresHandover: Boolean(decision?.requiresHandover),
    requiresAshCoreSave: Boolean(decision?.requiresAshCoreSave),
    requiresMemorySave: Boolean(decision?.requiresMemorySave),
  };

  if (!decision) {
    if (signals.includes("development-task")) {
      intent.primary = "development";
      intent.requiresCoreCheck = true;
      intent.requiresCheckpoint = true;
    }

    if (signals.includes("runtime-change") || signals.includes("architecture-change")) {
      intent.primary = "architecture";
      intent.requiresCoreCheck = true;
      intent.requiresAshCoreSave = true;
    }
  }

  return intent;
}

module.exports = { classifyIntent };
