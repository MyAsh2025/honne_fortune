const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PHASE = "stable-paid-v4.1";

function getScoreType(score) {
  const n = Number(score || 0);

  if (n <= 8) return "inner_guarded";
  if (n <= 16) return "sensitive_balancer";
  if (n <= 24) return "hidden_longing";

  return "emotionally_open";
}

function sortScores(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1]);
}

function getPrimaryCategory(answers) {
  const scores = {
    relationship: 0,
    love: 0,
    work: 0,
    future: 0,
    self: 0,
    mental: 0,
  };

  const map = {
    q1: "self",
    q2: "relationship",
    q3: "mental",
    q4: "love",
    q5: "self",
    q6: "future",
    q7: "relationship",
    q8: "mental",
    q9: "work",
    q10: "love",
    q11: "future",
    q12: "self",
    q13: "relationship",
    q14: "mental",
    q15: "work",
  };

  if (Array.isArray(answers)) {
    for (const answer of answers) {
      const category = map[answer.questionKey];
      if (!category) continue;
      scores[category] += Number(answer.value || 0);
    }
  }

  const sorted = sortScores(scores);

  return {
    primary: sorted[0]?.[0] || "self",
    secondary: sorted[1]?.[0] || "mental",
    scores,
    ranking: sorted.map(([key, value]) => ({ key, value })),
  };
}

function getPrimaryTrait(answers) {
  const scores = {
    identity_confusion: 0,
    people_pleasing: 0,
    emotional_fatigue: 0,
    attachment_anxiety: 0,
    future_anxiety: 0,
    role_pressure: 0,
  };

  const map = {
    q1: "identity_confusion",
    q2: "people_pleasing",
    q3: "emotional_fatigue",
    q4: "attachment_anxiety",
    q5: "identity_confusion",
    q6: "future_anxiety",
    q7: "people_pleasing",
    q8: "emotional_fatigue",
    q9: "role_pressure",
    q10: "attachment_anxiety",
    q11: "future_anxiety",
    q12: "identity_confusion",
    q13: "people_pleasing",
    q14: "emotional_fatigue",
    q15: "role_pressure",
  };

  if (Array.isArray(answers)) {
    for (const answer of answers) {
      const trait = map[answer.questionKey];
      if (!trait) continue;
            const value = Number(answer.value || 0);

      const weightMap = {
        q6: 1.35,
        q11: 1.35,
        q9: 1.2,
        q15: 1.2,
        q3: 1.15,
        q8: 1.15,
        q14: 1.15,
      };

      scores[trait] += value * (weightMap[answer.questionKey] || 1);
    }
  }

  const sorted = sortScores(scores);

  return {
    primary: sorted[0]?.[0] || "identity_confusion",
    secondary: sorted[1]?.[0] || "emotional_fatigue",
    scores,
    ranking: sorted.map(([key, value]) => ({ key, value })),
  };
}

function getTraitStrength(traitScores, primaryTrait) {
  const value = Number(traitScores?.[primaryTrait] || 0);

  if (value >= 6) return "very_high";
  if (value >= 4) return "high";
  if (value >= 2) return "middle";

  return "low";
}

function getCategoryLabel(category) {
  const labels = {
    relationship: "人間関係",
    love: "恋愛",
    work: "仕事・役割",
    future: "未来・進路",
    self: "自分自身",
    mental: "心の疲れ",
  };

  return labels[category] || "自分自身";
}

function getTraitLabel(trait) {
  const labels = {
    people_pleasing: "人に合わせすぎる癖",
    attachment_anxiety: "見捨てられ不安",
    role_pressure: "役割への重圧",
    future_anxiety: "未来への不安",
    identity_confusion: "自分らしさの迷子",
    emotional_fatigue: "感情の疲労",
  };

  return labels[trait] || "自分らしさの迷子";
}

function buildCompoundInsight(categoryResult, traitResult) {
  const primaryCategory = categoryResult.primary;
  const secondaryCategory = categoryResult.secondary;
  const primaryTrait = traitResult.primary;
  const secondaryTrait = traitResult.secondary;
  const strength = getTraitStrength(traitResult.scores, primaryTrait);

  const categoryLabel = getCategoryLabel(primaryCategory);
  const secondaryCategoryLabel = getCategoryLabel(secondaryCategory);
  const traitLabel = getTraitLabel(primaryTrait);
  const secondaryTraitLabel = getTraitLabel(secondaryTrait);

  const strengthText = {
    very_high: "かなり強く出ています",
    high: "強めに出ています",
    middle: "静かに出ています",
    low: "まだ小さく出ています",
  }[strength];

  return {
    primaryCategory,
    secondaryCategory,
    primaryTrait,
    secondaryTrait,
    traitStrength: strength,
    summary: `表面では「${categoryLabel}」の悩みに見えますが、奥には「${traitLabel}」が${strengthText}。さらに背景には「${secondaryCategoryLabel}」や「${secondaryTraitLabel}」も影響しています。`,
  };
}

