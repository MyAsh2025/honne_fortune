function scoreImportance(signals) {
  let score = 0;

  if (signals.includes("architecture-change")) score += 35;
  if (signals.includes("runtime-change")) score += 30;
  if (signals.includes("save-required")) score += 20;
  if (signals.includes("handover-required")) score += 15;
  if (signals.includes("development-task")) score += 15;
  if (signals.includes("corecheck")) score += 10;

  if (score >= 60) return { level: "critical", score };
  if (score >= 35) return { level: "high", score };
  if (score >= 15) return { level: "medium", score };
  return { level: "low", score };
}

function detectDomain(signals) {
  if (signals.includes("architecture-change") || signals.includes("runtime-change")) {
    return "architecture";
  }

  if (signals.includes("development-task")) {
    return "development";
  }

  if (signals.includes("save-required")) {
    return "knowledge";
  }

  if (signals.includes("handover-required")) {
    return "continuity";
  }

  return "general";
}

function observe(input = "") {
  const text = String(input || "").toLowerCase();

  const signals = [];

  if (text.includes("corecheck")) signals.push("corecheck");
  if (text.includes("runtime")) signals.push("runtime-change");
  if (text.includes("architecture") || text.includes("設計")) signals.push("architecture-change");
  if (text.includes("save") || text.includes("保存")) signals.push("save-required");
  if (text.includes("handover") || text.includes("引継ぎ")) signals.push("handover-required");
  if (text.includes("patch") || text.includes("修正") || text.includes("実装")) signals.push("development-task");

  const importance = scoreImportance(signals);
  const domain = detectDomain(signals);

  return {
    mode: "observation-runtime",
    version: "ash-local-runtime-v0.2",
    input,
    signals,
    domain,
    importance,
    decisionCandidate: importance.score >= 35,
    observedAt: new Date().toISOString(),
  };
}

module.exports = { observe };
