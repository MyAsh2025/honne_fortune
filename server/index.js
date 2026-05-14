const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PHASE = "stable-paid-v8";

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

function getStrengthPhrase(strength) {
  const phrases = {
    very_high: "かなり強く",
    high: "強く",
    middle: "静かに",
    low: "小さく",
  };

  return phrases[strength] || "静かに";
}

function getEmotionTone(compound) {
  const primaryTrait = compound.primaryTrait;
  const secondaryTrait = compound.secondaryTrait;
  const strength = compound.traitStrength;

  if (primaryTrait === "emotional_fatigue") return "overloaded";
  if (primaryTrait === "future_anxiety") return "anxious";
  if (primaryTrait === "attachment_anxiety") return "anxious";
  if (primaryTrait === "identity_confusion" && strength === "very_high") return "empty";
  if (primaryTrait === "people_pleasing") return "suppressed";
  if (primaryTrait === "role_pressure") return "overloaded";

  if (secondaryTrait === "emotional_fatigue") return "overloaded";
  if (secondaryTrait === "future_anxiety") return "anxious";

  return "recovering";
}

function getEmotionToneLabel(tone) {
  const labels = {
    suppressed: "抑え込まれた本音",
    anxious: "焦りを含んだ不安",
    empty: "空白に近い迷い",
    overloaded: "抱えすぎた疲労",
    recovering: "回復前の揺れ",
  };

  return labels[tone] || "回復前の揺れ";
}

function getEmotionTonePhrase(tone) {
  const phrases = {
    suppressed: "本音を出す前に、先に自分を抑えてしまう温度です。",
    anxious: "答えを急ぎたい気持ちと、失敗を恐れる気持ちが同時に動いています。",
    empty: "何かを強く望むより先に、自分の感覚が少し見えにくくなっています。",
    overloaded: "もう十分頑張ってきたのに、まだ止まれないような重さがあります。",
    recovering: "苦しさの中にも、少しずつ自分に戻ろうとする流れがあります。",
  };

  return phrases[tone] || "苦しさの中にも、少しずつ自分に戻ろうとする流れがあります。";
}

function getMemoryEcho(compound) {
  const trait = compound.primaryTrait;
  const tone = getEmotionTone(compound);

  if (trait === "people_pleasing") {
    return "気づかないうちに、“嫌われないこと”を優先する時間が長く続いていたのかもしれません。";
  }

  if (trait === "attachment_anxiety") {
    return "大切なものを失わないようにする緊張感が、ずっと心の奥で続いていた可能性があります。";
  }

  if (trait === "role_pressure") {
    return "期待に応え続けることが当たり前になり、自分を休ませる感覚を後回しにしてきたのかもしれません。";
  }

  if (trait === "future_anxiety") {
    return "『このままで大丈夫なのか』という問いが、何度も心の中を巡ってきた流れがあります。";
  }

  if (trait === "identity_confusion") {
    return "周囲に合わせる時間が長くなるほど、自分自身の輪郭が少し曖昧になっていったのかもしれません。";
  }

  if (trait === "emotional_fatigue") {
    return "平気なふりを続けるうちに、疲れていることさえ後回しにしてきた可能性があります。";
  }

  return "長い時間をかけて、自分を守る反応が積み重なってきたようです。";
}

function getInnerNarrative(compound) {
  const trait = compound.primaryTrait;
  const tone = getEmotionTone(compound);

  if (trait === "people_pleasing") {
    return "嫌われないように先回りしながら、自分の気持ちを後ろへ置いてきた流れがあります。";
  }

  if (trait === "attachment_anxiety") {
    return "大切な人ほど失うのが怖くなり、傷つく前に距離を取ろうとしてきた流れがあります。";
  }

  if (trait === "role_pressure") {
    return "期待に応え続けるうちに、止まり方が分からなくなってきた流れがあります。";
  }

  if (trait === "future_anxiety") {
    return "失敗しない未来を探し続けるうちに、安心より不安が先に動くようになってきた流れがあります。";
  }

  if (trait === "identity_confusion") {
    return "周囲に合わせる時間が長すぎて、本当の自分の感覚が少し見えにくくなっている流れがあります。";
  }

  if (trait === "emotional_fatigue") {
    return "頑張り続けることが普通になり、疲れていることにも気づきにくくなっている流れがあります。";
  }

  return "長い時間をかけて、自分を守るための反応が積み重なってきた流れがあります。";
}

function buildDynamicOpening(compound) {
  return `表面では「${getCategoryLabel(compound.primaryCategory)}」の悩みに見えます。
けれど今回の読みでは、その奥に「${getTraitLabel(compound.primaryTrait)}」が${getStrengthPhrase(compound.traitStrength)}反応しています。`;
}

function buildDynamicConflict(compound) {
  return `さらに背景には「${getCategoryLabel(compound.secondaryCategory)}」と「${getTraitLabel(compound.secondaryTrait)}」の影響があります。
つまり、今の苦しさは一つの問題ではなく、いくつかの感情が重なって生まれている可能性があります。`;
}

function buildDynamicHiddenNeed(compound) {
  return `あなたが本当に求めているのは、表面的な正解ではありません。
「ちゃんとしなければ」と力む前に、自分の本音を否定しなくていい安心感を求めています。`;
}

function buildDynamicSign(compound) {
  return `今は、何を選ぶかよりも、なぜそこまで心が反応しているのかを見る時期です。
「${getTraitLabel(compound.primaryTrait)}」が出ている場所に、次のあなたへ進むための本音があります。`;
}

function stablePaidFortune(score, answers = []) {
  const categoryResult = getPrimaryCategory(answers);
  const traitResult = getPrimaryTrait(answers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const emotionTone = getEmotionTone(compound);

  return `【さらに深い本音】
${buildDynamicOpening(compound)}

【今のあなたが悩んでいること】
${buildDynamicConflict(compound)}

【感情の温度】
今回の感情温度は「${getEmotionToneLabel(emotionTone)}」です。
${getEmotionTonePhrase(emotionTone)}

【心の奥で続いてきた流れ】
${getInnerNarrative(compound)}

【記憶の奥に残っている反応】
${getMemoryEcho(compound)}

【本当は求めているもの】
${buildDynamicHiddenNeed(compound)}

【隠れている根本】
今回の主軸は「${getCategoryLabel(compound.primaryCategory)}」です。
ただし、裏側には「${getCategoryLabel(compound.secondaryCategory)}」もあり、本質的には「${getTraitLabel(compound.primaryTrait)}」が${getStrengthPhrase(compound.traitStrength)}出ています。

【次に進むためのサイン】
${buildDynamicSign(compound)}`;
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
    emotionTone: getEmotionTone(compound),
    emotionToneLabel: getEmotionToneLabel(getEmotionTone(compound)),

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