function stableFortune(score) {
  const type = getScoreType(score);

  if (type === "inner_guarded") {
    return `【本質】
あなたは、平気なふりが少し上手すぎる人です。

【隠れた本音】
本当は誰かに気づいてほしいのに、期待して傷つくくらいなら、最初から何も言わない方を選んできたのかもしれません。
強い人に見えるほど、内側ではずっと自分を守ってきました。

【今のあなたへ】
心を閉じているのではなく、守ってきただけです。`;
  }

  if (type === "sensitive_balancer") {
    return `【本質】
あなたは、周りの空気を読みながら、自分の気持ちを後回しにしてしまう人です。

【隠れた本音】
本当はもっと素直に甘えたいのに、迷惑だと思われるのが怖くて、先に笑ってごまかしてしまうところがあります。
大丈夫なふりの裏で、誰かにちゃんと選ばれたい気持ちが残っています。

【今のあなたへ】
あなたの優しさは、我慢の形だけで見せなくても大丈夫です。`;
  }

  if (type === "hidden_longing") {
    return `【本質】
あなたの中には、誰かと深くつながりたい気持ちが静かに残っています。

【隠れた本音】
でも近づきすぎると、自分の弱さまで見られてしまいそうで、心のどこかで距離を測っています。
本当は、強がらなくても離れない相手を探しているのかもしれません。

【今のあなたへ】
本音は、弱さではありません。`;
  }

  return `【本質】
あなたは、自分の気持ちに正直でありたいと願う人です。

【隠れた本音】
ただその明るさの奥には、誰にも見せていない不安や、ひとりで抱えてきた迷いもあります。
分かってほしい気持ちほど、軽く見せてしまうところがあるようです。

【今のあなたへ】
その揺れも含めて、あなたらしさです。`;
}

function stablePaidFortune(score, answers = []) {
  const categoryResult = getPrimaryCategory(answers);
  const traitResult = getPrimaryTrait(answers);
  const compound = buildCompoundInsight(categoryResult, traitResult);

  return `【さらに深い本音】
${compound.summary}

【今のあなたが悩んでいること】
あなたの悩みは、ひとつの出来事だけで生まれているわけではありません。
表では「${getCategoryLabel(compound.primaryCategory)}」の問題として見えていても、心の奥では「${getTraitLabel(compound.primaryTrait)}」が反応しています。
そのため、頑張って解決しようとするほど、別の場所で苦しさが残ってしまうのかもしれません。

【本当は求めているもの】
あなたが本当に求めているのは、表面的な正解ではありません。
「ちゃんとしなければ」「分かってもらわなければ」「失敗してはいけない」という力みから少し離れて、自分の本音を否定しなくていい場所です。

【隠れている根本】
今回の読みでは、主軸は「${getCategoryLabel(compound.primaryCategory)}」です。
ただし、裏側には「${getCategoryLabel(compound.secondaryCategory)}」の影響もあります。
さらに本質的な反応として、「${getTraitLabel(compound.primaryTrait)}」が${compound.traitStrength === "very_high" ? "かなり強く" : compound.traitStrength === "high" ? "強く" : compound.traitStrength === "middle" ? "静かに" : "小さく"}出ています。

【次に進むためのサイン】
今すぐ大きな答えを出さなくて大丈夫です。
まずは「何に悩んでいるか」よりも、「なぜそこまで心が反応しているのか」を見てください。
そこに、次のあなたを動かす本音があります。`;
}

app.post("/fortune", async (req, res) => {
  const { score } = req.body || {};

  res.json({
    ok: true,
    mode: "stable-template",
    phase: "stable-free-v1",
    type: getScoreType(score || 0),
    text: stableFortune(score || 0),
  });
});

app.post("/deep-fortune", async (req, res) => {
  const { score, answers } = req.body || {};
  const safeAnswers = answers || [];

  const categoryResult = getPrimaryCategory(safeAnswers);
  const traitResult = getPrimaryTrait(safeAnswers);
  const compound = buildCompoundInsight(categoryResult, traitResult);

  res.json({
    ok: true,
    mode: "stable-paid-template",
    phase: PHASE,
    fallback: false,
    model: "stable-template",

    type: getScoreType(score || 0),

    category: categoryResult.primary,
    categoryScores: categoryResult.scores,

    trait: traitResult.primary,
    traitScores: traitResult.scores,

    primaryCategory: compound.primaryCategory,
    secondaryCategory: compound.secondaryCategory,
    primaryTrait: compound.primaryTrait,
    secondaryTrait: compound.secondaryTrait,
    traitStrength: compound.traitStrength,
    compoundSummary: compound.summary,

    categoryRanking: categoryResult.ranking,
    traitRanking: traitResult.ranking,

    text: stablePaidFortune(score || 0, safeAnswers),
  });
});

const server = app.listen(8787, "127.0.0.1", () => {
  console.log("=================================");
  console.log("FREE: /fortune stable-free-template");
  console.log("DEEP: /deep-fortune stable-paid-template");
  console.log(`Phase: ${PHASE}`);
  console.log("Listening: http://127.0.0.1:8787");
  console.log("=================================");
});

server.on("error", (error) => {
  console.error("[server error]", error);
});

process.stdin.resume();

