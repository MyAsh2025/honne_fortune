function observe(input = "") {
  const text = String(input || "").toLowerCase();

  const signals = [];

  if (text.includes("corecheck")) signals.push("corecheck");
  if (text.includes("runtime")) signals.push("runtime-change");
  if (text.includes("architecture") || text.includes("設計")) signals.push("architecture-change");
  if (text.includes("save") || text.includes("保存")) signals.push("save-required");
  if (text.includes("handover") || text.includes("引継ぎ")) signals.push("handover-required");
  if (text.includes("patch") || text.includes("修正") || text.includes("実装")) signals.push("development-task");

  return {
    mode: "observation-runtime",
    version: "ash-local-runtime-v0.1",
    input,
    signals,
    observedAt: new Date().toISOString(),
  };
}

module.exports = { observe };
