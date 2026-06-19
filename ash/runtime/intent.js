function classifyIntent(observation) {
  const signals = observation?.signals || [];

  const intent = {
    mode: "intent-runtime",
    version: "ash-local-runtime-v0.1",
    primary: "general",
    requiresCoreCheck: false,
    requiresCheckpoint: false,
    requiresHandover: false,
    requiresAshCoreSave: false,
  };

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

  if (signals.includes("save-required")) {
    intent.requiresCoreCheck = true;
    intent.requiresAshCoreSave = true;
  }

  if (signals.includes("handover-required")) {
    intent.requiresHandover = true;
    intent.requiresCoreCheck = true;
  }

  if (signals.includes("corecheck")) {
    intent.requiresCoreCheck = true;
  }

  return intent;
}

module.exports = { classifyIntent };
