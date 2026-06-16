const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PHASE = "stable-paid-v54-runtime-policy-layer-v01";

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

function getCategoryLabelEn(category) {
  const labels = {
    relationship: "relationships",
    love: "love",
    work: "work and roles",
    future: "the future and direction",
    self: "your sense of self",
    mental: "emotional strain",
  };

  return labels[category] || "your sense of self";
}

function getTraitLabelEn(trait) {
  const labels = {
    people_pleasing: "a habit of adjusting yourself around others",
    attachment_anxiety: "a fear of being left behind",
    role_pressure: "pressure around the role you have been carrying",
    future_anxiety: "anxiety about what comes next",
    identity_confusion: "uncertainty around who you are",
    emotional_fatigue: "emotional tiredness",
  };

  return labels[trait] || "uncertainty around who you are";
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

function getEmotionToneLabelEn(tone) {
  const labels = {
    suppressed: "a feeling held back before it can speak",
    anxious: "an uneasiness that wants an answer too quickly",
    empty: "a quiet uncertainty where the self feels hard to see",
    overloaded: "a tiredness that has been carrying too much for too long",
    recovering: "a fragile movement back toward yourself",
  };

  return labels[tone] || "a fragile movement back toward yourself";
}

function getEmotionTonePhraseEn(tone) {
  const phrases = {
    suppressed: "Part of you may be holding back before your honest feeling has enough room to appear.",
    anxious: "There may be a wish to decide quickly, while another part of you is afraid of choosing wrong.",
    empty: "Before wanting something clearly, your own sense of self may feel slightly difficult to reach.",
    overloaded: "There is a heaviness here, as if you have kept going even after you were already tired.",
    recovering: "Even inside the strain, there seems to be a small movement trying to return you to yourself.",
  };

  return phrases[tone] || "Even inside the strain, there seems to be a small movement trying to return you to yourself.";
}
function getObservationToneLabelEn(compound, tone) {
  const trait = compound?.primaryTrait || "";

  if (trait === "role_pressure") {
    return "a pressure that has stayed tied to what must be carried";
  }

  if (trait === "attachment_anxiety") {
    return "an uneasiness that watches the distance to someone close";
  }

  return getEmotionToneLabelEn(tone);
}

function getObservationTonePhraseEn(compound, tone) {
  const trait = compound?.primaryTrait || "";

  if (trait === "role_pressure") {
    return "There is a weight here, as if part of you has kept holding a role even after it became heavy.";
  }

  if (trait === "attachment_anxiety") {
    return "There may be a wish to move closer, while another part of you braces for being left.";
  }

  return getEmotionTonePhraseEn(tone);
}


function getNarrativeIntegration(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "あなたの今回の本音は、『嫌われないように頑張ること』ではなく、『安心して本音を出せる場所がほしい』という気持ちに近いようです。";
  }

  if (trait === "attachment_anxiety") {
    return "あなたの今回の本音は、『傷つかないように距離を取ること』ではなく、『不安になっても離れなくていい関係を求めている』ところにあるようです。";
  }

  if (trait === "role_pressure") {
    return "あなたの今回の本音は、『期待に応え続けること』ではなく、『頑張らなくても価値が消えない感覚を持ちたい』ところにあるようです。";
  }

  if (trait === "future_anxiety") {
    return "あなたの今回の本音は、『正しい未来を見つけること』より、『少し安心できる今を持ちたい』という気持ちに近いようです。";
  }

  if (trait === "identity_confusion") {
    return "あなたの今回の本音は、『正しい自分を探すこと』ではなく、『無理に合わせなくてもいい感覚を取り戻したい』ところにあるようです。";
  }

  if (trait === "emotional_fatigue") {
    return "あなたの今回の本音は、『まだ頑張ること』ではなく、『もう限界に近い自分を少し休ませたい』ところにあるようです。";
  }

  return "あなたの今回の本音は、『無理を続けること』ではなく、『少し安心して生きたい』という気持ちに近いようです。";
}

function getFutureSelf(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return {
      current: "このまま相手を優先し続けると、自分の本音がさらに分からなくなっていく可能性があります。",
      healing: "少しずつ『自分の気持ちも大切にしていい』感覚を持てると、安心できる関係が増えていくかもしれません。"
    };
  }

  if (trait === "attachment_anxiety") {
    return {
      current: "このまま不安を抱え込み続けると、人との距離にさらに疲れやすくなる可能性があります。",
      healing: "少しずつ『不安があっても繋がっていていい』感覚を持てると、人との関係が少し楽になっていくかもしれません。"
    };
  }

  if (trait === "role_pressure") {
    return {
      current: "このまま頑張り続けると、『休むことへの怖さ』がさらに強くなっていく可能性があります。",
      healing: "少しずつ『止まっても価値は消えない』感覚を持てると、肩の力を抜ける時間が増えていくかもしれません。"
    };
  }

  if (trait === "future_anxiety") {
    return {
      current: "このまま正解を探し続けると、不安が先に動き、自分の感覚を信じにくくなる可能性があります。",
      healing: "少しずつ『安心できる選択』を増やせると、未来への怖さが静かに和らいでいくかもしれません。"
    };
  }

  if (trait === "identity_confusion") {
    return {
      current: "このまま周囲に合わせ続けると、自分の感覚をさらに見失いやすくなる可能性があります。",
      healing: "少しずつ『違和感を無視しない』感覚を持てると、自分らしさを取り戻していけるかもしれません。"
    };
  }

  if (trait === "emotional_fatigue") {
    return {
      current: "このまま耐え続けると、少しずつ感情が動きにくくなっていく可能性があります。",
      healing: "少しずつ『安心して休む感覚』を取り戻せると、頑張るためではなく、自分を大切にする時間が増えていくかもしれません。"
    };
  }

  return {
    current: "このまま無理を続けると、心の疲れがさらに深くなっていく可能性があります。",
    healing: "少しずつ自分を守る感覚を持てると、心の重さが和らいでいくかもしれません。"
  };
}

function getRelationshipMirror(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "人間関係の中で、自分の気持ちより相手を優先し、『合わせる側』に回りやすい傾向があります。";
  }

  if (trait === "attachment_anxiety") {
    return "人間関係の中で、強く繋がりたい気持ちと、傷つく前に距離を取る反応を繰り返しやすいようです。";
  }

  if (trait === "role_pressure") {
    return "人間関係の中で、『頼られる側』『支える側』になりやすく、自分の負担を後回しにしやすい傾向があります。";
  }

  if (trait === "future_anxiety") {
    return "人間関係の中で、相手の反応や評価を気にしすぎて、自分の選択に強い不安を感じやすいようです。";
  }

  if (trait === "identity_confusion") {
    return "人間関係の中で、相手ごとに自分を合わせ続け、本音が分からなくなりやすい傾向があります。";
  }

  if (trait === "emotional_fatigue") {
    return "人間関係の中で、『大丈夫な人』を続けようとして、一人で抱え込みやすい傾向があります。";
  }

  return "人との関係の中で、自分を守るための役回りを自然に選びやすいようです。";
}

function getPastScar(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "昔から、『空気を乱さないようにしなければ』という感覚を抱えてきた可能性があります。";
  }

  if (trait === "attachment_anxiety") {
    return "昔から、『離れていかれないようにしなければ』という不安をどこかで抱えてきたのかもしれません。";
  }

  if (trait === "role_pressure") {
    return "昔から、『頑張らないと認められない』感覚を抱えてきた可能性があります。";
  }

  if (trait === "future_anxiety") {
    return "昔から、『間違えてはいけない』という緊張感を強く持ちながら進んできたのかもしれません。";
  }

  if (trait === "identity_confusion") {
    return "昔から、『周囲に合わせた方が安全』という感覚を優先してきた可能性があります。";
  }

  if (trait === "emotional_fatigue") {
    return "昔から、『無理をしてでも耐えること』を当たり前にしてきた流れがあるのかもしれません。";
  }

  return "昔から、自分を守るための感覚を静かに抱えてきたようです。";
}

function getSoulConflict(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "『本音で生きたい気持ち』と、『嫌われないように合わせ続けたい気持ち』が心の中で衝突しています。";
  }

  if (trait === "attachment_anxiety") {
    return "『誰かと深く繋がりたい気持ち』と、『傷つく前に距離を取りたい気持ち』が同時に存在しています。";
  }

  if (trait === "role_pressure") {
    return "『本当は休みたい気持ち』と、『期待に応え続けなければならない感覚』が強くぶつかっています。";
  }

  if (trait === "future_anxiety") {
    return "『前に進みたい気持ち』と、『失敗して壊れたくない気持ち』が同時に未来を引っ張っています。";
  }

  if (trait === "identity_confusion") {
    return "『自分らしく生きたい気持ち』と、『周囲に合わせなければ不安になる感覚』が衝突しているようです。";
  }

  if (trait === "emotional_fatigue") {
    return "『もう休みたい気持ち』と、『ここで止まったら崩れてしまう怖さ』が心の中で綱引きしています。";
  }

  return "心の中で、進みたい気持ちと守りたい気持ちが同時に動いているようです。";
}

function getLifeTheme(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "これまでの人生で、『嫌われないこと』を優先しながら人との関係を保とうとしてきた流れがあります。";
  }

  if (trait === "attachment_anxiety") {
    return "これまでの人生で、『失わないこと』を強く意識しながら人との距離を測ってきた可能性があります。";
  }

  if (trait === "role_pressure") {
    return "これまでの人生で、『必要とされること』を通して自分の価値を支え続けてきた流れがあります。";
  }

  if (trait === "future_anxiety") {
    return "これまでの人生で、『間違えないこと』を優先しながら未来を選び続けてきたのかもしれません。";
  }

  if (trait === "identity_confusion") {
    return "これまでの人生で、『周囲に合わせること』を優先するうちに、自分自身の感覚を後ろへ置いてきた可能性があります。";
  }

  if (trait === "emotional_fatigue") {
    return "これまでの人生で、『耐え続けること』を当たり前にしながら、自分を支えてきた流れがあります。";
  }

  return "これまでの人生の中で、自分なりの方法で心を守りながら進んできたようです。";
}

function getHopeFragment(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "全部を変えられなくても、『少しは自分の本音を大切にしたい』気持ちはまだ残っています。";
  }

  if (trait === "attachment_anxiety") {
    return "不安が消えなくても、『本当は誰かと安心して繋がりたい』気持ちは心の奥に残っています。";
  }

  if (trait === "role_pressure") {
    return "今すぐ止まれなくても、『本当は少し休みたい』という感覚はまだ消えていません。";
  }

  if (trait === "future_anxiety") {
    return "未来が怖くても、『どこかで少しでも安心したい』気持ちはまだ残っています。";
  }

  if (trait === "identity_confusion") {
    return "自分が分からなくなっていても、『本当の感覚を取り戻したい』気持ちはまだ静かに残っています。";
  }

  if (trait === "emotional_fatigue") {
    return "今は疲れ切っていても、『本当は安心したい』気持ちはまだ心の奥で消えていません。";
  }

  return "苦しさの中でも、少しだけ前を向こうとする感覚はまだ残っているようです。";
}

function getAcceptanceSentence(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "あなたが苦しいのは弱いからではなく、人との関係を壊さないようにずっと気を張ってきたからです。";
  }

  if (trait === "attachment_anxiety") {
    return "あなたが不安になるのは弱いからではなく、大切なものを失いたくない気持ちを強く抱えてきたからです。";
  }

  if (trait === "role_pressure") {
    return "あなたが止まれないのは弱いからではなく、期待に応え続けながら自分を支えてきた時間が長かったからです。";
  }

  if (trait === "future_anxiety") {
    return "あなたが迷うのは弱いからではなく、ちゃんと生きようとしてきたからこそ不安が大きくなっているのです。";
  }

  if (trait === "identity_confusion") {
    return "あなたが苦しいのは弱いからではなく、自分を見失うほど周囲に合わせ続けてきたからかもしれません。";
  }

  if (trait === "emotional_fatigue") {
    return "あなたが限界を感じるのは弱いからではなく、ずっと耐えながら頑張り続けてきたからです。";
  }

  return "あなたが苦しいのは弱いからではなく、自分なりに心を守り続けてきたからです。";
}

function getCoreFear(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "本当は、『自分を出したら嫌われるかもしれない』という怖さが心の奥にあります。";
  }

  if (trait === "attachment_anxiety") {
    return "本当は、『大切な人に見捨てられるかもしれない』という怖さが深いところで反応しています。";
  }

  if (trait === "role_pressure") {
    return "本当は、『役に立てなくなったら価値がなくなる』という怖さを抱えている可能性があります。";
  }

  if (trait === "future_anxiety") {
    return "本当は、『選び間違えたら取り返しがつかない』という怖さが未来への不安を強めています。";
  }

  if (trait === "identity_confusion") {
    return "本当は、『このまま自分が分からないまま生きてしまう』という怖さが隠れているのかもしれません。";
  }

  if (trait === "emotional_fatigue") {
    return "本当は、『崩れたらもう戻れない』という怖さが、休むことさえ難しくしている可能性があります。";
  }

  return "本当は、心の奥で何かを失う怖さが静かに反応しているようです。";
}

function getEmotionalDefense(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "空気を読み、先回りして合わせることで、人間関係を壊さないように心を守ってきた可能性があります。";
  }

  if (trait === "attachment_anxiety") {
    return "深く傷つく前に距離を取ったり、不安を隠して平静を装うことで心を守ってきたようです。";
  }

  if (trait === "role_pressure") {
    return "止まらず頑張り続けることで、『必要とされなくなる怖さ』から自分を守ってきた可能性があります。";
  }

  if (trait === "future_anxiety") {
    return "考え続けることで失敗を避けようとし、不安そのものをコントロールしようとしてきた流れがあります。";
  }

  if (trait === "identity_confusion") {
    return "周囲に合わせ続けることで、否定されたり浮いてしまう怖さから自分を守ってきたのかもしれません。";
  }

  if (trait === "emotional_fatigue") {
    return "『大丈夫なふり』を続けることで、崩れてしまう怖さから心を支えてきた可能性があります。";
  }

  return "自分なりの方法で、心が壊れないように守り続けてきたようです。";
}

function getUnspokenDesire(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "本当は、『嫌われないこと』より『安心して素を出せる場所』を求めている可能性があります。";
  }

  if (trait === "attachment_anxiety") {
    return "本当は、『離れない保証』より、『不安になっても受け止めてもらえる感覚』を求めているのかもしれません。";
  }

  if (trait === "role_pressure") {
    return "本当は、『期待に応え続けること』より、『頑張らなくても価値が消えない感覚』を求めている可能性があります。";
  }

  if (trait === "future_anxiety") {
    return "本当は、『正しい未来』より、『少し安心できる今』を求めているのかもしれません。";
  }

  if (trait === "identity_confusion") {
    return "本当は、『自分を見つけること』より、『無理に演じなくていい時間』を求めている可能性があります。";
  }

  if (trait === "emotional_fatigue") {
    return "本当は、『もっと頑張ること』より、『安心して休める感覚』を求めているのかもしれません。";
  }

  return "本当は、無理をしなくても安心できる場所を求めているようです。";
}

function getSelfPerceptionGap(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return {
      outside: "周囲からは『気配りができる優しい人』に見えています。",
      inside: "けれど内側では、『嫌われないように頑張っている感覚』が強く残っています。",
    };
  }

  if (trait === "attachment_anxiety") {
    return {
      outside: "周囲からは『愛情深い人』に見えています。",
      inside: "けれど内側では、『見捨てられないか』をずっと警戒している部分があります。",
    };
  }

  if (trait === "role_pressure") {
    return {
      outside: "周囲からは『責任感が強い人』に見えています。",
      inside: "けれど内側では、『止まったら価値を失う』怖さを抱えている可能性があります。",
    };
  }

  if (trait === "future_anxiety") {
    return {
      outside: "周囲からは『真面目に将来を考えている人』に見えています。",
      inside: "けれど内側では、『間違えたら終わる』ような不安が大きくなっています。",
    };
  }

  if (trait === "identity_confusion") {
    return {
      outside: "周囲からは『普通に過ごしている人』に見えているかもしれません。",
      inside: "けれど内側では、『自分が何者なのか分からない感覚』が静かに続いています。",
    };
  }

  if (trait === "emotional_fatigue") {
    return {
      outside: "周囲からは『まだ頑張れている人』に見えています。",
      inside: "けれど内側では、『本当はかなり限界に近い』感覚が積み重なっています。",
    };
  }

  return {
    outside: "周囲からは落ち着いて見えているかもしれません。",
    inside: "けれど内側では、言葉にならない揺れが続いているようです。",
  };
}

function getHealingDirection(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "『嫌われないこと』ではなく、『自分が安心できる関係』を基準にしてもいい時期です。";
  }

  if (trait === "attachment_anxiety") {
    return "失わない努力より、『離れても自分は壊れない』感覚を少しずつ育てる時期かもしれません。";
  }

  if (trait === "role_pressure") {
    return "『止まったら価値がなくなる』という感覚を、そのまま信じ続けなくてもいい段階に来ています。";
  }

  if (trait === "future_anxiety") {
    return "正しい未来を急いで探すより、『今の自分が少し安心できる選択』を増やす方が大切な時期です。";
  }

  if (trait === "identity_confusion") {
    return "『本当の自分を見つけなければ』ではなく、『違和感を無視しない』ことから始めても大丈夫です。";
  }

  if (trait === "emotional_fatigue") {
    return "『まだ頑張れる』ではなく、『もう十分頑張ってきた』視点を少し取り戻す時期かもしれません。";
  }

  return "今は、自分を守る反応を責めるより、少し理解してあげることが大切な時期です。";
}

function getContradiction(compound) {
  const trait = compound.primaryTrait;

  if (trait === "people_pleasing") {
    return "本当は自分を優先したいのに、嫌われる怖さが先に動いてしまう矛盾があります。";
  }

  if (trait === "attachment_anxiety") {
    return "近づきたい気持ちと、傷つく前に離れたい気持ちが同時に存在しています。";
  }

  if (trait === "role_pressure") {
    return "休みたい気持ちがあるのに、止まった瞬間に価値を失うような怖さがあります。";
  }

  if (trait === "future_anxiety") {
    return "前に進みたいのに、失敗を想像すると動けなくなる矛盾があります。";
  }

  if (trait === "identity_confusion") {
    return "自分らしく生きたいのに、“本当の自分”が分からなくなる瞬間があります。";
  }

  if (trait === "emotional_fatigue") {
    return "もう限界に近いのに、『まだ頑張れる』と言い聞かせてしまう矛盾があります。";
  }

  return "心の中で、逆向きの感情が同時に動いているようです。";
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

function buildQuietHonestCoreNarrative(compound) {
  const trait = compound?.primaryTrait || "";

  if (trait === "emotional_fatigue") {
    return `頑張り続けることに慣れた感情の奥で、

休みたいという小さな願いが、
まだ静かに揺れているようでした。`;
  }

  if (trait === "people_pleasing") {
    return `誰かを優先してきた時間の奥で、

自分の声を消しきれない感覚が、
まだ静かに残っているようでした。`;
  }

  if (trait === "attachment_anxiety") {
    return `近づきたい気持ちの奥で、

離れることへの小さな怖さが、
まだ静かに揺れているようでした。`;
  }

  if (trait === "future_anxiety") {
    return `先のことを考えるほど、

安心したい感情が、
まだ言葉になる前の場所で揺れているようでした。`;
  }

  if (trait === "identity_confusion") {
    return `自分を決めきれない静けさの奥で、

無理に形を作らなくてもいい感覚が、
まだ小さく残っているようでした。`;
  }

  if (trait === "role_pressure") {
    return `役割を果たそうとしてきた時間の奥で、

少しだけ力を抜きたい感情が、
まだ静かに残っているようでした。`;
  }

  return `言葉になりきる前の本音が、

まだ少し内側で揺れているようでした。`;
}

function buildQuietHonestCoreNarrativeEn(compound, runtimeProfile = null) {
  const trait = compound?.primaryTrait || "";
  const style = runtimeProfile?.style || "softening";
  const pressure = runtimeProfile?.pressure || "soft-low";
  const voice = runtimeProfile?.voice || "quiet-direct";

  const quietEnding =
    pressure === "low" || voice === "quiet-protective"
      ? "It does not need to become louder to be real."
      : "It may be small, but it is still part of you.";

  if (trait === "emotional_fatigue") {
    return `Behind the part of you
that has grown used to keeping going,

there may be a quiet wish
to rest without having to explain why.

${quietEnding}`;
  }

  if (trait === "people_pleasing") {
    return `Behind all the times
you have chosen others first,

there may be a small voice
that has been waiting for room.

${quietEnding}`;
  }

  if (trait === "attachment_anxiety") {
    return `Behind the wish to move closer,

there may be a small fear
of being left before you feel safe.

${quietEnding}`;
  }

  if (trait === "future_anxiety") {
    return `Behind the thoughts
that keep reaching toward what comes next,

there may be a wish
for a place where your heart can stand safely.

${quietEnding}`;
  }

  if (trait === "identity_confusion") {
    return `Behind the uncertainty
of not being able to define yourself,

there may be a small outline
that has not asked to be rushed.

${quietEnding}`;
  }

  if (trait === "role_pressure") {
    return `Behind the part of you
that keeps trying to fulfill your role,

there may be a quieter feeling
that wants to put something down.

${quietEnding}`;
  }

  return `Before your honest feeling
becomes clear words,

something in you
may already be asking for a safer place.

${quietEnding}`;
}
function buildDynamicSign(compound) {
  return `今は、何を選ぶかよりも、なぜそこまで心が反応しているのかを見る時期です。
「${getTraitLabel(compound.primaryTrait)}」が出ている場所に、次のあなたへ進むための本音があります。`;
}

function buildReadingLead(compound) {
  return `これは、あなたを決めつけるための読みではありません。
今の心がどこで疲れ、どこでまだ耐えようとしているのかを、少し丁寧に見ていくためのものです。`;
}

function buildShortFortune(compound) {
  return `【読みはじめ】
${buildReadingLead(compound)}

【奥にある本音】
${buildDynamicOpening(compound)}

【揺れているもの】
${getContradiction(compound)}

【言葉になる前の願い】
${getUnspokenDesire(compound)}

【本音の中心】
${getNarrativeIntegration(compound)}

【最後に】
今は、無理に変わろうとするより、
まず『今までかなり頑張ってきた』ことを、自分自身が少し認めてあげる時期なのかもしれません。

【この先をさらに深く読むと】
この読みは、まだあなたの本音の入口です。
さらに深く読むことで、
『なぜそこまで耐えてしまうのか』
『心の奥で本当に怖れているもの』
まで見えてくる可能性があります。

【余韻】
${getAfterglowMessage("short", compound)}`;
}

function buildStandardFortune(compound) {
  const emotionTone = getEmotionTone(compound);

  return `【読みはじめ】
${buildReadingLead(compound)}

【奥にある本音】
${buildDynamicOpening(compound)}

【今の心】
今回の感情温度は「${getEmotionToneLabel(emotionTone)}」です。
${getEmotionTonePhrase(emotionTone)}

【揺れているもの】
${getContradiction(compound)}

【言葉になる前の願い】
${getUnspokenDesire(compound)}

【回復へ向かうための方向】
${getHealingDirection(compound)}

【本音の中心】
${getNarrativeIntegration(compound)}

【最後に】
焦って答えを出そうとしなくても大丈夫です。
今はまず、『本当はかなり頑張ってきた』自分に気づくことが大切な時期なのかもしれません。

【さらに深く読み進めると】
この先では、
『なぜ同じ苦しさを繰り返しやすいのか』
『心の奥で抱え続けてきたテーマ』
まで、さらに深く見えてくる可能性があります。

【余韻】
${getAfterglowMessage("standard", compound)}`;
}


function analyzeResponsePattern(answers = []) {
  const values = answers
    .map((a) => Number(a.value || 0))
    .filter((v) => !Number.isNaN(v));

  if (values.length === 0) {
    return {
      uniformity: 1,
      hesitation: 0,
      polarity: "neutral",
      temperature: "low",
      confidence: "low",
      responseStyle: "shallow",
    };
  }

  const uniqueCount = new Set(values).size;
  const neutralCount = values.filter((v) => v === 0).length;
  const positiveCount = values.filter((v) => v > 0).length;
  const negativeCount = values.filter((v) => v < 0).length;

  const average =
    values.reduce((sum, v) => sum + v, 0) / values.length;

  const intensity =
    values.reduce((sum, v) => sum + Math.abs(v), 0) /
    values.length;

  let polarity = "neutral";

  if (average >= 1) {
    polarity = "positive";
  } else if (average <= -1) {
    polarity = "negative";
  }

  let temperature = "middle";

  if (intensity >= 1.6) {
    temperature = "high";
  } else if (intensity <= 0.6) {
    temperature = "low";
  }

  const uniformity = uniqueCount === 1 ? 1 : 0;

  let confidence = "high";

  if (uniformity === 1) {
    confidence = "low";
  } else if (neutralCount >= values.length * 0.5) {
    confidence = "middle";
  }

  let responseStyle = "emotionally_open";

  if (uniformity === 1 && intensity >= 1.5) {
    responseStyle = "defensive";
    confidence = "low";
  } else if (neutralCount >= values.length * 0.6) {
    responseStyle = "shallow";
    confidence = "middle";
  } else if (uniqueCount >= 5 && neutralCount >= 1) {
    responseStyle = "fluctuating";
  } else if (positiveCount > 0 && negativeCount > 0 && uniqueCount >= 3) {
    responseStyle = "unstable";
  } else if (uniqueCount >= 4) {
    responseStyle = "fluctuating";
  } else if (temperature === "low") {
    responseStyle = "suppressed";
  }

  return {
    uniformity,
    hesitation: neutralCount,
    polarity,
    temperature,
    confidence,
    responseStyle,
    average,
    positiveCount,
    negativeCount,
    neutralCount,
    uniqueCount,
    intensity,
  };
}


function buildResponsePatternNarrative(responsePattern) {
  if (!responsePattern) {
    return "";
  }

  if (responsePattern.responseStyle === "defensive") {
    return `今回の回答には、
同じ方向へ強くそろう反応が出ています。

ただしそれは、
必ずしも感情がはっきりしているという意味ではありません。

むしろ今は、
迷いや弱さを見せないように、
心がひとつの答えに寄せている可能性もあります。

本音は、
強い答えの中ではなく、
その答えを選び続けた理由の奥に残っているのかもしれません。`;
  }

  if (responsePattern.responseStyle === "shallow") {
    return `今回の回答には、
まだ深く踏み込みきれない静かな距離感があります。

はっきり苦しいとも言い切れない。
でも、何も感じていないわけでもない。

そんな浅い揺れの奥に、
まだ言葉になる前の本音が眠っている可能性があります。`;
  }

  if (responsePattern.responseStyle === "unstable") {
    return `今回の回答には、
前に進みたい気持ちと、
立ち止まりたい気持ちが同時に出ています。

肯定と否定が混ざっているとき、
心はまだ一つの答えにまとまりきっていません。

でもその揺れは、
迷っている証拠であると同時に、
本音が動き始めているサインでもあります。`;
  }

  if (responsePattern.responseStyle === "fluctuating") {
    return `今回の回答には、
一定ではない感情の揺れが出ています。

ひとつの気持ちだけで答えているというより、
場面によって反応が変わる状態に近いようです。

その揺らぎの中に、
今のあなたが本当に見つめるべき違和感が隠れているのかもしれません。`;
  }

  if (responsePattern.responseStyle === "suppressed") {
    return `今回の回答には、
大きく動く感情よりも、
静かに抑えられた反応が見えます。

本当は感じているのに、
それを強い言葉にする前に、
心が少し距離を取っているのかもしれません。

今は無理に掘り起こすより、
その小さな反応を消さずに置いておくことが大切です。`;
  }

  if (responsePattern.confidence === "low") {
    return `まだ感情の輪郭がはっきり定まっていない可能性があります。

直感的に選んだ部分や、
まだ整理されていない気持ちも含まれているのかもしれません。

だからこそ今は、
無理に答えを断定するより、
心の揺れ方そのものを静かに見つめることが大切な段階のようです。`;
  }

  if (responsePattern.hesitation >= 5) {
    return `今のあなたは、
まだ自分の気持ちを完全には言葉にしきれていないようです。

苦しいとも言い切れない。
でも何もないとも言い切れない。

そんな曖昧な揺れが、
心の奥に静かに残っているのかもしれません。`;
  }

  if (responsePattern.temperature === "high") {
    return `今回の回答には、
比較的強い感情反応が表れていました。

見ないようにしてきた気持ちや、
抑え込んできた感情が、
少しずつ表に近づいている状態なのかもしれません。`;
  }

  return `今のあなたの心には、
まだ小さな揺れが残っています。

すぐに答えを決めなくても大丈夫です。
大切なのは、
その違和感を無かったことにしないことなのかもしれません。`;
}


function buildResponseStyleTraitNarrative(responsePattern, compound) {
  if (!responsePattern || !compound) {
    return "";
  }

  const style = responsePattern.responseStyle;
  const trait = compound.primaryTrait;

  if (style === "defensive" && trait === "people_pleasing") {
    return "嫌われないように、答えをひとつの方向へ揃えている可能性があります。本音より先に、関係を壊さないための反応が動いているのかもしれません。";
  }

  if (style === "defensive" && trait === "future_anxiety") {
    return "間違えないように、心が答えを固定しようとしている可能性があります。不安が強いときほど、揺れるより先に正解を探そうとしてしまうのかもしれません。";
  }

  if (style === "defensive" && trait === "emotional_fatigue") {
    return "もう揺れる余裕がなくて、心がひとつの答えに寄りかかっている可能性があります。強い答えの裏に、疲れを隠す反応が残っているのかもしれません。";
  }

  if (style === "shallow" && trait === "identity_confusion") {
    return "深く答えようとしても、自分の輪郭がまだ少し見えにくい状態かもしれません。曖昧さは弱さではなく、今の心がまだ安全な距離を探しているサインです。";
  }

  if (style === "shallow" && trait === "emotional_fatigue") {
    return "深く感じる前に、心が少し反応を薄くしている可能性があります。疲れが強いとき、人は苦しささえ静かに遠ざけようとすることがあります。";
  }

  if (style === "unstable" && trait === "attachment_anxiety") {
    return "近づきたい気持ちと、傷つく前に離れたい気持ちが交互に動いている可能性があります。揺れているのは、誰かを求める気持ちがまだ消えていないからかもしれません。";
  }

  if (style === "unstable" && trait === "future_anxiety") {
    return "進みたい気持ちと、失敗を避けたい気持ちが同時に動いているようです。未来を考えるほど、心が前後に揺れやすくなっているのかもしれません。";
  }

  if (style === "fluctuating" && trait === "identity_confusion") {
    return "答えが揺れているのは、自分の本音がないからではなく、いくつもの自分が同時に反応しているからかもしれません。今はひとつに絞るより、揺れの幅を見ることが大切です。";
  }

  if (style === "fluctuating" && trait === "people_pleasing") {
    return "相手に合わせる自分と、本当は自分を優先したい自分が交互に顔を出している可能性があります。その揺れの中に、今まで後回しにしてきた本音が残っています。";
  }

  if (style === "suppressed" && trait === "people_pleasing") {
    return "本音を出す前に、先に空気を読んでしまう反応があるようです。感じていないのではなく、感じたことを表に出す前に抑えているのかもしれません。";
  }

  if (style === "suppressed" && trait === "role_pressure") {
    return "弱音を出す前に、役割を優先してしまう反応があるようです。本当は休みたいのに、止まることへの怖さが先に立っているのかもしれません。";
  }

  return "今回の回答には、今の心が自分を守ろうとする反応も含まれています。大切なのは、その反応を責めることではなく、なぜそう答えたくなったのかを静かに見ていくことです。";
}

function buildContinuityNarrative(responsePattern, previousResponseStyle = null, previousEmotionTone = null) {
  if (!responsePattern || (!previousResponseStyle && !previousEmotionTone)) {
    return "今回は、今この瞬間の心の反応を中心に読んでいます。次にまた読みを重ねることで、感情がどこで揺れ、どこで少し動き始めたのかが見えやすくなります。";
  }

  const currentStyle = responsePattern.responseStyle;
  const currentTone = responsePattern.temperature;

  if (previousResponseStyle === "defensive" && currentStyle === "fluctuating") {
    return "前回よりも、心の反応に少し幅が出てきています。ひとつの答えで守る段階から、揺れそのものを少し見られる段階へ移り始めているのかもしれません。";
  }

  if (previousResponseStyle === "shallow" && currentStyle === "unstable") {
    return "前回よりも、感情の奥にあった迷いが表に出てきています。静かに距離を取っていた心が、少しずつ本音の近くで揺れ始めている可能性があります。";
  }

  if (previousResponseStyle === "unstable" && currentStyle === "defensive") {
    return "前回は揺れが表に出ていましたが、今回は心が少し守りを強めているようです。感情が消えたのではなく、見つめるには少し負荷が大きくなっているのかもしれません。";
  }

  if (previousResponseStyle === currentStyle) {
    return "前回と似た反応が続いています。同じ場所で心が反応しているなら、そこにはまだ言葉になりきっていない本音が残っている可能性があります。";
  }

  if (previousEmotionTone && previousEmotionTone !== currentTone) {
    return "前回とは、感情の温度に少し変化があります。大きな変化ではなくても、心が同じ場所に留まり続けていないサインかもしれません。";
  }

  return "前回とは少し違う反応が出ています。答えが変わったことよりも、どこで心が動いたのかを見ることが、今の本音に近づく手がかりになります。";
}

function buildRecoveryTrajectory(responsePattern, previousResponseStyle = null) {
  if (!responsePattern || !previousResponseStyle) {
    return "今回はまだ前回との比較ではなく、今の心の反応を静かに見ている段階です。読みを重ねることで、回復の方向や揺り戻しが少しずつ見えやすくなります。";
  }

  const current = responsePattern.responseStyle;

  if (previousResponseStyle === "defensive" && current === "fluctuating") {
    return "心は、強く閉じる段階から、少しずつ揺れを見始める段階へ移り始めている可能性があります。";
  }

  if (previousResponseStyle === "suppressed" && current === "fluctuating") {
    return "静かに抑えていた感情が、少しずつ表に近づいている流れがあります。";
  }

  if (previousResponseStyle === "fluctuating" && current === "unstable") {
    return "感情の揺れが、より具体的な迷いや葛藤として表に出始めている可能性があります。";
  }

  if (previousResponseStyle === "unstable" && current === "defensive") {
    return "揺れが大きくなったぶん、心が再び防御を強めている可能性があります。ただ、それは後退ではなく、見え始めた本音をもう一度守ろうとする自然な揺り戻しかもしれません。";
  }

  if (previousResponseStyle === "fluctuating" && current === "defensive") {
    return "前回は揺れを見られていた心が、今回は少し守りを強めています。これは悪化というより、触れた本音が大きかったぶん、一度距離を取り直している状態かもしれません。";
  }

  if (previousResponseStyle === "shallow" && current === "defensive") {
    return "前回は浅い距離で保っていた心が、今回は少し強く守りに入っています。まだ本音に触れるには怖さがあり、心が安全な場所を探しているのかもしれません。";
  }

  if (previousResponseStyle === current) {
    return "大きな変化はまだありませんが、同じ場所で心が反応し続けている状態かもしれません。";
  }

  return "心の反応には、少しずつ変化の流れが出始めています。";
}

function buildTrustProgression(responsePattern, previousResponseStyle = null) {
  if (!responsePattern || !previousResponseStyle) {
    return "今回はまだ、読みへの近づき方を判断するための前回情報がありません。次にまた読みを重ねることで、心がどれくらい本音に近づけているかを見やすくなります。";
  }

  const current = responsePattern.responseStyle;

  if (previousResponseStyle === "shallow" && current === "fluctuating") {
    return "前回よりも、心が少しだけ読みの中で動き始めています。深く踏み込まない距離から、揺れを少し見せられる距離へ近づいているのかもしれません。";
  }

  if (previousResponseStyle === "shallow" && current === "unstable") {
    return "前回よりも、隠れていた迷いが表に出てきています。心が少しずつ、本音に近い場所まで降りてきている可能性があります。";
  }

  if (previousResponseStyle === "defensive" && current === "shallow") {
    return "強く守っていた状態から、少しだけ距離を取って眺める状態へ変わっています。まだ深くは触れなくても、心が安全な見方を探しているのかもしれません。";
  }

  if (previousResponseStyle === "defensive" && current === "unstable") {
    return "前回よりも、守りの奥にあった葛藤が表に出始めています。強く閉じていた心が、少しだけ本音の揺れを見せ始めている可能性があります。";
  }

  if (previousResponseStyle === "suppressed" && current === "unstable") {
    return "抑えていた感情が、迷いや葛藤として少し表に出てきています。これは乱れではなく、心が沈黙だけでは抱えきれなくなってきたサインかもしれません。";
  }

  return "前回と比べて、読みへの近づき方には小さな変化があります。大きく開いたわけではなくても、心は自分の反応を少しずつ確かめながら、今見ても大丈夫な距離を探しているようです。";
}

function buildEmotionalMaskingNarrative(responsePattern) {
  if (!responsePattern) {
    return "";
  }

  const {
    responseStyle,
    confidence,
    intensity,
    temperature,
    hesitation,
  } = responsePattern;

  if (
    responseStyle === "defensive" &&
    confidence === "low" &&
    intensity >= 1.5
  ) {
    return "感情は強く出ていますが、その一方で、本音そのものはまだ深い場所に隠れている可能性があります。強い答えは、『本当の気持ち』というより、『そうであろうとする心』の反応なのかもしれません。";
  }

  if (
    responseStyle === "shallow" &&
    hesitation >= 3 &&
    temperature === "low"
  ) {
    return "今は感情を感じていないというより、感じる前に少し距離を置いている状態に近いようです。心が静かなままなのは、安全な距離を保とうとしているからかもしれません。";
  }

  if (
    responseStyle === "unstable" &&
    confidence === "high"
  ) {
    return "揺れている感情を、今回は比較的そのまま見せられている状態かもしれません。迷いはありますが、心は以前より本音を隠し切らなくなってきています。";
  }

  if (
    responseStyle === "fluctuating" &&
    confidence === "high"
  ) {
    return "感情はまだ揺れていますが、その揺れ自体を少しずつ認識でき始めている可能性があります。隠すことより、『何に揺れているのか』を見る段階へ近づいているのかもしれません。";
  }

  return "今回の回答には、感情を守りながら見せている部分と、まだ隠している部分が同時に含まれているようです。";
}

function getOpennessState(responsePattern) {
  if (!responsePattern) {
    return "unknown";
  }

  const style = responsePattern.responseStyle;
  const confidence = responsePattern.confidence;
  const hesitation = Number(responsePattern.hesitation || 0);
  const uniformity = Number(responsePattern.uniformity || 0);

  if (style === "defensive" || (uniformity === 1 && confidence === "low")) {
    return "guarded";
  }

  if (style === "shallow" || hesitation >= 5) {
    return "distant";
  }

  if (style === "fluctuating") {
    return "opening";
  }

  if (style === "unstable") {
    return "exposed";
  }

  if (style === "suppressed") {
    return "quiet";
  }

  return "opening";
}

function getOpennessLabel(opennessState) {
  const labels = {
    guarded: "守りながら近づいている状態",
    distant: "まだ距離を保っている状態",
    opening: "少しずつ開き始めている状態",
    exposed: "本音の近くで揺れている状態",
    quiet: "静かに抑えている状態",
    unknown: "まだ読み取る途中の状態",
  };

  return labels[opennessState] || labels.unknown;
}

function buildOpennessNarrative(responsePattern) {
  const opennessState = getOpennessState(responsePattern);

  if (opennessState === "guarded") {
    return "今の心は、本音に近づきたい気持ちを持ちながらも、まだ強く自分を守っています。無理に開くより、守っている理由を静かに見る段階です。";
  }

  if (opennessState === "distant") {
    return "今はまだ、深く踏み込むより少し距離を保ちながら見ている状態です。その距離は拒絶ではなく、心が安全を確かめている時間なのかもしれません。";
  }

  if (opennessState === "opening") {
    return "心は少しずつ、本音の近くへ動き始めています。まだ揺れはありますが、その揺れを感じられていること自体が、開き始めのサインかもしれません。";
  }

  if (opennessState === "exposed") {
    return "本音に近い場所まで感情が出てきています。少し不安定に感じるとしても、それは心が隠しきれなくなった大切な反応かもしれません。";
  }

  if (opennessState === "quiet") {
    return "心はまだ静かに抑えながら反応しています。大きく揺れていないように見えても、奥では小さな本音が動いている可能性があります。";
  }

  return "今の心は、まだ読み取る途中にあります。焦らず、反応の強さよりも、どこに違和感が残るかを見ることが大切です。";
}

function buildContradictionPersistence(compound, previousPrimaryTrait = null) {
  if (!compound) {
    return "";
  }

  const currentTrait = compound.primaryTrait;

  if (!previousPrimaryTrait) {
    return "今回はまだ、前回から続いている矛盾までは判断していません。ただ、今回強く反応しているテーマは、今の心が見落とせない場所を示している可能性があります。";
  }

  if (previousPrimaryTrait === currentTrait) {
    return "前回と同じ本音のテーマが続いています。これは停滞ではなく、心が同じ場所を何度も見ようとしているサインかもしれません。今の中心課題として、少し丁寧に扱う価値があります。";
  }

  if (previousPrimaryTrait !== currentTrait) {
    return "前回とは違う本音のテーマが表に出ています。心の中心が変わったというより、別の層にあった違和感が今回は前に出てきた可能性があります。";
  }

  return "今回の矛盾は、今の心が何を守り、何を求めているかを知るための手がかりになりそうです。";
}

function buildRepeatSessionMemoryNarrative(responsePattern, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length === 0) {
    return "今回はまだ、過去の読みとの連続までは見ていません。読みを重ねることで、心がどこで繰り返し反応し、どこで少し変わり始めているのかが見えやすくなります。";
  }

  const currentStyle = responsePattern.responseStyle;
  const styles = previousPatterns
    .map((p) => p?.responseStyle || p?.style || null)
    .filter(Boolean);

  if (styles.length === 0) {
    return "過去の読みはありますが、まだ反応の型までは十分に比較できません。次の読みから、心の動き方が少しずつ見えやすくなります。";
  }

  const allStyles = [...styles, currentStyle];
  const uniqueStyles = new Set(allStyles);

  if (uniqueStyles.size === 1) {
    return "過去から今回まで、似た反応が続いています。これは停滞ではなく、心が同じ場所を何度も確認しようとしている可能性があります。";
  }

  if (styles.includes("defensive") && currentStyle === "fluctuating") {
    return "これまで守りが強かった心に、今回は少し揺れが出ています。閉じていた場所が、少しずつ動き始めている流れかもしれません。";
  }

  if (styles.includes("shallow") && (currentStyle === "fluctuating" || currentStyle === "unstable")) {
    return "これまで距離を保っていた心が、今回は少し深い反応を見せ始めています。読みを重ねる中で、本音の近くまで降りてきている可能性があります。";
  }

  if (styles.includes("fluctuating") && currentStyle === "defensive") {
    return "以前は揺れを見せていた心が、今回は少し守りを強めています。これは後退ではなく、本音に近づいたあとに一度距離を取り直す自然な流れかもしれません。";
  }

  return "過去の読みと今回の読みを比べると、心の反応には少しずつ違いが出ています。大切なのは、答えが変わったことより、どの感情が繰り返し出ているかを見ることです。";
}

function getTrustDepthState(responsePattern, previousPatterns = []) {
  if (!responsePattern) {
    return "unknown";
  }

  const currentStyle = responsePattern.responseStyle;
  const opennessState = getOpennessState(responsePattern);
  const styles = Array.isArray(previousPatterns)
    ? previousPatterns.map((p) => p?.responseStyle || p?.style || null).filter(Boolean)
    : [];

  if (currentStyle === "defensive" || opennessState === "guarded") {
    return "cautious";
  }

  if (currentStyle === "shallow" || opennessState === "distant") {
    return "surface";
  }

  if (
    styles.includes("defensive") &&
    (currentStyle === "fluctuating" || currentStyle === "unstable")
  ) {
    return "deepening";
  }

  if (currentStyle === "fluctuating" || opennessState === "opening") {
    return "engaged";
  }

  if (currentStyle === "unstable" || opennessState === "exposed") {
    return "deepening";
  }

  return "engaged";
}

function getTrustDepthLabel(trustDepthState) {
  const labels = {
    surface: "まだ浅い距離で見ている段階",
    cautious: "慎重に心を守りながら見ている段階",
    engaged: "少しずつ読みの中に入っている段階",
    deepening: "本音の近くまで降りてきている段階",
    unknown: "まだ判断途中の段階",
  };

  return labels[trustDepthState] || labels.unknown;
}


function buildEmotionalContactNarrative(
  responsePattern,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern) {
    return "感情は、まだ静かに揺れ方を探している途中のようでした。";
  }

  const opennessState = getOpennessState(responsePattern);
  const trustDepthState = getTrustDepthState(responsePattern, previousPatterns);
  const silenceStyle = silencePattern?.silenceStyle || "none";
  const style = responsePattern.responseStyle;

  if (
    style === "defensive" ||
    opennessState === "guarded" ||
    trustDepthState === "cautious"
  ) {
    return `感情は、
急に近づこうとするより、

まだ少し、
触れ方を確かめながら動いているようでした。

強く閉じているというより、
傷つかない距離を静かに測っているのかもしれません。`;
  }

  if (
    style === "shallow" ||
    opennessState === "distant"
  ) {
    return `今の感情は、
深く入り込むより、

少し距離を保ちながら、
静かに様子を見ているようでした。

その距離もまた、
心が安全を確かめるための反応なのかもしれません。`;
  }

  if (
    style === "unstable" ||
    style === "fluctuating"
  ) {
    return `近づきたい気持ちと、
まだ慎重でいたい感覚が、

心の中で静かに揺れているようでした。

揺れているのは、
感情が動き始めている途中だからかもしれません。`;
  }

  if (
    silenceStyle === "strong_avoidance" ||
    silenceStyle === "partial_avoidance"
  ) {
    return `まだ言葉になりきらない感情が、
少し内側に残っているようでした。

触れないまま置かれている場所にも、
今の心の温度が残っているのかもしれません。`;
  }

  return `感情は、
まだ無理に答えを決めようとはせず、

どこまで近づいても大丈夫そうかを、
静かに確かめているようでした。`;
}
function buildEmotionalContactNarrativeEn(
  responsePattern,
  silencePattern,
  previousPatterns = [],
  compound = null,
  runtimeProfile = null
) {
  if (!responsePattern) {
    return "You may still be looking for a safe way to stay with this feeling.";
  }

  const opennessState = getOpennessState(responsePattern);
  const trustDepthState = getTrustDepthState(responsePattern, previousPatterns);
  const silenceStyle = silencePattern?.silenceStyle || "none";
  const style = responsePattern.responseStyle;
  const trait = compound?.primaryTrait || "";
  const distance = runtimeProfile?.distance || "soft";
  const voice = runtimeProfile?.voice || "quiet-direct";
  const pressure = runtimeProfile?.pressure || "soft-low";

  const guardedOpenings = {
    emotional_fatigue: [
      "You do not seem to be letting yourself come too close to this feeling all at once.",
      "",
      "Part of you may be checking how much strength is still available.",
      "",
      "That distance may be less about closing off,",
      "and more about protecting a small place to rest.",
    ],
    people_pleasing: [
      "You do not seem to be letting this feeling come forward all at once.",
      "",
      "Part of you may be checking whether your own voice can stay safe near others.",
      "",
      "That distance may be less about hiding,",
      "and more about finding a place where you can still belong to yourself.",
    ],
    identity_confusion: [
      "You do not seem to be forcing this feeling to become clear all at once.",
      "",
      "Part of you may be checking whether its outline can appear safely.",
      "",
      "That distance may be less about being closed,",
      "and more about refusing a shape that does not fit.",
    ],
    future_anxiety: [
      "You do not seem to be stepping all the way into this feeling yet.",
      "",
      "Part of you may be checking whether the next step can feel safe enough.",
      "",
      "That distance may be less about avoiding the future,",
      "and more about needing enough ground before moving.",
    ],
    role_pressure: [
      "You do not seem to be setting everything down all at once.",
      "",
      "Part of you may be checking what can be released safely.",
      "",
      "That distance may be less about refusing responsibility,",
      "and more about learning that not everything has to stay in your hands.",
    ],
  };

  const guardedFallback = [
    "You do not seem to be letting the feeling come closer all at once.",
    "",
    "Part of you may be checking how close it can come and still feel safe.",
    "",
    "That distance may be less about being closed,",
    "and more about protecting the place that still feels tender.",
  ];

  if (
    style === "defensive" ||
    opennessState === "guarded" ||
    trustDepthState === "cautious" ||
    distance === "near-but-safe" ||
    pressure === "low"
  ) {
    return (guardedOpenings[trait] || guardedFallback).join("\n");
  }

  if (
    style === "shallow" ||
    opennessState === "distant"
  ) {
    return [
      "You may still be staying a little outside the feeling for now.",
      "",
      "Rather than going deeply inward,",
      "part of you may be keeping enough distance to feel safe.",
      "",
      "That distance can also be one way your heart checks the ground.",
    ].join("\n");
  }

  if (
    style === "unstable" ||
    style === "fluctuating"
  ) {
    return [
      "A wish to come closer",
      "and a need to stay careful",
      "may be moving in the same place.",
      "",
      "That wavering may be happening",
      "because the feeling has begun to move.",
    ].join("\n");
  }

  if (
    silenceStyle === "strong_avoidance" ||
    silenceStyle === "partial_avoidance" ||
    voice === "quiet-protective"
  ) {
    return [
      "Some part of this feeling",
      "may still be staying just outside words.",
      "",
      "Even in the place left untouched,",
      "something in you may still be keeping watch.",
    ].join("\n");
  }

  return [
    "You do not seem to be forcing this feeling toward an answer yet.",
    "",
    "Part of you may be checking",
    "how close it can come and still feel safe.",
  ].join("\n");
}
function buildTrustDepthNarrative(responsePattern, previousPatterns = []) {
  const trustDepthState = getTrustDepthState(responsePattern, previousPatterns);

  if (trustDepthState === "surface") {
    return "今はまだ、深く入り込むよりも少し離れた場所から自分を見る段階です。その距離は悪いものではなく、心が安全を確かめるための余白です。";
  }

  if (trustDepthState === "cautious") {
    return "今の心は、読みへ近づきたい気持ちを持ちながらも、まだ慎重に自分を守っています。無理に開くより、守りながら見ていること自体を大切にしてよさそうです。";
  }

  if (trustDepthState === "engaged") {
    return "心は少しずつ、読みの中で動き始めています。まだ全部を見せているわけではなくても、自分の揺れを見ようとする力が出てきています。";
  }

  if (trustDepthState === "deepening") {
    return "今回は、本音の近くまで心が降りてきている可能性があります。少し不安定に感じるとしても、それは深い場所に触れ始めているサインかもしれません。";
  }

  return "今の心は、まだ読みとの距離を探している途中です。焦らず、どこまで見ても大丈夫そうかを確かめることが大切です。";
}

function analyzeSilencePattern(answers = [], expectedCount = 15) {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const answeredCount = safeAnswers.length;
  const missingCount = Math.max(0, expectedCount - answeredCount);
  const missingRatio = expectedCount > 0 ? missingCount / expectedCount : 0;

  let silenceStyle = "none";

  if (missingRatio >= 0.6) {
    silenceStyle = "strong_avoidance";
  } else if (missingRatio >= 0.35) {
    silenceStyle = "partial_avoidance";
  } else if (missingRatio > 0) {
    silenceStyle = "light_gap";
  }

  return {
    expectedCount,
    answeredCount,
    missingCount,
    missingRatio,
    silenceStyle,
  };
}

function buildSilencePatternNarrative(silencePattern) {
  if (!silencePattern || silencePattern.silenceStyle === "none") {
    return "今回は、答えなかった場所よりも、答えた反応の中に今の心の動きが出ています。";
  }

  if (silencePattern.silenceStyle === "strong_avoidance") {
    return "今回は、答えがまだ届いていない部分が多くあります。それは拒否ではなく、心がまだ深く触れる準備をしていない場所があるというサインかもしれません。";
  }

  if (silencePattern.silenceStyle === "partial_avoidance") {
    return "いくつかの問いには、まだ心が距離を置いているようです。答えなかった場所にも、今は言葉にしきれない本音が残っている可能性があります。";
  }

  if (silencePattern.silenceStyle === "light_gap") {
    return "一部に、まだ言葉になっていない余白があります。その小さな抜けは、見落としではなく、心が少しだけ守っている場所かもしれません。";
  }

  return "答えた場所と答えなかった場所の両方に、今の心の反応が残っています。";
}

function getLastPreviousPattern(previousPatterns = []) {
  if (!Array.isArray(previousPatterns) || previousPatterns.length === 0) {
    return null;
  }

  return previousPatterns[previousPatterns.length - 1] || null;
}

function getOpennessDrift(currentOpennessState, previousOpennessState = null) {
  if (!previousOpennessState) {
    return "first_observation";
  }

  const order = {
    guarded: 1,
    distant: 2,
    quiet: 2,
    opening: 3,
    exposed: 4,
    unknown: 0,
  };

  const current = order[currentOpennessState] || 0;
  const previous = order[previousOpennessState] || 0;

  if (current === 0 || previous === 0) {
    return "unclear";
  }

  if (current > previous) {
    return "slightly_opening";
  }

  if (current < previous) {
    return "protective_retreat";
  }

  if (currentOpennessState === "guarded") {
    return "stable_guarded";
  }

  if (currentOpennessState === "distant" || currentOpennessState === "quiet") {
    return "stable_distance";
  }

  return "stable_opening";
}

function getTrustDrift(currentTrustDepthState, previousTrustDepthState = null) {
  if (!previousTrustDepthState) {
    return "first_observation";
  }

  const order = {
    surface: 1,
    cautious: 1,
    engaged: 2,
    deepening: 3,
    unknown: 0,
  };

  const current = order[currentTrustDepthState] || 0;
  const previous = order[previousTrustDepthState] || 0;

  if (current === 0 || previous === 0) {
    return "unclear";
  }

  if (current > previous) {
    return "closer_to_reading";
  }

  if (current < previous) {
    return "needs_more_safety";
  }

  return "stable_distance";
}

function getSilenceDrift(currentSilencePattern, previousSilencePattern = null) {
  if (!previousSilencePattern) {
    return "first_observation";
  }

  const order = {
    none: 0,
    light_gap: 1,
    partial_avoidance: 2,
    strong_avoidance: 3,
  };

  const currentStyle = currentSilencePattern?.silenceStyle || "none";
  const previousStyle = previousSilencePattern?.silenceStyle || previousSilencePattern || "none";

  const current = order[currentStyle] ?? 0;
  const previous = order[previousStyle] ?? 0;

  if (current > previous) {
    return "more_silence";
  }

  if (current < previous) {
    return "less_silence";
  }

  if (currentStyle === "strong_avoidance") {
    return "stable_deep_silence";
  }

  if (currentStyle === "partial_avoidance" || currentStyle === "light_gap") {
    return "stable_partial_silence";
  }

  return "stable_answering";
}

function analyzeEmotionalDrift(responsePattern, silencePattern, previousPatterns = []) {
  const previous = getLastPreviousPattern(previousPatterns);

  const currentOpennessState = getOpennessState(responsePattern);
  const currentTrustDepthState = getTrustDepthState(responsePattern, previousPatterns);

  const previousOpennessState =
    previous?.opennessState ||
    previous?.openness ||
    null;

  const previousTrustDepthState =
    previous?.trustDepthState ||
    previous?.trustDepth ||
    null;

  const previousSilencePattern =
    previous?.silencePattern ||
    previous?.silenceStyle ||
    null;

  const opennessDrift = getOpennessDrift(currentOpennessState, previousOpennessState);
  const trustDrift = getTrustDrift(currentTrustDepthState, previousTrustDepthState);
  const silenceDrift = getSilenceDrift(silencePattern, previousSilencePattern);

  return {
    currentOpennessState,
    previousOpennessState,
    opennessDrift,
    currentTrustDepthState,
    previousTrustDepthState,
    trustDrift,
    currentSilenceStyle: silencePattern?.silenceStyle || "none",
    previousSilenceStyle:
      previousSilencePattern?.silenceStyle ||
      previousSilencePattern ||
      null,
    silenceDrift,
  };
}


function buildIntegratedEmotionMovementNarrative(
  driftState,
  sessionSummary,
  relapseState,
  stabilizationState
) {
  return `前回よりも、心が少し距離を取り直しているようです。

最近の読みでは、まだ慎重に距離を取りながら反応している流れがあります。

少し触れられたあとで、もう一度安全な場所を確かめ直そうとする動きも見えています。

それは停滞というより、心が今の距離を静かに確かめている流れなのかもしれません。`;
}
function buildEmotionalDriftNarrative(emotionalDrift) {
  if (!emotionalDrift || emotionalDrift.opennessDrift === "first_observation") {
    return "今回はまだ、前回からの移動ではなく、今この瞬間の心の距離を見ています。次に読みを重ねることで、心が近づいたのか、距離を取ったのか、静かに見えやすくなります。";
  }

  if (
    emotionalDrift.opennessDrift === "slightly_opening" &&
    emotionalDrift.trustDrift === "closer_to_reading"
  ) {
    return "前回よりも、心が少しだけ本音の近くへ動いているようです。ただし、それは無理に開いたというより、安全を確かめながら、ほんの少し触れられる場所が増えた状態かもしれません。";
  }

  if (
    emotionalDrift.opennessDrift === "protective_retreat" ||
    emotionalDrift.trustDrift === "needs_more_safety"
  ) {
    return "前回よりも、心が少し距離を取り直しているようです。これは悪化ではなく、触れた感情が大きかったぶん、もう一度安全な場所を確かめている反応かもしれません。";
  }

  if (emotionalDrift.silenceDrift === "more_silence") {
    return "今回は、前回よりも答えない余白が少し増えています。それは拒否ではなく、まだ言葉にするには早い場所を、心が静かに守っている可能性があります。";
  }

  if (emotionalDrift.silenceDrift === "less_silence") {
    return "前回よりも、少しだけ答えられる場所が増えています。大きな変化ではなくても、心が完全には閉じず、触れてもよい範囲を探し始めているのかもしれません。";
  }

  if (
    emotionalDrift.opennessDrift === "stable_guarded" ||
    emotionalDrift.silenceDrift === "stable_deep_silence"
  ) {
    return "前回と同じように、心はまだ慎重に自分を守っています。同じ場所に留まっているように見えても、そこにはまだ急がず扱うべき本音が残っている可能性があります。";
  }

  return "前回と今回を比べると、心の距離には小さな移動があります。大切なのは、良くなったか悪くなったかではなく、どこで近づき、どこで守り直したのかを静かに見ることです。";
}

function buildSessionDriftSummary(responsePattern, compound, silencePattern, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return "まだ読みの回数は多くありません。今は長い流れを決めつけるより、今回と前回の間にある小さな変化を静かに見ている段階です。";
  }

  const styles = previousPatterns
    .map((p) => p?.responseStyle || p?.style || null)
    .filter(Boolean);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const opennessStates = previousPatterns
    .map((p) => p?.opennessState || p?.openness || null)
    .filter(Boolean);

  const trustStates = previousPatterns
    .map((p) => p?.trustDepthState || p?.trustDepth || null)
    .filter(Boolean);

  const silenceStyles = previousPatterns
    .map((p) => p?.silenceStyle || p?.silencePattern?.silenceStyle || null)
    .filter(Boolean);

  const currentStyle = responsePattern.responseStyle;
  const currentTrait = compound?.primaryTrait || null;
  const currentOpenness = getOpennessState(responsePattern);
  const currentTrust = getTrustDepthState(responsePattern, previousPatterns);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const recentStyles = [...styles, currentStyle].filter(Boolean);
  const recentTraits = [...traits, currentTrait].filter(Boolean);
  const recentOpenness = [...opennessStates, currentOpenness].filter(Boolean);
  const recentTrust = [...trustStates, currentTrust].filter(Boolean);
  const recentSilence = [...silenceStyles, currentSilence].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const mostFrequent = (items) => {
    const counts = countBy(items);
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
  };

  const dominantTrait = mostFrequent(recentTraits);
  const guardedCount = recentOpenness.filter((v) => v === "guarded" || v === "distant" || v === "quiet").length;
  const openingCount = recentOpenness.filter((v) => v === "opening" || v === "exposed").length;
  const cautiousCount = recentTrust.filter((v) => v === "surface" || v === "cautious").length;
  const engagedCount = recentTrust.filter((v) => v === "engaged" || v === "deepening").length;
  const silenceCount = recentSilence.filter((v) => v === "strong_avoidance" || v === "partial_avoidance").length;
  const expressiveCount = recentStyles.filter((v) => v === "fluctuating" || v === "unstable").length;
  const defensiveCount = recentStyles.filter((v) => v === "defensive" || v === "suppressed" || v === "shallow").length;

  if (openingCount > guardedCount && engagedCount >= cautiousCount) {
    return "最近の読みでは、心が少しずつ防御だけではなく、自分の揺れそのものを見ようとする方向へ動いているようです。大きく開いたというより、見ても大丈夫な範囲を少しずつ確かめている流れに近いかもしれません。";
  }

  if (guardedCount > openingCount && silenceCount >= 2) {
    return "最近の読みでは、心がまだ慎重に距離を取りながら反応している流れがあります。それは停滞ではなく、触れるにはまだ早い感情を、無理に言葉へ変えないよう守っている状態かもしれません。";
  }

  if (expressiveCount > defensiveCount) {
    return "最近の読みでは、感情をひとつの形に閉じ込めるより、揺れたまま見せる反応が少し増えています。まだ答えは定まっていなくても、本音の近くで動いている部分があるようです。";
  }

  if (defensiveCount >= expressiveCount && dominantTrait) {
    return "最近の読みでは、同じ本音のテーマに何度か触れているようです。これは固定された性格ではなく、今の心が繰り返し大切に扱おうとしている場所なのかもしれません。";
  }

  return "最近の読みには、はっきりした変化というより、小さな揺れの積み重なりが見えます。急いで意味を決めるより、どの反応が繰り返し出ているのかを静かに見ていく段階です。";
}

function analyzeEmotionalRelapse(responsePattern, silencePattern, previousPatterns = []) {
  const previous = getLastPreviousPattern(previousPatterns);

  if (!responsePattern || !previous) {
    return {
      state: "first_observation",
      hasRelapseSignal: false,
      reason: "not_enough_history",
    };
  }

  const currentOpenness = getOpennessState(responsePattern);
  const currentTrust = getTrustDepthState(responsePattern, previousPatterns);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const previousOpenness =
    previous?.opennessState ||
    previous?.openness ||
    null;

  const previousTrust =
    previous?.trustDepthState ||
    previous?.trustDepth ||
    null;

  const previousSilence =
    previous?.silenceStyle ||
    previous?.silencePattern?.silenceStyle ||
    "none";

  const opennessDrift = getOpennessDrift(currentOpenness, previousOpenness);
  const trustDrift = getTrustDrift(currentTrust, previousTrust);
  const silenceDrift = getSilenceDrift(silencePattern, previousSilence);

  const protectiveRetreat =
    opennessDrift === "protective_retreat" ||
    trustDrift === "needs_more_safety";

  const silenceIncreased =
    silenceDrift === "more_silence";

  const currentStyle = responsePattern.responseStyle;
  const defensiveStyle =
    currentStyle === "defensive" ||
    currentStyle === "suppressed" ||
    currentStyle === "shallow";

  if (protectiveRetreat && silenceIncreased) {
    return {
      state: "strong_protective_return",
      hasRelapseSignal: true,
      reason: "retreat_and_silence_increased",
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  if (protectiveRetreat && defensiveStyle) {
    return {
      state: "soft_protective_return",
      hasRelapseSignal: true,
      reason: "retreat_and_defensive_style",
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  if (silenceIncreased && defensiveStyle) {
    return {
      state: "silence_return",
      hasRelapseSignal: true,
      reason: "silence_and_defensive_style",
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  return {
    state: "no_clear_relapse",
    hasRelapseSignal: false,
    reason: "no_compound_retreat_signal",
    opennessDrift,
    trustDrift,
    silenceDrift,
  };
}

function buildEmotionalRelapseNarrative(relapseState) {
  if (!relapseState || relapseState.state === "first_observation") {
    return "今回はまだ、揺り戻しとして読むほどの履歴はありません。今はこの瞬間の心の距離を、静かに見ている段階です。";
  }

  if (relapseState.state === "strong_protective_return") {
    return "少し触れられた後で、心がもう一度距離を取り始めているようです。それは失敗ではなく、触れた感情が大きかったぶん、安全な場所を確かめ直している流れかもしれません。";
  }

  if (relapseState.state === "soft_protective_return") {
    return "前より閉じたように見える反応が少しあります。ただ、それは後退というより、心が本音に近づく前に、もう一度自分を守る姿勢を取り直しているのかもしれません。";
  }

  if (relapseState.state === "silence_return") {
    return "今回は、沈黙や距離を取る反応が少し戻ってきているようです。言葉にしないことにも、今は守る意味があるのかもしれません。";
  }

  return "今のところ、大きな揺り戻しとして読む必要はなさそうです。心はまだ揺れながらも、今見られる範囲を少しずつ確かめているようです。";
}

function analyzeEmotionalStabilization(responsePattern, silencePattern, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      stabilized: false,
    };
  }

  const previous = getLastPreviousPattern(previousPatterns);

  const currentOpenness = getOpennessState(responsePattern);
  const currentTrust = getTrustDepthState(responsePattern, previousPatterns);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const previousOpenness =
    previous?.opennessState ||
    previous?.openness ||
    null;

  const previousTrust =
    previous?.trustDepthState ||
    previous?.trustDepth ||
    null;

  const previousSilence =
    previous?.silenceStyle ||
    previous?.silencePattern?.silenceStyle ||
    "none";

  const opennessDrift = getOpennessDrift(currentOpenness, previousOpenness);
  const trustDrift = getTrustDrift(currentTrust, previousTrust);
  const silenceDrift = getSilenceDrift(silencePattern, previousSilence);

  const currentStyle = responsePattern.responseStyle;

  const stableTrust =
    trustDrift === "stable_distance" ||
    trustDrift === "closer_to_reading" ||
    trustDrift === "needs_more_safety";

  const stableOpenness =
    opennessDrift === "stable_opening" ||
    opennessDrift === "stable_distance" ||
    opennessDrift === "slightly_opening" ||
    opennessDrift === "protective_retreat";

  const silenceSoftened =
    silenceDrift === "less_silence" ||
    silenceDrift === "stable_answering" ||
    silenceDrift === "stable_partial_silence";

  const nonDefensiveStyle =
    currentStyle !== "defensive" &&
    currentStyle !== "suppressed";

  if (
    opennessDrift === "protective_retreat" &&
    trustDrift === "needs_more_safety" &&
    silenceDrift === "more_silence"
  ) {
    return {
      state: "protective_stabilizing",
      stabilized: true,
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  if (
    stableTrust &&
    stableOpenness &&
    silenceSoftened &&
    nonDefensiveStyle
  ) {
    return {
      state: "gradual_stabilizing",
      stabilized: true,
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  if (
    stableTrust &&
    silenceSoftened
  ) {
    return {
      state: "quiet_stabilizing",
      stabilized: true,
      opennessDrift,
      trustDrift,
      silenceDrift,
    };
  }

  return {
    state: "still_unstable",
    stabilized: false,
    opennessDrift,
    trustDrift,
    silenceDrift,
  };
}

function buildEmotionalStabilizationNarrative(stabilizationState) {
  if (!stabilizationState || stabilizationState.state === "not_enough_history") {
    return "今はまだ、安定として読むほど長い流れは見えていません。まずは、どんな揺れ方をしているのかを静かに見ている段階です。";
  }

  if (stabilizationState.state === "gradual_stabilizing") {
    return "最近の読みでは、大きく揺れ動くというより、少しずつ『今の自分を見ても大丈夫な距離』が増えてきているようです。急に変わったわけではなく、心が少しずつ安心できる場所を探し始めているのかもしれません。";
  }

  if (stabilizationState.state === "quiet_stabilizing") {
    return "強い変化ではありませんが、最近の読みには少しずつ落ち着いた流れも見え始めています。無理に前へ進むというより、『今のままでも見ていられる感覚』が少し育っているのかもしれません。";
  }

  if (stabilizationState.state === "protective_stabilizing") {
    return "今回は少し距離を取り直しているようですが、それでも完全に崩れているわけではありません。揺り戻しの中で、心が自分にとって安全な落ち着き方を探している流れかもしれません。";
  }

  return "今はまだ、安定よりも揺れの途中にいる時間が続いているようです。ただ、その揺れ自体が、心が今の距離を確かめようとしている流れなのかもしれません。";
}

function analyzeRecurringEmotionalCenter(responsePattern, compound, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      recurringCenter: null,
    };
  }

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const opennessStates = previousPatterns
    .map((p) => p?.opennessState || p?.openness || null)
    .filter(Boolean);

  const trustStates = previousPatterns
    .map((p) => p?.trustDepthState || p?.trustDepth || null)
    .filter(Boolean);

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentOpenness = getOpennessState(responsePattern);
  const currentTrust = getTrustDepthState(responsePattern, previousPatterns);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allOpenness = [...opennessStates, currentOpenness].filter(Boolean);
  const allTrust = [...trustStates, currentTrust].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const mostFrequent = (items) => {
    const counts = countBy(items);
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
  };

  const dominantTrait = mostFrequent(allTraits);
  const dominantTone = mostFrequent(allTones);

  const guardedCount = allOpenness.filter((v) =>
    v === "guarded" ||
    v === "distant" ||
    v === "quiet"
  ).length;

  const openingCount = allOpenness.filter((v) =>
    v === "opening" ||
    v === "exposed"
  ).length;

  const cautiousCount = allTrust.filter((v) =>
    v === "surface" ||
    v === "cautious"
  ).length;

  const engagedCount = allTrust.filter((v) =>
    v === "engaged" ||
    v === "deepening"
  ).length;

  if (
    dominantTrait === "identity_confusion" &&
    guardedCount >= openingCount
  ) {
    return {
      state: "searching_safe_self",
      recurringCenter: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTrait === "emotional_fatigue" ||
    dominantTone === "overloaded"
  ) {
    return {
      state: "carrying_too_much",
      recurringCenter: dominantTrait || dominantTone,
      dominantTone,
    };
  }

  if (
    engagedCount >= cautiousCount &&
    openingCount > 0
  ) {
    return {
      state: "trying_to_approach_feelings",
      recurringCenter: dominantTrait,
      dominantTone,
    };
  }

  return {
    state: "unclear_center",
    recurringCenter: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildRecurringEmotionalCenterNarrative(recurringCenterState) {
  if (!recurringCenterState || recurringCenterState.state === "not_enough_history") {
    return "今はまだ、繰り返し戻ってくる感情の中心までは見えていません。まずは、その時々の揺れ方を静かに見ている段階です。";
  }

  if (recurringCenterState.state === "searching_safe_self") {
    return "最近の読みでは、違う悩みに見える場面の中でも、『安心して自分でいられる場所を探している感覚』が繰り返し現れているようです。";
  }

  if (recurringCenterState.state === "carrying_too_much") {
    return "最近の読みでは、表面のテーマが変わっても、『ひとりで抱え込み続けてしまう重さ』が何度か同じように現れているようです。";
  }

  if (recurringCenterState.state === "trying_to_approach_feelings") {
    return "最近の読みでは、まだ揺れながらも、『自分の感情を少し見てみたい』という流れが何度か繰り返し現れているようです。";
  }

  return "最近の読みでは、違うテーマの中にも、似た感情の揺れ方が少しずつ重なって見えています。今はまだ、それを急いで意味づけしないことも大切なのかもしれません。";
}

function analyzeUnresolvedEmotionalLoop(responsePattern, compound, silencePattern, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      hasLoopSignal: false,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentSilence = silencePattern?.silenceStyle || "none";
  const currentOpenness = getOpennessState(responsePattern);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const silenceStyles = previousPatterns
    .map((p) => p?.silenceStyle || p?.silencePattern?.silenceStyle || null)
    .filter(Boolean);

  const opennessStates = previousPatterns
    .map((p) => p?.opennessState || p?.openness || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allSilence = [...silenceStyles, currentSilence].filter(Boolean);
  const allOpenness = [...opennessStates, currentOpenness].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const recurringTrait = Object.keys(traitCounts).find((key) => traitCounts[key] >= 2) || null;
  const recurringTone = Object.keys(toneCounts).find((key) => toneCounts[key] >= 2) || null;

  const silenceCount = allSilence.filter((v) =>
    v === "strong_avoidance" ||
    v === "partial_avoidance"
  ).length;

  const guardedCount = allOpenness.filter((v) =>
    v === "guarded" ||
    v === "distant" ||
    v === "quiet"
  ).length;

  if (recurringTrait && silenceCount >= 2) {
    return {
      state: "silent_unresolved_loop",
      hasLoopSignal: true,
      recurringTrait,
      recurringTone,
    };
  }

  if (recurringTrait && guardedCount >= 2) {
    return {
      state: "protected_unresolved_loop",
      hasLoopSignal: true,
      recurringTrait,
      recurringTone,
    };
  }

  if (recurringTone && silenceCount >= 1) {
    return {
      state: "emotional_tone_loop",
      hasLoopSignal: true,
      recurringTrait,
      recurringTone,
    };
  }

  if (recurringTrait) {
    return {
      state: "soft_recurring_theme",
      hasLoopSignal: true,
      recurringTrait,
      recurringTone,
    };
  }

  return {
    state: "no_clear_loop",
    hasLoopSignal: false,
    recurringTrait,
    recurringTone,
  };
}

function buildUnresolvedEmotionalLoopNarrative(loopState) {
  if (!loopState || loopState.state === "not_enough_history") {
    return "今はまだ、繰り返し戻ってくる未完了の感情までは見えていません。まずは、その時々の反応を静かに見ている段階です。";
  }

  if (loopState.state === "silent_unresolved_loop") {
    return "最近の読みでは、形を変えながらも、まだ言葉にしきれていない感情が静かに残っているようです。それは問題が解けていないというより、まだ急いで触れなくてもよい場所を心が守っているのかもしれません。";
  }

  if (loopState.state === "protected_unresolved_loop") {
    return "最近の読みでは、似た感情の中心へ何度か戻りながらも、心が慎重に距離を保っている流れがあります。まだ触れ切れていない本音を、無理に開かず守っている状態かもしれません。";
  }

  if (loopState.state === "emotional_tone_loop") {
    return "最近の読みでは、違うテーマの中にも、似た感情の温度が繰り返し現れているようです。今はその感情を解決するより、どんな場面で戻ってくるのかを静かに見ていく段階かもしれません。";
  }

  if (loopState.state === "soft_recurring_theme") {
    return "最近の読みでは、同じ本音の近くへ何度か戻っているようです。それは停滞ではなく、まだ大切に扱い切れていない感情が、少しずつ形を変えて現れているのかもしれません。";
  }

  return "今のところ、強い未完了のループとして読む必要はなさそうです。ただ、似た揺れが重なる場所には、今後の読みで少しずつ意味が見えてくるかもしれません。";
}

function analyzeEmotionalGravity(responsePattern, compound, silencePattern, previousPatterns = []) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      gravityCenter: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentOpenness = getOpennessState(responsePattern);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const opennessStates = previousPatterns
    .map((p) => p?.opennessState || p?.openness || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allOpenness = [...opennessStates, currentOpenness].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const guardedCount = allOpenness.filter((v) =>
    v === "guarded" ||
    v === "distant"
  ).length;

  const openingCount = allOpenness.filter((v) =>
    v === "opening" ||
    v === "exposed"
  ).length;

  if (
    dominantTrait === "role_pressure" ||
    dominantTrait === "people_pleasing"
  ) {
    return {
      state: "pulled_back_to_responsibility",
      gravityCenter: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTrait === "identity_confusion" &&
    guardedCount >= openingCount
  ) {
    return {
      state: "pulled_back_to_protection",
      gravityCenter: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTone === "overloaded" ||
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "pulled_back_to_exhaustion",
      gravityCenter: dominantTrait || dominantTone,
      dominantTone,
    };
  }

  if (
    openingCount > 0 &&
    guardedCount > 0
  ) {
    return {
      state: "moving_between_opening_and_fear",
      gravityCenter: dominantTrait,
      dominantTone,
    };
  }

  return {
    state: "no_clear_gravity",
    gravityCenter: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalGravityNarrative(gravityState) {
  if (!gravityState || gravityState.state === "not_enough_history") {
    return "感情はまだ、どこへ戻っていくのかを静かに確かめている途中のようです。";
  }

  if (gravityState.state === "pulled_back_to_responsibility") {
    return "最近の読みでは、『もう少し休みたい』『力を抜きたい』と思っても、再び責任や役割の感覚へ戻っていく流れがあるようです。それだけ長い間、気を張って支えてきたのかもしれません。";
  }

  if (gravityState.state === "pulled_back_to_protection") {
    return "最近の読みでは、本音へ近づこうとしながらも、最終的には『自分を守る距離』へ戻っていく流れが何度か見えています。それは弱さではなく、心が安全を優先している反応なのかもしれません。";
  }

  if (gravityState.state === "pulled_back_to_exhaustion") {
    return "最近の読みでは、『変わりたい』『整えたい』という気持ちがあっても、繰り返し疲労や重さへ引き戻されているようです。今は前へ進むことより、まず安心して力を抜ける場所が必要なのかもしれません。";
  }

  if (gravityState.state === "moving_between_opening_and_fear") {
    return "最近の読みでは、『近づきたい気持ち』と『守りたい気持ち』の間を、心が何度も行き来しているようです。どちらかが間違っているのではなく、両方が今のあなたに必要な反応なのかもしれません。";
  }

  return "最近の読みでは、心が自然と戻りやすい感情の方向が少しずつ見え始めています。ただ、それを急いで変えようとしなくてもよいのかもしれません。";
}

function analyzeEmotionalResonance(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      resonance: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const silenceStyles = previousPatterns
    .map((p) => p?.silenceStyle || p?.silencePattern?.silenceStyle || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allSilence = [...silenceStyles, currentSilence].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const strongSilence = allSilence.filter((v) =>
    v === "strong_avoidance" ||
    v === "partial_avoidance"
  ).length;

  if (
    dominantTrait === "attachment_anxiety" ||
    dominantTrait === "people_pleasing"
  ) {
    return {
      state: "resonating_with_rejection",
      resonance: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTrait === "identity_confusion" &&
    strongSilence >= 2
  ) {
    return {
      state: "resonating_with_self_protection",
      resonance: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTone === "overloaded" ||
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "resonating_with_pressure",
      resonance: dominantTrait || dominantTone,
      dominantTone,
    };
  }

  if (
    dominantTone === "middle" &&
    dominantTrait
  ) {
    return {
      state: "resonating_with_uncertainty",
      resonance: dominantTrait,
      dominantTone,
    };
  }

  return {
    state: "soft_resonance",
    resonance: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalResonanceNarrative(resonanceState) {
  if (!resonanceState || resonanceState.state === "not_enough_history") {
    return "強く反応する感情は、まだはっきり名前になる前の場所で、静かに揺れているようです。";
  }

  if (resonanceState.state === "resonating_with_rejection") {
    return "最近の読みでは、『拒絶されるかもしれない感覚』や『期待に応えなければならない感覚』に、心が強く反応しやすい流れがあります。それだけ、人との距離を大切にしてきたのかもしれません。";
  }

  if (resonanceState.state === "resonating_with_self_protection") {
    return "最近の読みでは、『自分を守らなければならない感覚』に、心が強く反応しているようです。無理に開こうとするより、安全を確かめる方向へ自然と意識が向いているのかもしれません。";
  }

  if (resonanceState.state === "resonating_with_pressure") {
    return "最近の読みでは、『ちゃんとしなければならない感覚』や『抱え続けなければならない感覚』に、心が強く引っ張られているようです。今は頑張ることより、少し力を抜ける感覚が必要なのかもしれません。";
  }

  if (resonanceState.state === "resonating_with_uncertainty") {
    return "最近の読みでは、『まだ分からない』『決め切れない』感覚に、心が強く反応しているようです。今は急いで答えを出すより、揺れている感覚そのものを見ている段階なのかもしれません。";
  }

  return "最近の読みでは、特定の感情に、心が少し強く反応しやすい流れがあります。ただ、それを無理に変えようとしなくてもよいのかもしれません。";
}

function analyzeEmotionalInertia(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      inertia: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentOpenness = getOpennessState(responsePattern);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const opennessStates = previousPatterns
    .map((p) => p?.opennessState || p?.openness || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allOpenness = [...opennessStates, currentOpenness].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const guardedCount = allOpenness.filter((v) =>
    v === "guarded" ||
    v === "distant"
  ).length;

  const openingCount = allOpenness.filter((v) =>
    v === "opening" ||
    v === "exposed"
  ).length;

  if (
    dominantTrait === "people_pleasing" ||
    dominantTrait === "role_pressure"
  ) {
    return {
      state: "returning_to_responsibility_speed",
      inertia: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTrait === "identity_confusion" &&
    guardedCount >= openingCount
  ) {
    return {
      state: "returning_to_protective_distance",
      inertia: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTone === "overloaded" ||
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "returning_to_exhaustion_cycle",
      inertia: dominantTrait || dominantTone,
      dominantTone,
    };
  }

  if (
    openingCount > 0 &&
    guardedCount > 0
  ) {
    return {
      state: "oscillating_between_opening_and_defense",
      inertia: dominantTrait || dominantTone,
      dominantTone,
    };
  }

  return {
    state: "soft_emotional_inertia",
    inertia: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalInertiaNarrative(inertiaState) {
  if (!inertiaState || inertiaState.state === "not_enough_history") {
    return "感情の速度はまだ定まりきらず、近づいたり離れたりしながら、静かに揺れているようです。";
  }

  if (inertiaState.state === "returning_to_responsibility_speed") {
    return "最近の読みでは、『少し休みたい』『力を抜きたい』と思いながらも、自然とまた責任を抱える方向へ戻っているようです。それだけ長い間、その速度で生き続けてきたのかもしれません。";
  }

  if (inertiaState.state === "returning_to_protective_distance") {
    return "最近の読みでは、本音へ近づこうとしながらも、最終的には守るための距離へ戻っているようです。それは変われないというより、長く慣れてきた感情速度へ自然と戻っているのかもしれません。";
  }

  if (inertiaState.state === "returning_to_exhaustion_cycle") {
    return "最近の読みでは、『整えたい』『休みたい』気持ちがあっても、また疲労を抱え込む流れへ戻りやすいようです。今は前へ進むより、まず感情速度そのものをゆるめる時間が必要なのかもしれません。";
  }

  if (inertiaState.state === "oscillating_between_opening_and_defense") {
    return "最近の読みでは、『近づきたい気持ち』と『守りたい気持ち』の間を、心が何度も揺れ戻っているようです。どちらかを否定するより、その往復自体を今は大切に見てよいのかもしれません。";
  }

  return "最近の読みでは、心が変化へ向かいながらも、長く慣れてきた感情速度へ自然と戻っているようです。ただ、それを急いで変えようとしなくてもよいのかもしれません。";
}

function analyzeEmotionalEcho(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      echo: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const silenceStyles = previousPatterns
    .map((p) => p?.silenceStyle || p?.silencePattern?.silenceStyle || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allSilence = [...silenceStyles, currentSilence].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const recurringTraitCount = dominantTrait ? traitCounts[dominantTrait] || 0 : 0;
  const recurringToneCount = dominantTone ? toneCounts[dominantTone] || 0 : 0;

  const silenceCount = allSilence.filter((v) =>
    v === "strong_avoidance" ||
    v === "partial_avoidance"
  ).length;

  if (recurringTraitCount >= 2 && silenceCount >= 2) {
    return {
      state: "silent_emotional_echo",
      echo: dominantTrait,
      dominantTone,
    };
  }

  if (recurringTraitCount >= 2 && recurringToneCount >= 2) {
    return {
      state: "repeated_emotional_echo",
      echo: dominantTrait,
      dominantTone,
    };
  }

  if (recurringToneCount >= 2) {
    return {
      state: "tone_echo",
      echo: dominantTone,
      dominantTone,
    };
  }

  return {
    state: "soft_echo",
    echo: dominantTrait || dominantTone || null,
    dominantTone,
  };
}


function buildResidualAfterwaveNarrative(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  const echoState = analyzeEmotionalEcho(responsePattern, compound, silencePattern, previousPatterns);
  const afterimageState = analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, previousPatterns);
  const residueState = analyzeEmotionalResidue(responsePattern, compound, silencePattern, previousPatterns);
  const maskingState = analyzeEmotionalMasking(responsePattern, compound, silencePattern, previousPatterns);

  const residualStyleProfile = getResidualStyleProfileEn(
    responsePattern,
    compound,
    silencePattern,
    echoState,
    afterimageState,
    residueState,
    maskingState
  );

  const integrated = buildIntegratedEmotionalAfterwaveNarrative(
    echoState,
    afterimageState,
    residueState
  );

  const masking = buildEmotionalMaskingNarrative(maskingState);

  if (
    echoState?.state === "not_enough_history" &&
    afterimageState?.state === "not_enough_history" &&
    residueState?.state === "not_enough_history"
  ) {
    return `感情の余波はまだ、
はっきり形になる前の場所で、

静かに揺れているようでした。`;
  }

  if (masking && masking.includes("表に出た感情")) {
    return `${integrated}

${masking}`;
  }

  return `${integrated}

表に出た感情と、
まだ奥に残っている感情のあいだに、

小さな距離が残っているようでした。`;
}
function buildIntegratedEmotionalAfterwaveNarrative(
  echoState,
  afterimageState,
  residueState
) {
  const parts = [];

  if (
    echoState &&
    echoState.state !== "no_signal"
  ) {
    parts.push(
`最近の読みでは、
以前触れた感情の余波が、
まだ静かに残っているようです。`
    );
  }

  if (
    afterimageState &&
    afterimageState.state !== "no_afterimage"
  ) {
    parts.push(
`強い感情そのものは少し落ち着いていても、
『自分を守る距離感』だけが
輪郭のように残っているのかもしれません。`
    );
  }

  if (
    residueState &&
    residueState.state !== "no_residue"
  ) {
    parts.push(
`大きな防御感情は弱まりながらも、
少し先回りして自分を守ろうとする反応が、
まだ小さく残っているようです。`
    );
  }

  if (parts.length === 0) {
    return `最近の読みでは、
感情が大きく動いたあとに残る反応は、
まだはっきりとは見えていません。`;
  }

  return `${parts.join("\n\n")}

それは未回復というより、
心がまだ慎重に余韻を抱えながら、
安全な距離を確かめている流れなのかもしれません。`;
}
function buildEmotionalEchoNarrative(echoState) {
  if (!echoState || echoState.state === "not_enough_history") {
    return "今はまだ、感情の残響として読むほどの流れは見えていません。まずは、その時々の揺れ方を静かに見ている段階です。";
  }

  if (echoState.state === "silent_emotional_echo") {
    return "最近の読みでは、以前触れた感情の余波が、まだ言葉にならないまま静かに残っているようです。それは過去を引きずっているというより、心の中でまだ響き続けている場所があるのかもしれません。";
  }

  if (echoState.state === "repeated_emotional_echo") {
    return "最近の読みでは、形を変えながらも、似た感情の響きが何度か戻ってきています。急いで意味を決めるより、何がまだ心の奥で鳴っているのかを静かに見ていく段階かもしれません。";
  }

  if (echoState.state === "tone_echo") {
    return "最近の読みでは、違うテーマの中にも、似た感情の温度が残響のように続いているようです。それは終わっていないというより、まだ心がその感覚を丁寧に扱おうとしているのかもしれません。";
  }

  return "最近の読みでは、はっきりした繰り返しではなくても、どこか似た感情の余韻が静かに残っているようです。今はそれを急いで消そうとしなくてもよいのかもしれません。";
}

function analyzeEmotionalAfterimage(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      afterimage: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const recurringTraitCount =
    dominantTrait ? traitCounts[dominantTrait] || 0 : 0;

  const recurringToneCount =
    dominantTone ? toneCounts[dominantTone] || 0 : 0;

  if (
    recurringTraitCount >= 2 &&
    dominantTrait === "identity_confusion"
  ) {
    return {
      state: "protective_afterimage",
      afterimage: dominantTrait,
      dominantTone,
    };
  }

  if (
    recurringTraitCount >= 2 &&
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "fatigue_afterimage",
      afterimage: dominantTrait,
      dominantTone,
    };
  }

  if (
    recurringToneCount >= 2 &&
    dominantTone === "low"
  ) {
    return {
      state: "quiet_afterimage",
      afterimage: dominantTone,
      dominantTone,
    };
  }

  return {
    state: "soft_afterimage",
    afterimage: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalAfterimageNarrative(afterimageState) {
  if (!afterimageState || afterimageState.state === "not_enough_history") {
    return "今はまだ、感情が通ったあとに残る輪郭までは見えていません。まずは、その時々の揺れ方を静かに見ている段階です。";
  }

  if (afterimageState.state === "protective_afterimage") {
    return "最近の読みでは、強い防御感情そのものは少し弱まっていても、『自分を守る距離感』だけが静かに残っているようです。それはまだ完全に閉じているというより、心が慎重さの輪郭を保っているのかもしれません。";
  }

  if (afterimageState.state === "fatigue_afterimage") {
    return "最近の読みでは、強い疲労感そのものは少し変化していても、『気を張り続けてしまう感覚』が余韻のように残っているようです。今は無理に元気になるより、安心して力を抜ける感覚が必要なのかもしれません。";
  }

  if (afterimageState.state === "quiet_afterimage") {
    return "最近の読みでは、大きな感情の波は少し静まりながらも、その余韻の輪郭がまだ心の中に残っているようです。それは終わっていないというより、心がゆっくり整理しようとしている途中なのかもしれません。";
  }

  return "最近の読みでは、感情そのものは弱まりながらも、その余韻の輪郭がまだ少し残っているようです。今はそれを急いで消そうとしなくてもよいのかもしれません。";
}

function analyzeEmotionalResidue(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      residue: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const recurringTraitCount =
    dominantTrait ? traitCounts[dominantTrait] || 0 : 0;

  const recurringToneCount =
    dominantTone ? toneCounts[dominantTone] || 0 : 0;

  if (
    recurringTraitCount >= 2 &&
    dominantTrait === "identity_confusion"
  ) {
    return {
      state: "protective_residue",
      residue: dominantTrait,
      dominantTone,
    };
  }

  if (
    recurringTraitCount >= 2 &&
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "fatigue_residue",
      residue: dominantTrait,
      dominantTone,
    };
  }

  if (
    recurringToneCount >= 2 &&
    dominantTone === "low"
  ) {
    return {
      state: "quiet_residue",
      residue: dominantTone,
      dominantTone,
    };
  }

  return {
    state: "soft_residue",
    residue: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalResidueNarrative(residueState) {
  if (!residueState || residueState.state === "not_enough_history") {
    return "今はまだ、感情が通ったあとに残る微細な反応までは見えていません。まずは、その時々の揺れ方を静かに見ている段階です。";
  }

  if (residueState.state === "protective_residue") {
    return "最近の読みでは、大きな防御感情は少し落ち着きながらも、『少し先回りして自分を守ろうとする反応』が静かに残っているようです。それは問題というより、長く心を守ってきた感覚の名残なのかもしれません。";
  }

  if (residueState.state === "fatigue_residue") {
    return "最近の読みでは、強い疲労感そのものは少し和らぎながらも、『無意識に力が入り続ける感覚』がまだ残っているようです。今は頑張ることより、安心して力を抜ける感覚を少しずつ思い出す段階なのかもしれません。";
  }

  if (residueState.state === "quiet_residue") {
    return "最近の読みでは、大きな感情は静まり始めながらも、その時に身についた小さな反応だけが、まだ静かに残っているようです。それは悪化ではなく、心がゆっくり元の距離感を探している途中なのかもしれません。";
  }

  return "最近の読みでは、感情そのものは落ち着きながらも、その時に生まれた小さな反応だけが静かに残っているようです。今はそれを急いで消そうとしなくてもよいのかもしれません。";
}

function analyzeEmotionalAdaptation(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !Array.isArray(previousPatterns) || previousPatterns.length < 2) {
    return {
      state: "not_enough_history",
      adaptation: null,
    };
  }

  const currentTrait = compound?.primaryTrait || null;
  const currentTone = getEmotionTone(compound);
  const currentSilence = silencePattern?.silenceStyle || "none";

  const traits = previousPatterns
    .map((p) => p?.primaryTrait || p?.trait || null)
    .filter(Boolean);

  const tones = previousPatterns
    .map((p) => p?.emotionTone || p?.tone || null)
    .filter(Boolean);

  const silenceStyles = previousPatterns
    .map((p) => p?.silenceStyle || p?.silencePattern?.silenceStyle || null)
    .filter(Boolean);

  const allTraits = [...traits, currentTrait].filter(Boolean);
  const allTones = [...tones, currentTone].filter(Boolean);
  const allSilence = [...silenceStyles, currentSilence].filter(Boolean);

  const countBy = (items) =>
    items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

  const traitCounts = countBy(allTraits);
  const toneCounts = countBy(allTones);

  const dominantTrait =
    Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || null;

  const dominantTone =
    Object.keys(toneCounts).sort((a, b) => toneCounts[b] - toneCounts[a])[0] || null;

  const silenceCount = allSilence.filter((v) =>
    v === "strong_avoidance" ||
    v === "partial_avoidance"
  ).length;

  const recurringTraitCount =
    dominantTrait ? traitCounts[dominantTrait] || 0 : 0;

  if (
    recurringTraitCount >= 2 &&
    silenceCount >= 2 &&
    dominantTrait === "identity_confusion"
  ) {
    return {
      state: "protective_adaptation",
      adaptation: dominantTrait,
      dominantTone,
    };
  }

  if (
    recurringTraitCount >= 2 &&
    dominantTrait === "emotional_fatigue"
  ) {
    return {
      state: "survival_adaptation",
      adaptation: dominantTrait,
      dominantTone,
    };
  }

  if (
    dominantTone === "low" &&
    silenceCount >= 1
  ) {
    return {
      state: "quiet_adaptation",
      adaptation: dominantTone,
      dominantTone,
    };
  }

  return {
    state: "soft_adaptation",
    adaptation: dominantTrait || dominantTone || null,
    dominantTone,
  };
}

function buildEmotionalAdaptationNarrative(adaptationState) {
  if (!adaptationState || adaptationState.state === "not_enough_history") {
    return "今はまだ、心が身につけてきた守り方までは見えていません。まずは、その時々の揺れ方を静かに見ている段階です。";
  }

  if (adaptationState.state === "protective_adaptation") {
    return "最近の読みでは、『少し距離を取って自分を守ること』が、心にとって自然な反応になっているようです。それは弱さではなく、これまで自分を守るために身につけてきた感覚なのかもしれません。";
  }

  if (adaptationState.state === "survival_adaptation") {
    return "最近の読みでは、『無理をしてでも動き続けること』が、心にとって当たり前の反応になっているようです。それは怠けられない性格というより、長く耐えるために覚えてきた守り方なのかもしれません。";
  }

  if (adaptationState.state === "quiet_adaptation") {
    return "最近の読みでは、『大きく感情を動かしすぎないこと』が、自然な落ち着き方として身についているようです。それは感情が無いというより、心が静かな距離感を保ちながら自分を守っているのかもしれません。";
  }

  return "最近の読みでは、心がこれまでを生きる中で覚えてきた反応の流れが、少しずつ見え始めています。今はそれを急いで変えるより、どんな守り方だったのかを静かに見ていく段階なのかもしれません。";
}

function analyzeEmotionalMasking(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns = []
) {
  if (!responsePattern || !compound) {
    return {
      state: "insufficient_signal",
      surfaceEmotion: null,
      underlyingEmotion: null,
    };
  }

  const tone = getEmotionTone(compound);
  const trait = compound?.primaryTrait || null;

  const silenceStyle = silencePattern?.silenceStyle || "none";

  if (
    (
      silenceStyle === "strong_avoidance" ||
      silenceStyle === "partial_avoidance"
    ) &&
    tone === "low"
  ) {
    return {
      state: "protective_masking",
      surfaceEmotion: "distance",
      underlyingEmotion: "fatigue",
      dominantTone: tone,
    };
  }

  if (
    trait === "people_pleasing" &&
    tone !== "high"
  ) {
    return {
      state: "quiet_overextension",
      surfaceEmotion: "kindness",
      underlyingEmotion: "exhaustion",
      dominantTone: tone,
    };
  }

  if (
    trait === "identity_confusion"
  ) {
    return {
      state: "uncertain_self_masking",
      surfaceEmotion: "calmness",
      underlyingEmotion: "uncertainty",
      dominantTone: tone,
    };
  }

  return {
    state: "soft_masking",
    surfaceEmotion: "self_protection",
    underlyingEmotion: "unspoken_emotion",
    dominantTone: tone,
  };
}

function buildEmotionalMaskingNarrative(maskingState) {
  if (!maskingState || maskingState.state === "insufficient_signal") {
    return "今はまだ、表に出しやすい感情と、奥に残っている感情の違いまでは見えていません。まずは、今の揺れ方そのものを静かに見ている段階です。";
  }

  if (maskingState.state === "protective_masking") {
    return "最近の読みでは、表面では少し距離を取って落ち着こうとしているように見えても、その奥では『かなり疲れている感覚』が静かに残っているようです。無理に開こうとしないのは、心が安全を優先している反応なのかもしれません。";
  }

  if (maskingState.state === "quiet_overextension") {
    return "最近の読みでは、表面では穏やかに頑張ろうとしているように見えても、その奥では『もう少し休みたい感覚』が静かに残っているようです。優しさの奥に、気づかれにくい疲労が積み重なっているのかもしれません。";
  }

  if (maskingState.state === "uncertain_self_masking") {
    return "最近の読みでは、表面では落ち着いて見せようとしていても、その奥では『まだ自分の感情を整理し切れていない感覚』が静かに残っているようです。はっきり断定できないのは、心が慎重に距離を見ているからなのかもしれません。";
  }

  return `表に出た感情と、
まだ奥に残っている感情のあいだに、

小さな距離が残っているようでした。`;
}

function buildRuntimeProfileEn(responsePattern, compound, silencePattern, echoState, afterimageState, residueState, maskingState, emotionTone = null) {
  const residualStyleProfile = getResidualStyleProfileEn(
    responsePattern,
    compound,
    silencePattern,
    echoState,
    afterimageState,
    residueState,
    maskingState
  );

  const style = residualStyleProfile?.style || "softening";
  const trait = compound?.primaryTrait || "";
  const tone = emotionTone || getEmotionTone(compound);
  const silenceStyle = silencePattern?.silenceStyle || "";
  const responseStyle = responsePattern?.responseStyle || "";

  const stillnessProfiles = {
    drifting: {
      subject: "the tiredness that stayed alert for too long",
      state: "is beginning to loosen, even if only slightly",
      anchor: "Rest may already be a little closer than it feels",
      finalLine: "For now, it does not have to disappear completely.",
    },
    returning: {
      subject: "the feeling that waited behind everyone else",
      state: "is beginning to return to your side",
      anchor: "A small part of you may be remembering that your own voice matters too",
      finalLine: "It can come back quietly, without needing to be loud.",
    },
    lingering: {
      subject: "the wish to come closer without losing safety",
      state: "is still staying nearby",
      anchor: "A small need for reassurance may still be close to the center",
      finalLine: "It does not have to become absence in order to soften.",
    },
    searching: {
      subject: "the part of you that keeps looking ahead",
      state: "is still trying to find a steadier shape",
      anchor: "A small search for safety may still be moving under the surface",
      finalLine: "It can remain unfinished without meaning you are lost.",
    },
    forming: {
      subject: "the outline of yourself that has not fully settled",
      state: "is beginning to gather more shape",
      anchor: "A quiet checking of what belongs to you may still be there",
      finalLine: "It does not need to become clear all at once.",
    },
    unloading: {
      subject: "the weight you learned to keep carrying",
      state: "is starting to loosen around your shoulders",
      anchor: "A small pull toward responsibility may still be there",
      finalLine: "Not everything has to stay in your hands tonight.",
    },
    softening: {
      subject: "the feeling that did not fully become words",
      state: "is still settling",
      anchor: "A quiet trace may still be there, but it does not need to become a conclusion",
      finalLine: "For now, it is enough that it has softened a little.",
    },
  };

  const stillness = stillnessProfiles[style] || stillnessProfiles.softening;

  let gravity = "light";

  if (trait === "emotional_fatigue" || trait === "role_pressure") {
    gravity = "weighted";
  }

  if (trait === "future_anxiety" || style === "searching") {
    gravity = "forward-pulled";
  }

  if (trait === "attachment_anxiety" || style === "lingering") {
    gravity = "nearby-held";
  }

  if (trait === "identity_confusion" || style === "forming") {
    gravity = "unformed";
  }

  if (trait === "people_pleasing" || style === "returning") {
    gravity = "inward-returning";
  }

  if (silenceStyle === "strong_avoidance" || responseStyle === "defensive") {
    gravity = gravity === "light" ? "guarded-light" : gravity;
  }

  return {
    ...residualStyleProfile,
    version: "runtime-profile-en-v0.1",
    trait,
    tone,
    silenceStyle,
    responseStyle,
    voice: silenceStyle === "strong_avoidance" ? "quiet-protective" : "quiet-direct",
    distance: residualStyleProfile?.ending === "safe-distance" ? "near-but-safe" : "soft",
    tempo: residualStyleProfile?.persistence === "slow" ? "slow" : "soft",
    pressure: silenceStyle === "strong_avoidance" || responseStyle === "defensive" ? "low" : "soft-low",
    gravity,
    stillness,
  };
}


function getResidualStyleProfileEn(responsePattern, compound, silencePattern, echoState, afterimageState, residueState, maskingState) {
  const trait = compound?.primaryTrait || "";
  const tone = getEmotionTone(compound);
  const responseStyle = responsePattern?.responseStyle || "";
  const silenceStyle = silencePattern?.silenceStyle || "";
  const masking = maskingState?.state || "";
  const afterimage = afterimageState?.state || "";
  const residue = residueState?.state || "";
  const echo = echoState?.state || "";

  let profile = {
    style: "softening",
    movement: "settling",
    density: "light",
    persistence: "soft",
    ending: "open",
  };

  if (trait === "emotional_fatigue") {
    profile = {
      style: "drifting",
      movement: "away",
      density: "light",
      persistence: "slow",
      ending: "soft-open",
    };
  }

  if (trait === "people_pleasing") {
    profile = {
      style: "returning",
      movement: "inward",
      density: "light",
      persistence: "gentle",
      ending: "self-return",
    };
  }

  if (trait === "attachment_anxiety") {
    profile = {
      style: "lingering",
      movement: "nearby",
      density: "middle",
      persistence: "close",
      ending: "safe-distance",
    };
  }

  if (trait === "future_anxiety") {
    profile = {
      style: "searching",
      movement: "forward",
      density: "middle",
      persistence: "restless",
      ending: "unresolved-forward",
    };
  }

  if (trait === "identity_confusion") {
    profile = {
      style: "forming",
      movement: "emerging",
      density: "soft-middle",
      persistence: "uncertain",
      ending: "outline-open",
    };
  }

  if (trait === "role_pressure") {
    profile = {
      style: "unloading",
      movement: "loosening",
      density: "middle",
      persistence: "held",
      ending: "shoulder-release",
    };
  }

  if (
    masking === "protective_masking" ||
    afterimage === "protective_afterimage" ||
    responseStyle === "defensive" ||
    silenceStyle === "strong_avoidance"
  ) {
    profile = {
      ...profile,
      density: profile.density === "light" ? "soft-middle" : profile.density,
      persistence: "careful",
      ending: "safe-distance",
    };
  }

  if (
    masking === "quiet_overextension" ||
    residue === "defensive_residue" ||
    tone === "low"
  ) {
    profile = {
      ...profile,
      persistence: profile.persistence === "soft" ? "slow" : profile.persistence,
      movement: profile.movement === "settling" ? "loosening" : profile.movement,
    };
  }

  if (
    echo === "silent_emotional_echo" ||
    echo === "repeated_emotional_echo"
  ) {
    profile = {
      ...profile,
      density: profile.density === "light" ? "soft-middle" : profile.density,
      ending: profile.ending === "open" ? "echo-open" : profile.ending,
    };
  }

  return profile;
}

function buildIntegratedEmotionalAfterwaveNarrativeEn(echoState, afterimageState, residueState, residualStyleProfile = null) {
  const parts = [];
  const style = residualStyleProfile?.style || "softening";

  const styleLines = {
    drifting: {
      echo: [
        "In recent readings,",
        "a feeling touched before",
        "seems to be drifting farther from the center.",
      ],
      afterimage: [
        "Even if the strongest feeling has softened,",
        "a quiet tiredness may still be leaving the body slowly,",
        "without needing to become a clear answer.",
      ],
      residue: [
        "A small trace of caution may still be there,",
        "but it feels less like resistance",
        "and more like the body taking time to loosen.",
      ],
      closing: [
        "This may not mean you are still caught in it.",
        "It may mean your heart is learning",
        "how to let the afterimage move away at its own pace.",
      ],
    },

    returning: {
      echo: [
        "In recent readings,",
        "a feeling once held back",
        "seems to be returning quietly toward you.",
      ],
      afterimage: [
        "Even if the strongest feeling has settled,",
        "something that was shaped around others",
        "may still be finding its way back to your own side.",
      ],
      residue: [
        "A small trace of caution may remain,",
        "as if your heart is checking",
        "whether it is safe to choose itself a little more.",
      ],
      closing: [
        "This may not mean you are selfish.",
        "It may mean a feeling that waited for permission",
        "is beginning to remember where it belongs.",
      ],
    },

    lingering: {
      echo: [
        "In recent readings,",
        "a feeling touched before",
        "still seems to stay nearby.",
      ],
      afterimage: [
        "Even if the strongest feeling has settled a little,",
        "the need for nearness may still remain close,",
        "not pressing as loudly as before.",
      ],
      residue: [
        "A small trace of caution may remain,",
        "as if your heart is still measuring",
        "how close it can safely come.",
      ],
      closing: [
        "This may not mean you are unable to let go.",
        "It may mean your heart is learning",
        "what distance can feel safe without becoming absence.",
      ],
    },

    searching: {
      echo: [
        "In recent readings,",
        "a feeling touched before",
        "still seems to look toward what comes next.",
      ],
      afterimage: [
        "Even if the strongest feeling has settled,",
        "part of you may still be searching ahead,",
        "trying to find a shape that feels steady enough.",
      ],
      residue: [
        "A small trace of caution may remain,",
        "not as fear alone,",
        "but as the wish to step forward without losing yourself.",
      ],
      closing: [
        "This may not mean you are lost.",
        "It may mean your heart is still asking",
        "for a future that feels safe enough to enter.",
      ],
    },

    forming: {
      echo: [
        "In recent readings,",
        "a feeling touched before",
        "seems to be gathering a quieter outline.",
      ],
      afterimage: [
        "Even if the strongest feeling has softened,",
        "something inside may still be forming,",
        "not clear yet, but no longer completely without shape.",
      ],
      residue: [
        "A small trace of uncertainty may remain,",
        "as if your heart is checking",
        "which outline actually belongs to you.",
      ],
      closing: [
        "This may not mean you are undefined.",
        "It may mean your heart is taking care",
        "not to accept a shape that is too small.",
      ],
    },

    unloading: {
      echo: [
        "In recent readings,",
        "a feeling touched before",
        "still seems to sit around what you have carried.",
      ],
      afterimage: [
        "Even if the strongest feeling has settled,",
        "a sense of responsibility may still be loosening slowly,",
        "as if your shoulders have not fully believed they can rest.",
      ],
      residue: [
        "A small trace of caution may remain,",
        "around the part of you",
        "that learned to keep holding things together.",
      ],
      closing: [
        "This may not mean you must keep carrying it.",
        "It may mean your heart is only beginning",
        "to believe that not everything has to stay in your hands.",
      ],
    },

    softening: {
      echo: [
        "In recent readings,",
        "the afterwave of a feeling touched before",
        "seems to be softening quietly.",
      ],
      afterimage: [
        "Even if the strongest feeling has settled a little,",
        "a small outline of it may still remain,",
        "not as strongly as before.",
      ],
      residue: [
        "A small trace of caution may still be there,",
        "while your heart checks",
        "what distance feels safe.",
      ],
      closing: [
        "This may not mean you are unhealed.",
        "It may mean the afterimage is still settling",
        "without needing to become a conclusion.",
      ],
    },
  };

  const selected = styleLines[style] || styleLines.softening;

  if (echoState && echoState.state !== "no_signal" && echoState.state !== "not_enough_history") {
    parts.push(selected.echo.join("\n"));
  }

  if (afterimageState && afterimageState.state !== "no_afterimage" && afterimageState.state !== "not_enough_history") {
    parts.push(selected.afterimage.join("\n"));
  }

  if (residueState && residueState.state !== "no_residue" && residueState.state !== "not_enough_history") {
    parts.push(selected.residue.join("\n"));
  }

  if (parts.length === 0) {
    return [
      "In recent readings,",
      "the reactions left after a strong emotional movement",
      "are not yet clearly visible.",
    ].join("\n");
  }

  return parts.join("\n\n") + "\n\n" + selected.closing.join("\n");
}

function buildEmotionalMaskingNarrativeEn(maskingState) {
  if (!maskingState || maskingState.state === "insufficient_signal") {
    return "For now, it is still too early to see the difference between the feeling that appears on the surface and the feeling that remains underneath.";
  }

  if (maskingState.state === "protective_masking") {
    return "In recent readings, even if you seem to be keeping some distance on the surface, a deeper tiredness may still remain underneath. Not opening too quickly may be your heart choosing safety first.";
  }

  if (maskingState.state === "quiet_overextension") {
    return "In recent readings, even if you seem calmly able to keep going, a quieter wish to rest may still remain underneath. Beneath your gentleness, a fatigue that is hard to notice may have been gathering.";
  }

  if (maskingState.state === "uncertain_self_masking") {
    return "In recent readings, even if you seem composed on the surface, a feeling of not yet being able to organize yourself may still remain underneath. Not being able to define it clearly may be your heart measuring distance carefully.";
  }

  return [
    "Between the feeling that appeared on the surface",
    "and the feeling that still remains underneath,",
    "a small distance seems to remain.",
  ].join("\n");
}

function buildAfterimageFallbackNarrativeEn(compound, residualStyleProfile = null) {
  const style = residualStyleProfile?.style || "softening";

  if (style === "drifting") {
    return `The feeling has not disappeared.

It seems to be drifting a little farther away,
without asking to be solved all at once.`;
  }

  if (style === "returning") {
    return `What was left unspoken
may be finding its way back toward you.

Not loudly.
Just enough to remind you
that your own feeling is still here.`;
  }

  if (style === "lingering") {
    return `The feeling has not moved far.

It no longer has to press as strongly,
but it still stays close enough
to be noticed.`;
  }

  if (style === "searching") {
    return `The feeling is still looking ahead.

Not because you are lost,
but because some part of you
is still trying to find a shape that feels safe.`;
  }

  if (style === "forming") {
    return `The feeling is still gathering its outline.

It may not be clear yet,
but it is no longer completely without shape.`;
  }

  if (style === "unloading") {
    return `The weight has not fully left.

But something in you
may be beginning to loosen its grip
around what you thought you had to carry.`;
  }

  return `The feeling is still settling.

It does not need to become clear all at once.
For now, it is enough
that it has begun to soften.`;
}
function buildResidualAfterwaveNarrativeEn(responsePattern, compound, silencePattern, previousPatterns = [], runtimeProfile = null) {
  const echoState = analyzeEmotionalEcho(responsePattern, compound, silencePattern, previousPatterns);
  const afterimageState = analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, previousPatterns);
  const residueState = analyzeEmotionalResidue(responsePattern, compound, silencePattern, previousPatterns);
  const maskingState = analyzeEmotionalMasking(responsePattern, compound, silencePattern, previousPatterns);

  const residualStyleProfile = getResidualStyleProfileEn(
    responsePattern,
    compound,
    silencePattern,
    echoState,
    afterimageState,
    residueState,
    maskingState
  );

  const afterwaveRuntimeProfile = runtimeProfile
    ? {
        ...residualStyleProfile,
        ...runtimeProfile,
      }
    : residualStyleProfile;

  const gravity = afterwaveRuntimeProfile?.gravity || "light";
  const afterimageGravityLineByGravity = {
    weighted: "Something heavy may still be present, but it does not have to become the whole shape of this feeling.",
    "forward-pulled": "Part of the feeling may still be leaning toward what comes next, before it has fully rested here.",
    "nearby-held": "Something may still be staying close, not asking to be solved, only to be held with care.",
    unformed: "The feeling may still be without a clear shape, and that unfinishedness can remain gentle for now.",
    "inward-returning": "Something in you may be quietly returning to its own voice, even if it is still small.",
    "guarded-light": "A little distance may still be protecting the feeling, and that distance does not have to be forced open.",
  };

  const afterimageGravityLine = afterimageGravityLineByGravity[gravity] || "";

  const integrated = buildIntegratedEmotionalAfterwaveNarrativeEn(echoState, afterimageState, residueState, afterwaveRuntimeProfile);
  const masking = buildEmotionalMaskingNarrativeEn(maskingState);

  if (
    echoState?.state === "not_enough_history" &&
    afterimageState?.state === "not_enough_history" &&
    residueState?.state === "not_enough_history"
  ) {
    return buildAfterimageFallbackNarrativeEn(compound, afterwaveRuntimeProfile) + (afterimageGravityLine ? "\n\n" + afterimageGravityLine : "");
  }

  if (
    masking &&
    ["protective_masking", "quiet_overextension", "uncertain_self_masking"].includes(maskingState?.state)
  ) {
    return integrated + "\n\n" + masking + (afterimageGravityLine ? "\n\n" + afterimageGravityLine : "");
  }

  return integrated + (afterimageGravityLine ? "\n\n" + afterimageGravityLine : "");
}

function stablePaidFortune(score, answers = [], depth = "deep", previousResponseStyle = null, previousEmotionTone = null, previousPrimaryTrait = null, previousPatterns = [], expectedQuestionCount = 15) {
  const categoryResult = getPrimaryCategory(answers);
  const traitResult = getPrimaryTrait(answers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const responsePattern = analyzeResponsePattern(answers);
  const silencePattern = analyzeSilencePattern(answers, expectedQuestionCount);
  const emotionTone = getEmotionTone(compound);
  const runtimeRouter = buildRuntimeRouterProfile({
    responsePattern,
    silencePattern,
    compound,
    previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
    emotionTone,
  });
  const runtimeSectionController = buildRuntimeSectionController(runtimeRouter);
  const runtimeComposition = buildRuntimeCompositionProfile(runtimeSectionController);
  const runtimeNarrativeSelection = buildRuntimeNarrativeSelection(runtimeComposition);
  const runtimeRendering = buildRuntimeRenderingProfile(runtimeNarrativeSelection);
  const previousPattern = getLastPreviousPattern(previousPatterns);

  const resolvedPreviousResponseStyle =
    previousResponseStyle ||
    previousPattern?.responseStyle ||
    previousPattern?.style ||
    null;

  const resolvedPreviousEmotionTone =
    previousEmotionTone ||
    previousPattern?.emotionTone ||
    previousPattern?.temperature ||
    null;

  const resolvedPreviousPrimaryTrait =
    previousPrimaryTrait ||
    previousPattern?.primaryTrait ||
    previousPattern?.trait ||
    null;

  if (depth === "short") {
    return buildShortFortune(compound);
  }

  if (depth === "standard") {
    return buildStandardFortune(compound);
  }

  return `【読みはじめ】
${buildReadingLead(compound)}

【観測】
今回の感情温度は「${getEmotionToneLabel(emotionTone)}」です。
${getEmotionTonePhrase(emotionTone)}

${buildDynamicOpening(compound)}

まだ言葉にならない反応が、
少し内側に残っているようでした。

【流れ】
少し触れたあとで、
もう一度静かに距離を測り直しているようでした。

近づきたい気持ちと、
まだ慎重でいたい感覚が、

同じ場所に残っているようでした。

【余波】
${buildResidualAfterwaveNarrative(
  responsePattern,
  compound,
  silencePattern,
  previousPatterns
)}

【触れ方】
${buildEmotionalContactNarrative(
  responsePattern,
  silencePattern,
  previousPatterns
)}

【本音の手前】
${buildQuietHonestCoreNarrative(compound)}

【静止】
${buildSectionAwareNarrative(buildResidualEndingNarrative(compound, emotionTone), "residual", buildSectionBreathMap(runtimeRendering))}`;
}


function buildMovementNarrativeEn(compound, runtimeProfile = null) {
  const trait = compound?.primaryTrait || "";
  const movement = runtimeProfile?.movement || "settling";
  const tempo = runtimeProfile?.tempo || "soft";
  const pressure = runtimeProfile?.pressure || "soft-low";
  const gravity = runtimeProfile?.gravity || "light";
  const lingeringPressure = runtimeProfile?.lingeringPressure || "low";

  const isHeavy = gravity === "heavy" || pressure === "high";
  const isQuick = tempo === "quick" || movement === "forward" || movement === "emerging";
  const isLingering = lingeringPressure === "high" || lingeringPressure === "middle-high";
  const isSoft = pressure === "low" || pressure === "soft-low";

  const rhythm = isHeavy
    ? "heavy"
    : isQuick
      ? "quick"
      : isLingering
        ? "lingering"
        : "quiet";

  const closingByMovement = {
    away: "For now,\nneither part has to force itself into clarity.",
    inward: "For now,\nsomething in you may be turning back toward its own place.",
    nearby: "For now,\nboth parts may stay close without needing to decide the distance.",
    forward: "For now,\nyour heart may need more safety before it follows.",
    emerging: "For now,\nit may be enough that the outline is beginning to appear.",
    loosening: "For now,\nwhat you carry may be allowed to loosen before it disappears.",
    settling: "For now,\nboth parts can remain without becoming an answer.",
  };

  const quietClosing =
    isSoft
      ? closingByMovement[movement] || closingByMovement.settling
      : isHeavy
        ? "For now,\nit may be too much to turn this into an answer too quickly."
        : "For now,\nboth parts can remain without becoming an answer.";

  const movementRuntimeBreath = isHeavy
    ? "The movement feels heavier than the words around it."
    : isQuick
      ? "The feeling is already beginning to move, even before it feels fully safe."
      : isLingering
        ? "Some part of it still lingers, not quite ready to become simple."
        : "";

  const movementClosing = movementRuntimeBreath
    ? `${movementRuntimeBreath}\n\n${quietClosing}`
    : quietClosing;

  const renderMovement = (variants) => {
    const selected = variants[rhythm] || variants.quiet;
    return `${selected}\n\n${movementClosing}`;
  };

  if (trait === "emotional_fatigue") {
    return renderMovement({
      quiet: "Part of you seems ready to rest.\n\nAnother part\nstill does not know how to stop.",
      quick: "Part of you is already reaching for rest.\n\nBut something in you\nstill keeps moving.",
      heavy: "Part of you is tired.\nAnother part still cannot stop.\nThe movement itself has become heavy.",
      lingering: "Part of you seems ready to rest.\n\nAnother part\nstill stays awake inside the pause.",
    });
  }

  if (trait === "people_pleasing") {
    return renderMovement({
      quiet: "Your attention still turns outward,\n\neven while\nsomething inside quietly waits.",
      quick: "Your attention moves toward others first.\n\nYour own feeling\narrives a little later.",
      heavy: "Your attention keeps leaving you.\nSomething inside still waits for a place to stand.",
      lingering: "Your attention still turns outward,\n\nand somewhere behind that,\nyour own voice waits without pushing.",
    });
  }

  if (trait === "attachment_anxiety") {
    return renderMovement({
      quiet: "The wish to move closer\nhas not disappeared.\n\nNeither has the instinct\nto protect yourself.",
      quick: "Something in you wants to move closer.\n\nSomething else\nchecks the distance first.",
      heavy: "The wish for closeness is still there.\nSo is the fear of what closeness might ask from you.",
      lingering: "The wish to move closer\nhas not disappeared.\n\nIt only keeps pausing\nwhere safety still feels uncertain.",
    });
  }

  if (trait === "future_anxiety") {
    return renderMovement({
      quiet: "Your thoughts keep moving forward.\n\nYour heart\nhas not quite followed yet.",
      quick: "Your mind is already ahead.\n\nYour heart\nis still catching up.",
      heavy: "Your thoughts keep reaching forward.\nYour heart stays behind, trying not to be dragged.",
      lingering: "Your thoughts keep moving forward.\n\nYour heart remains a little behind,\nwaiting for the future to feel less sharp.",
    });
  }

  if (trait === "identity_confusion") {
    return renderMovement({
      quiet: "Nothing feels completely lost.\n\nIt simply has not\ntaken a clear shape yet.",
      quick: "Something is beginning to move.\n\nIt just has not\nbecome a shape you can trust yet.",
      heavy: "Nothing is fully lost.\nBut the outline still feels too unstable to hold.",
      lingering: "Nothing feels completely lost.\n\nThe shape is only staying quiet\nbefore it becomes nameable.",
    });
  }

  if (trait === "role_pressure") {
    return renderMovement({
      quiet: "You keep carrying\nwhat feels expected of you.\n\nSomething quieter\nhas begun asking how much longer.",
      quick: "You keep moving through what is expected.\n\nSomething quieter\nstarts asking where you are in it.",
      heavy: "You are still carrying what is expected.\nBut something quieter is beginning to feel the weight.",
      lingering: "You keep carrying\nwhat feels expected of you.\n\nAnd underneath it,\nsomething quieter keeps asking how long it has to stay useful.",
    });
  }

  return renderMovement({
    quiet: "Something inside you\nmoves forward carefully.\n\nAnother part\nstill wants a little more time.",
    quick: "Something inside you begins to move.\n\nAnother part\nasks for time before following.",
    heavy: "Something inside you is moving.\nAnother part still needs more time before it can trust the movement.",
    lingering: "Something inside you\nmoves forward carefully.\n\nAnother part stays close to the pause,\nnot ready to disappear yet.",
  });
}
function buildObservationTraitNarrativeEn(compound) {
  const trait = compound?.primaryTrait || "";
  const category = getCategoryLabelEn(compound?.primaryCategory);

  if (trait === "emotional_fatigue") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to gather around the strain of having carried too much.`;
  }

  if (trait === "people_pleasing") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to move around where your own voice becomes harder to keep near others.`;
  }

  if (trait === "attachment_anxiety") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to gather around the distance between wanting closeness and needing to stay careful.`;
  }

  if (trait === "future_anxiety") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to move around the uncertainty of what comes next.`;
  }

  if (trait === "identity_confusion") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to gather around an outline of the self that has not fully appeared yet.`;
  }

  if (trait === "role_pressure") {
    return `On the surface, this may look like a concern around ${category}.
But underneath it, the feeling seems to gather around the weight of what has had to be carried.`;
  }

  return `On the surface, this may look like a concern around ${category}.
But underneath it, something quieter seems to be responding before it becomes clear.`;
}
function buildObservationClosingEn(compound, runtimeProfile = null) {
  const trait = compound?.primaryTrait || "";
  const pressure = runtimeProfile?.pressure || "soft-low";
  const voice = runtimeProfile?.voice || "quiet-direct";
  const protectedOpening = pressure === "low" || voice === "quiet-protective";

  if (trait === "emotional_fatigue") {
    return `A tiredness that learned to stay quiet
may still be close to the center.`;
  }

  if (trait === "people_pleasing") {
    return `A small voice of your own
may still be waiting for room.`;
  }

  if (trait === "attachment_anxiety") {
    return `A careful wish for closeness
may still be holding its breath.`;
  }

  if (trait === "future_anxiety") {
    return `A need for certainty
may still be standing before the next step.`;
  }

  if (trait === "identity_confusion") {
    return `A quiet outline of yourself
may still be trying to appear.`;
  }

  if (trait === "role_pressure") {
    return `A weight you learned to carry
may still be asking to be noticed.`;
  }

  if (protectedOpening) {
    return `Something that has not yet become words
can stay quiet for now, without being pulled open too quickly.`;
  }

  return `Something that has not yet become words
still seems to remain a little inside.`;
}

function stablePaidFortuneEn(score, answers = [], depth = "deep", previousPatterns = [], expectedQuestionCount = 15) {
  const categoryResult = getPrimaryCategory(answers);
  const traitResult = getPrimaryTrait(answers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const responsePattern = analyzeResponsePattern(answers);
  const silencePattern = analyzeSilencePattern(answers, expectedQuestionCount);
  const emotionTone = getEmotionTone(compound);

  const echoState = analyzeEmotionalEcho(responsePattern, compound, silencePattern, previousPatterns);
  const afterimageState = analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, previousPatterns);
  const residueState = analyzeEmotionalResidue(responsePattern, compound, silencePattern, previousPatterns);
  const maskingState = analyzeEmotionalMasking(responsePattern, compound, silencePattern, previousPatterns);
  const runtimeProfile = buildRuntimeProfileEn(
    responsePattern,
    compound,
    silencePattern,
    echoState,
    afterimageState,
    residueState,
    maskingState,
    emotionTone
  );

  const runtimeRendering = buildRuntimeRenderingProfile(
    buildRuntimeNarrativeSelection(
      buildRuntimeCompositionProfile(
        buildRuntimeSectionController(
          buildRuntimeRouterProfile({
            responsePattern,
            silencePattern,
            compound,
            previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
            emotionTone,
          })
        )
      )
    )
  );
  const sectionBreathMap = buildSectionBreathMap(runtimeRendering);

  const toneLabel = getObservationToneLabelEn(compound, emotionTone);
  const tonePhrase = getObservationTonePhraseEn(compound, emotionTone);

  return `[A Quiet Beginning]
You may not need a loud answer right now.

What seems to matter is the quiet movement beneath your responses.

[What Your Heart Is Showing]
The emotional tone of this reading feels like ${toneLabel}.
${tonePhrase}

${buildSectionAwareNarrative(
  `${buildObservationTraitNarrativeEn(compound)}

${buildObservationClosingEn(compound, runtimeProfile)}`,
  "observation",
  sectionBreathMap
)}

[How the Feeling Moves]
${buildSectionAwareNarrative(
  buildMovementNarrativeEn(compound, runtimeProfile),
  "movement",
  sectionBreathMap
)}

[What Still Remains]
${buildSectionAwareNarrative(
  buildResidualAfterwaveNarrativeEn(
    responsePattern,
    compound,
    silencePattern,
    previousPatterns,
    runtimeProfile
  ),
  "residual",
  sectionBreathMap
)}

[How It Comes Closer]
${buildSectionAwareNarrative(
  buildEmotionalContactNarrativeEn(
    responsePattern,
    silencePattern,
    previousPatterns,
    compound,
    runtimeProfile
  ),
  "contact",
  sectionBreathMap
)}

[The Quiet Truth]
${buildSectionAwareNarrative(
  buildQuietHonestCoreNarrativeEn(compound, runtimeProfile),
  "outline",
  sectionBreathMap
)}

[Where It Leaves You]
${buildSectionAwareNarrative(
  buildResidualEndingNarrativeEn(compound, emotionTone, runtimeProfile),
  "airflow",
  sectionBreathMap
)}`;
}

function getRuntimeTitleEn(unresolvedMovement, trait = "") {
  if (unresolvedMovement === "difficulty_resting") {
    return "When Quiet Strength Grows Heavy";
  }

  if (unresolvedMovement === "truth_waiting_behind_kindness") {
    return "When Your Voice Waits";
  }

  if (unresolvedMovement === "distance_safety_checking") {
    return "Between Nearness and Distance";
  }

  if (unresolvedMovement === "decision_pressure_remaining") {
    return "Before the Next Step Feels Clear";
  }

  if (unresolvedMovement === "self_outline_forming") {
    return "Before the Shape Becomes Clear";
  }

  if (unresolvedMovement === "role_weight_remaining") {
    return "The Weight You Never Put Down";
  }

  if (trait === "emotional_fatigue") {
    return "When Quiet Strength Grows Heavy";
  }

  if (trait === "people_pleasing") {
    return "When Your Voice Waits";
  }

  if (trait === "attachment_anxiety") {
    return "Between Nearness and Distance";
  }

  if (trait === "future_anxiety") {
    return "Before the Next Step Feels Clear";
  }

  if (trait === "identity_confusion") {
    return "Before the Shape Becomes Clear";
  }

  if (trait === "role_pressure") {
    return "The Weight You Never Put Down";
  }

  return "Something Quietly Moving Beneath";
}

function buildFreeEssenceOpeningEn(unresolvedMovement, trait = "") {
  if (unresolvedMovement === "difficulty_resting") {
    return "You may have been staying strong for longer than your heart could comfortably hold.";
  }

  if (unresolvedMovement === "truth_waiting_behind_kindness") {
    return "You may have learned to keep your own feeling quiet while making room for others.";
  }

  if (unresolvedMovement === "distance_safety_checking") {
    return "You may be wanting closeness while still checking what distance feels safe.";
  }

  if (unresolvedMovement === "decision_pressure_remaining") {
    return "You may be looking ahead while part of you is still trying to feel steady where you are.";
  }

  if (unresolvedMovement === "self_outline_forming") {
    return "You may be standing just before your own shape becomes clear.";
  }

  if (unresolvedMovement === "role_weight_remaining") {
    return "You may have been carrying a role while leaving your own weight unspoken.";
  }

  if (trait === "emotional_fatigue") {
    return "You may have been staying strong for longer than your heart could comfortably hold.";
  }

  if (trait === "people_pleasing") {
    return "You may have learned to keep your own feeling quiet while making room for others.";
  }

  if (trait === "attachment_anxiety") {
    return "You may be wanting closeness while still checking what distance feels safe.";
  }

  if (trait === "future_anxiety") {
    return "You may be looking ahead while part of you is still trying to feel steady where you are.";
  }

  if (trait === "identity_confusion") {
    return "You may be standing just before your own shape becomes clear.";
  }

  if (trait === "role_pressure") {
    return "You may have been carrying a role while leaving your own weight unspoken.";
  }

  return "Something in you may be responding more quietly than it appears.";
}

function stableFortuneEn(score, answers = []) {
  const categoryResult = getPrimaryCategory(answers || []);
  const traitResult = getPrimaryTrait(answers || []);
  const compound = buildCompoundInsight(categoryResult, traitResult);

  const category = getCategoryLabelEn(compound.primaryCategory);
  const trait = compound.primaryTrait || "";
  const anchorProfile = buildEmotionalAnchorProfile({ compound });
  const unresolvedMovement = anchorProfile?.unresolvedMovement || "";

  if (trait === "emotional_fatigue") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, a tiredness that has kept going for too long seems to remain.

[For You Now]
This may not be about giving up.
It may be about noticing where your strength has been quietly used.

[Small Opening]
There may be more beneath this tiredness
than can be understood all at once.`;
  }

  if (trait === "people_pleasing") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, something of your own still seems to be waiting to speak.

[For You Now]
This may not be weakness.
It may be the small place where your honest feeling has not disappeared.

[Small Opening]
The voice that stayed quiet
may still have more to show.`;
  }

  if (trait === "attachment_anxiety") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, a fear of being left seems to move quietly beside the wish to come closer.

[For You Now]
This may not mean your heart is closed.
It may mean it is still checking what distance feels safe.

[Small Opening]
There may be more underneath this feeling
than can be seen all at once.`;
  }

  if (trait === "future_anxiety") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, a wish for certainty seems to remain before the next step becomes clear.

[For You Now]
This may not be only fear.
It may be your heart trying to find a place where the future feels safe enough to face.

[Small Opening]
The wish for certainty may not be the whole story.

Something quieter may still be waiting underneath it.`;
  }

  if (trait === "identity_confusion") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, something small still seems to be looking for its outline.

[For You Now]
This may not mean you are empty.
It may mean something inside you has not yet found clear words.

[Small Opening]
Not every part of you needs to become clear today.

Some things may still be taking shape.`;
  }

  if (trait === "role_pressure") {
    return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, the weight of what had to be carried seems to remain.

[For You Now]
This may not be about doing less immediately.
It may be about noticing what has been hard to set down.

[Small Opening]
The weight you have carried
may still have more to say.`;
  }

  return `[Title]
${getRuntimeTitleEn(unresolvedMovement, trait)}

[Essence]
${buildFreeEssenceOpeningEn(unresolvedMovement, trait)}

[Hidden Feeling]
On the surface, this may look like a concern around ${category}.
But underneath it, a feeling that has not yet become words seems to remain.

[For You Now]
This may be only the entrance.
There may be more underneath this feeling than can be seen at once.`;
}
app.post("/fortune", async (req, res) => {
  const { score, locale, answers } = req.body || {};

  res.json({
    ok: true,
    mode: "stable-template",
    phase: "stable-free-v1",
    type: getScoreType(score || 0),
    text: locale === "en" ? stableFortuneEn(score || 0, answers || []) : stableFortune(score || 0),
  });
});

function getAfterglowMessage(depth, compound = null) {
  const trait = compound?.primaryTrait || "";

  if (depth === "short") {
    return `今すぐ何かを変えなくても大丈夫です。

ただ、
あなたの心がここまで耐えてきたことだけは、
ちゃんと本当だったのだと思います。`;
  }

  if (depth === "standard") {
    return `焦って答えを出さなくても大丈夫です。

今はまだ、
『ここまで頑張ってきた自分』を、
少し静かに認めてあげるだけでも十分なのかもしれません。`;
  }

  if (trait === "emotional_fatigue") {
    return `今すぐ、もっと頑張らなくても大丈夫です。

あなたの心は、
怠けていたのではなく、
ずっと何かを支え続けてきたのだと思います。`;
  }

  if (trait === "attachment_anxiety") {
    return `不安になる自分を、
責めなくても大丈夫です。

本当はただ、
安心して繋がっていられる場所が、
ほしかっただけなのかもしれません。`;
  }

  if (trait === "people_pleasing") {
    return `誰かを大切にしてきたあなたが、
自分の本音まで後回しにしなくても大丈夫です。

少しずつ、
あなた自身の声も戻していけます。`;
  }

  if (trait === "identity_confusion") {
    return `今すぐ、
正しい自分を見つけなくても大丈夫です。

分からなさの中にも、
あなたがあなたに戻るための小さな手がかりは残っています。`;
  }

  if (trait === "future_anxiety") {
    return `未来が怖いのは、
弱いからではありません。

それだけ真剣に、
自分のこれからを守ろうとしているからなのだと思います。`;
  }

  if (trait === "role_pressure") {
    return `役割を果たそうとしてきた時間の中で、
あなた自身の声が少し遠くなっていたのかもしれません。

もう少しだけ、
自分の重さを下ろしても大丈夫です。`;
  }

  return `今すぐ人生を変えようとしなくても大丈夫です。

けれど、
あなたの心がここまで耐えながら、
ずっと何かを守ろうとしてきたことだけは、
どうか否定しなくていいのだと思います。`;
}

function buildEmotionalContactProfile(compound, emotionTone = null) {
  const trait = compound?.primaryTrait || "";
  const tone = emotionTone?.tone || emotionTone?.primaryTone || "";

  const profile = {
    approachSpeed: "slow",
    emotionalTemperature: "low",
    clarityLevel: "soft",
    silenceDensity: "high",
    lingeringStrength: "high",
    unresolvedRatio: "high",
    breathingLength: "slow",
    emotionalDistance: "gentle",
  };

  if (trait === "emotional_fatigue") {
    return {
      ...profile,
      emotionalTemperature: "very_low",
      breathingLength: "long",
      emotionalDistance: "soft",
    };
  }

  if (trait === "attachment_anxiety") {
    return {
      ...profile,
      approachSpeed: "very_slow",
      clarityLevel: "low",
      emotionalDistance: "careful",
    };
  }

  if (trait === "people_pleasing") {
    return {
      ...profile,
      clarityLevel: "soft",
      unresolvedRatio: "very_high",
      emotionalDistance: "near_but_gentle",
    };
  }

  if (trait === "future_anxiety") {
    return {
      ...profile,
      approachSpeed: "slow",
      silenceDensity: "very_high",
      emotionalTemperature: "low",
    };
  }

  if (trait === "identity_confusion") {
    return {
      ...profile,
      clarityLevel: "low",
      unresolvedRatio: "very_high",
      emotionalDistance: "open",
    };
  }

  if (trait === "role_pressure") {
    return {
      ...profile,
      breathingLength: "long",
      lingeringStrength: "high",
      emotionalDistance: "soft",
    };
  }

  if (tone === "overloaded" || tone === "suppressed") {
    return {
      ...profile,
      silenceDensity: "very_high",
      emotionalTemperature: "very_low",
    };
  }

  return profile;
}

function buildEmotionalAnchorProfile({
  responsePattern,
  silencePattern,
  compound,
  emotionTone = null,
  contactProfile = null,
}) {
  const trait = compound?.primaryTrait || "";
  const tone = emotionTone?.tone || emotionTone?.primaryTone || "";
  const residualSubject = getResidualSubjectProfile(compound);

  const profile = {
    version: "emotional-anchor-runtime-v0.2",
    purpose: "preserve human-understandable emotional meaning across runtime layers",

    observedState: "soft_emotional_signal",
    interpretedCondition: "感情がまだ完全には言葉になりきっていない状態",
    readableMeaning: "今の感情には、まだ整理されきっていない本音の輪郭が残っている",
    unresolvedMovement: "still_forming",
    residualSubject: residualSubject?.subject || "まだ形になりきらない感情",
    residualAnchor: residualSubject?.anchor || "その感覚は、まだ少し残っているのかもしれません",
    emotionalDistance: contactProfile?.emotionalDistance || "careful",
    driftGuard: {
      avoidAtmosphereOnly: true,
      avoidPoeticFog: true,
      avoidTraitLabeling: true,
      preserveReadableMeaning: true,
    },
  };

  if (trait === "emotional_fatigue") {
    profile.observedState = "held_tension";
    profile.interpretedCondition = "気を張り続けた疲れが、まだほどけきっていない状態";
    profile.readableMeaning = "休みたい気持ちはあっても、安心して力を抜く感覚にまだ慣れていない";
    profile.unresolvedMovement = "difficulty_resting";
  }

  if (trait === "people_pleasing") {
    profile.observedState = "self_suppression";
    profile.interpretedCondition = "相手に合わせるほど、自分の本音が後ろに下がっている状態";
    profile.readableMeaning = "本当は気づいている違和感を、まだ自分の言葉として出しきれていない";
    profile.unresolvedMovement = "truth_waiting_behind_kindness";
  }

  if (trait === "attachment_anxiety") {
    profile.observedState = "distance_sensitivity";
    profile.interpretedCondition = "近づきたい気持ちと、傷つかない距離を探す感覚が同時に残っている状態";
    profile.readableMeaning = "心を閉じているのではなく、安心できる距離をまだ確かめている";
    profile.unresolvedMovement = "distance_safety_checking";
  }

  if (trait === "future_anxiety") {
    profile.observedState = "future_pressure";
    profile.interpretedCondition = "先のことを考え続けるほど、今の自分の呼吸が浅くなっている状態";
    profile.readableMeaning = "決めなければいけない気持ちと、まだ決めきれない感覚が同時に残っている";
    profile.unresolvedMovement = "decision_pressure_remaining";
  }

  if (trait === "identity_confusion") {
    profile.observedState = "blurred_self_outline";
    profile.interpretedCondition = "自分が何を望んでいるのか、まだ輪郭を探している状態";
    profile.readableMeaning = "答えがないのではなく、自分の声を見つける前の静かな迷いが残っている";
    profile.unresolvedMovement = "self_outline_forming";
  }

  if (trait === "role_pressure") {
    profile.observedState = "role_weight";
    profile.interpretedCondition = "役割を果たそうとするほど、自分の重さを後回しにしている状態";
    profile.readableMeaning = "責任を手放したいのではなく、背負い続けた重さにまだ気づききれていない";
    profile.unresolvedMovement = "role_weight_remaining";
  }

  if (tone === "low" && profile.observedState === "soft_emotional_signal") {
    profile.observedState = "quiet_emotional_weight";
    profile.interpretedCondition = "大きく揺れてはいないけれど、心の奥に静かな重さが残っている状態";
    profile.readableMeaning = "平気に見える部分の奥で、まだ言葉になっていない疲れが残っている";
    profile.unresolvedMovement = "quiet_weight_remaining";
  }

  return profile;
}
function buildRuntimeRouterProfile({
  responsePattern,
  silencePattern,
  compound,
  previousPatterns = [],
  emotionTone = null,
}) {
  const safePreviousPatterns = Array.isArray(previousPatterns)
    ? previousPatterns
    : [];

  const opennessState = getOpennessState(responsePattern);
  const trustDepthState = getTrustDepthState(responsePattern, safePreviousPatterns);
  const contactProfile = buildEmotionalContactProfile(compound, emotionTone);
  const emotionalDrift = analyzeEmotionalDrift(responsePattern, silencePattern, safePreviousPatterns);
  const emotionalRelapse = analyzeEmotionalRelapse(responsePattern, silencePattern, safePreviousPatterns);
  const emotionalStabilization = analyzeEmotionalStabilization(responsePattern, silencePattern, safePreviousPatterns);
  const emotionalGravity = analyzeEmotionalGravity(responsePattern, compound, silencePattern, safePreviousPatterns);
  const emotionalInertia = analyzeEmotionalInertia(responsePattern, compound, silencePattern, safePreviousPatterns);
  const emotionalEcho = analyzeEmotionalEcho(responsePattern, compound, silencePattern, safePreviousPatterns);
  const emotionalAfterimage = analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, safePreviousPatterns);
  const emotionalResidue = analyzeEmotionalResidue(responsePattern, compound, silencePattern, safePreviousPatterns);
  const unresolvedEmotionalLoop = analyzeUnresolvedEmotionalLoop(responsePattern, compound, silencePattern, safePreviousPatterns);
  const emotionalMasking = analyzeEmotionalMasking(responsePattern, compound, silencePattern, safePreviousPatterns);

    const emotionalAnchor = buildEmotionalAnchorProfile({
    responsePattern,
    silencePattern,
    compound,
    emotionTone,
    contactProfile,
  });
return {
    version: "runtime-router-v0.1",
    purpose: "classify existing emotional narratives into runtime layers without increasing narrative volume",

    observationRuntime: {
      role: "observe emotional reaction without forcing interpretation",
      state: {
        responseStyle: responsePattern?.responseStyle || "unknown",
        opennessState,
        silenceStyle: silencePattern?.silenceStyle || "none",
        maskingState: emotionalMasking?.state || "insufficient_signal",
      },
      sectionRule: "do not conclude; keep emotional observation soft",
    },

    movementRuntime: {
      role: "track emotional movement, distance recalibration, relapse, gravity, and inertia",
      state: {
        driftState: emotionalDrift?.opennessDrift || "first_observation",
        relapseState: emotionalRelapse?.state || "first_observation",
        stabilizationState: emotionalStabilization?.state || "not_enough_history",
        gravityState: emotionalGravity?.state || "not_enough_history",
        inertiaState: emotionalInertia?.state || "not_enough_history",
      },
      sectionRule: "show movement, not solution",
    },

    contactRuntime: {
      role: "control how close the reading approaches the user's inner truth",
      state: {
        trustDepthState,
        approachSpeed: contactProfile.approachSpeed,
        emotionalDistance: contactProfile.emotionalDistance,
        clarityLevel: contactProfile.clarityLevel,
        silenceDensity: contactProfile.silenceDensity,
      },
      sectionRule: "touch lightly; avoid over-explaining or rescuing",
    },


    emotionalAnchorRuntime: {
      role: "preserve readable emotional understanding across runtime layers",
      state: {
        observedState: emotionalAnchor.observedState,
        interpretedCondition: emotionalAnchor.interpretedCondition,
        readableMeaning: emotionalAnchor.readableMeaning,
        unresolvedMovement: emotionalAnchor.unresolvedMovement,
        residualSubject: emotionalAnchor.residualSubject,
        residualAnchor: emotionalAnchor.residualAnchor,
        emotionalDistance: emotionalAnchor.emotionalDistance,
      },
      sectionRule: "preserve emotional subject; avoid atmosphere-only continuation",
    },
    residualRuntime: {
      role: "control what remains after reading",
      state: {
        echoState: emotionalEcho?.state || "not_enough_history",
        afterimageState: emotionalAfterimage?.state || "not_enough_history",
        residueState: emotionalResidue?.state || "not_enough_history",
        unresolvedLoopState: unresolvedEmotionalLoop?.state || "not_enough_history",
        lingeringStrength: contactProfile.lingeringStrength,
        unresolvedRatio: contactProfile.unresolvedRatio,
        breathingLength: contactProfile.breathingLength,
      },
      sectionRule: "leave quiet residue; avoid strong closing",
    },

    driftGuard: {
      avoid: [
        "fortune-like conclusion",
        "motivational quote ending",
        "over-healing",
        "over-explanation",
        "too many residual phrases",
      ],
      keep: [
        "emotional distance",
        "quiet lingering",
        "incomplete outline",
        "soft observation",
        "residual silence",
      ],
    },
  };
}

function buildRuntimeSectionController(runtimeRouter) {
  const observation = runtimeRouter?.observationRuntime?.state || {};
  const movement = runtimeRouter?.movementRuntime?.state || {};
  const contact = runtimeRouter?.contactRuntime?.state || {};
  const anchor = runtimeRouter?.emotionalAnchorRuntime?.state || {};
  const residual = runtimeRouter?.residualRuntime?.state || {};

  const isGuarded =
    observation.opennessState === "guarded" ||
    contact.trustDepthState === "cautious";

  const isDistant =
    observation.opennessState === "distant" ||
    contact.trustDepthState === "surface";

  const isDeepening =
    contact.trustDepthState === "deepening" ||
    observation.opennessState === "exposed";

  const hasResidualSignal =
    residual.echoState !== "not_enough_history" ||
    residual.afterimageState !== "not_enough_history" ||
    residual.residueState !== "not_enough_history" ||
    residual.unresolvedLoopState !== "not_enough_history";

  const movementIsActive =
    movement.driftState !== "first_observation" ||
    movement.relapseState !== "first_observation" ||
    movement.stabilizationState !== "not_enough_history" ||
    movement.gravityState !== "not_enough_history" ||
    movement.inertiaState !== "not_enough_history";
  const hasReadableAnchor =
    Boolean(anchor.readableMeaning) ||
    Boolean(anchor.interpretedCondition) ||
    Boolean(anchor.residualSubject);

  return {
    version: "runtime-section-controller-v0.1",
    purpose: "control section role, distance, density, and residual pacing without rewriting narrative text",

    sectionOrder: [
      "observation",
      "movement",
      "contact",
      "understanding",
      "outline",
      "airflow",
      "residual",
    ],

    sectionResponsibility: {
      observation: {
        role: "read the current emotional reaction without forcing meaning",
        density: isGuarded || isDistant ? "light" : "middle",
        distanceRule: "stay outside the core; do not expose hidden truth too quickly",
      },
      movement: {
        role: "show how the emotion moved, returned, slowed, or protected itself",
        density: movementIsActive ? "middle" : "light",
        distanceRule: "describe movement, not improvement",
      },
      contact: {
        role: "control how closely the reading touches the user's inner truth",
        density: isDeepening ? "middle" : "light",
        distanceRule: isGuarded
          ? "keep a protective distance"
          : isDeepening
            ? "touch carefully without explaining too much"
            : "approach softly",
      },
      understanding: {
        role: "preserve readable emotional meaning without turning it into explanation",
        density: hasReadableAnchor ? "middle" : "light",
        distanceRule: "keep the emotional subject understandable; avoid atmosphere-only continuation",
      },

      outline: {
        role: "draw the emotional outline before the full inner truth",
        density: isDeepening ? "middle" : "light",
        distanceRule: "do not fully reveal; leave the core incomplete",
      },
      airflow: {
        role: "slow the reading down before ending",
        density: "light",
        distanceRule: "begin leaving before the conclusion becomes too strong",
      },
      residual: {
        role: "leave the reading afterimage without turning it into a quote or lesson",
        density: hasResidualSignal ? "middle" : "light",
        distanceRule: "remain quiet; avoid strong closure",
      },
    },

    narrativeDensityControl: {
      avoidAddingNewSections: true,
      avoidRepeatingResidualLanguage: true,
      preferShorterEnding: true,
      keepUnresolvedSpace: true,
    },

    runtimeDecision: {
      shouldDeepenContact: isDeepening && !isGuarded,
      shouldProtectDistance: isGuarded || isDistant,
      shouldEmphasizeMovement: movementIsActive,
      shouldPreserveAnchor: hasReadableAnchor,
      shouldEmphasizeResidual: hasResidualSignal,
      shouldKeepEndingQuiet: true,
    },
  };
}

function buildRuntimeIntentLayer(runtimeComposition) {
  const guard = runtimeComposition?.compositionGuard || {};
  const suppression = runtimeComposition?.suppressionRules || {};
  const saturation = runtimeComposition?.saturationGuard || {};
  const weight = runtimeComposition?.narrativeWeight || {};

  return {
    version: "runtime-intent-layer-v0.1",
    purpose: "compress scattered runtime guards into reusable emotional understanding intents",

    meaningPreservationIntent: {
      preserveReadableMeaning: true,
      avoidMeaningEvaporation: guard.avoidMeaningEvaporation === true,
      avoidAbstractEmotionalFog: guard.avoidAbstractEmotionalFog === true,
      preferSingleReadableMeaning: saturation.preferSingleReadableMeaning === true,
      meaningWeight: weight.meaningWeight || "minimal",
    },

    emotionalBreathingIntent: {
      preserveBreathingSpace: saturation.preserveEmotionalBreathingSpace === true,
      suppressEmotionalCrowding: suppression.suppressEmotionalCrowding === true,
      avoidResidualOverload: guard.avoidResidualOverload === true,
    },

    atmosphericIntegrityIntent: {
      avoidAtmosphereForAtmosphereSake: guard.avoidAtmosphereForAtmosphereSake === true,
      suppressPoeticDrift: suppression.suppressPoeticDrift === true,
      suppressAtmosphereOnlyContinuation:
        suppression.suppressAtmosphereOnlyContinuation === true,
    },

    residualIntegrityIntent: {
      avoidResidualAestheticLoop: saturation.avoidResidualAestheticLoop === true,
      reduceResidualStacking: saturation.avoidEchoAfterimageResidueStacking === true,
      keepFinalLineUnresolved: saturation.keepFinalLineUnresolved === true,
    },
  };
}

function buildRuntimeCompositionProfile(runtimeSectionController) {
  const decision = runtimeSectionController?.runtimeDecision || {};
  const responsibility = runtimeSectionController?.sectionResponsibility || {};
  const densityControl = runtimeSectionController?.narrativeDensityControl || {};

  const shouldProtectDistance = Boolean(decision.shouldProtectDistance);
  const shouldDeepenContact = Boolean(decision.shouldDeepenContact);
  const shouldEmphasizeMovement = Boolean(decision.shouldEmphasizeMovement);
  const shouldPreserveAnchor = Boolean(decision.shouldPreserveAnchor);

  const shouldEmphasizeResidual = Boolean(decision.shouldEmphasizeResidual);

  return {
    version: "runtime-composition-controller-v0.1",
    purpose: "let runtime decide narrative depth, outline exposure, residual density, silence weight, and ending breath",

    compositionDepth: shouldDeepenContact
      ? "middle"
      : shouldProtectDistance
        ? "shallow"
        : "soft-middle",

    outlineExposure: shouldDeepenContact
      ? "partial-visible"
      : shouldProtectDistance
        ? "guarded"
        : "soft-outline",

    movementDensity: shouldEmphasizeMovement ? "middle" : "light",

    residualDensity: shouldEmphasizeResidual ? "middle" : "light",
    understandingVisibility: shouldPreserveAnchor
      ? shouldProtectDistance
        ? "low-visible"
        : shouldDeepenContact
          ? "soft-visible"
          : "partial-visible"
      : "minimal",

    understandingPressure: shouldPreserveAnchor
      ? shouldProtectDistance
        ? "low"
        : "soft"
      : "minimal",

    meaningDensity: shouldPreserveAnchor ? "readable-light" : "minimal",

    silenceWeight: shouldProtectDistance
      ? "high"
      : shouldEmphasizeResidual
        ? "middle-high"
        : "middle",

    endingBreath: densityControl.preferShorterEnding
      ? "short-soft"
      : "lingering",

    sectionPressure: {
      observation: responsibility.observation?.density || "light",
      movement: responsibility.movement?.density || "light",
      contact: responsibility.contact?.density || "light",
      understanding: responsibility.understanding?.density || "light",
      outline: responsibility.outline?.density || "light",
      airflow: responsibility.airflow?.density || "light",
      residual: responsibility.residual?.density || "light",
    },

    compositionGuard: {
      doNotAddMoreNarrativeLayers: true,
      doNotExplainTheRuntimeToUser: true,
      avoidTherapistExplanation: true,
      avoidFullEmotionalTranslation: true,
      preserveInterpretiveSpace: true,
      avoidAtmosphereForAtmosphereSake: true,
      avoidMeaningEvaporation: true,
      avoidAbstractEmotionalFog: true,
      preserveEmotionalSubjectVisibility: true,
      avoidResidualOverload: true,
      avoidStrongFinalMessage: true,
      keepReadingIncomplete: true,
    },
  };
}

function buildRuntimeNarrativeSelection(runtimeComposition) {
  const depth = runtimeComposition?.compositionDepth || "soft-middle";
  const outlineExposure = runtimeComposition?.outlineExposure || "soft-outline";
  const residualDensity = runtimeComposition?.residualDensity || "light";
  const silenceWeight = runtimeComposition?.silenceWeight || "middle";
  const endingBreath = runtimeComposition?.endingBreath || "short-soft";
  const sectionPressure = runtimeComposition?.sectionPressure || {};
  const meaningDensity = runtimeComposition?.meaningDensity || "minimal";
  const understandingPressure = runtimeComposition?.understandingPressure || "minimal";

  const shouldProtect = depth === "shallow" || outlineExposure === "guarded";
  const shouldLimitResidual = residualDensity === "middle" || silenceWeight === "high";
  const shouldLimitMeaning =
    meaningDensity !== "minimal" ||
    understandingPressure === "soft" ||
    shouldProtect;

  return {
    version: "runtime-narrative-selection-v0.1",
    purpose: "select, prioritize, and suppress narrative pressure based on runtime composition",

    priorityNarratives: {
      observation: sectionPressure.observation === "middle" ? "use" : "soft-use",
      movement: sectionPressure.movement === "middle" ? "use" : "soft-use",
      contact: shouldProtect ? "soft-use" : "use",
      outline: outlineExposure === "guarded" ? "suppress-depth" : "use",
      residual: shouldLimitResidual ? "limit" : "soft-use",
    },

    suppressionRules: {
      suppressStrongConclusion: true,
      suppressOverHealing: true,
      suppressRepeatedLingering: shouldLimitResidual,
      suppressFullReveal: outlineExposure !== "partial-visible",
      suppressMotivationalEnding: true,
      suppressPoeticDrift: true,
      suppressAtmosphereOnlyContinuation: true,
      suppressMeaninglessLingering: true,
      suppressOverInterpretation: true,
      suppressEmotionalCrowding: true,
    },

    boundaryRules: {
      outlineBoundary: outlineExposure,
      endingBoundary: endingBreath,
      residualBoundary: shouldLimitResidual ? "leave-small-trace" : "leave-soft-trace",
      silenceBoundary: silenceWeight,
    },

    narrativeWeight: {
      observationWeight: shouldProtect ? "middle" : "light-middle",
      movementWeight: sectionPressure.movement === "middle" ? "middle" : "light",
      contactWeight: shouldProtect ? "light" : "middle",
      outlineWeight: outlineExposure === "partial-visible" ? "middle" : "light",
      residualWeight: shouldLimitResidual ? "light" : "middle",
      meaningWeight: shouldLimitMeaning
        ? shouldProtect
          ? "light"
          : "light-middle"
        : "minimal",
    },

    saturationGuard: {
      maxResidualConcepts: shouldLimitResidual ? 1 : 2,
      avoidEchoAfterimageResidueStacking: true,
      preferOneQuietImage: true,
      limitAbstractResidualLayers: true,
      preferReadableEmotionalResidue: true,
      limitInterpretationLayers: true,
      avoidMeaningOverpacking: true,
      preserveEmotionalBreathingSpace: true,
      preferSingleReadableMeaning: true,
      avoidResidualAestheticLoop: true,
      keepFinalLineUnresolved: true,
    },
    runtimeIntent: buildRuntimeIntentLayer({
      compositionGuard: runtimeComposition?.compositionGuard || {},
      suppressionRules: {
        suppressStrongConclusion: true,
        suppressOverHealing: true,
        suppressRepeatedLingering: shouldLimitResidual,
        suppressFullReveal: outlineExposure !== "partial-visible",
        suppressMotivationalEnding: true,
        suppressPoeticDrift: true,
        suppressAtmosphereOnlyContinuation: true,
        suppressMeaninglessLingering: true,
        suppressOverInterpretation: true,
        suppressEmotionalCrowding: true,
      },
      saturationGuard: {
        maxResidualConcepts: shouldLimitResidual ? 1 : 2,
        avoidEchoAfterimageResidueStacking: true,
        preferOneQuietImage: true,
        limitAbstractResidualLayers: true,
        preferReadableEmotionalResidue: true,
        limitInterpretationLayers: true,
        avoidMeaningOverpacking: true,
        preserveEmotionalBreathingSpace: true,
        preferSingleReadableMeaning: true,
        avoidResidualAestheticLoop: true,
        keepFinalLineUnresolved: true,
      },
      narrativeWeight: {
        observationWeight: shouldProtect ? "middle" : "light-middle",
        movementWeight: sectionPressure.movement === "middle" ? "middle" : "light",
        contactWeight: shouldProtect ? "light" : "middle",
        outlineWeight: outlineExposure === "partial-visible" ? "middle" : "light",
        residualWeight: shouldLimitResidual ? "light" : "middle",
        meaningWeight: shouldLimitMeaning
          ? shouldProtect
            ? "light"
            : "light-middle"
          : "minimal",
      },
    }),

  };
}

function buildRuntimePolicyLayer(runtimeNarrativeSelection) {
  const boundary = runtimeNarrativeSelection?.boundaryRules || {};
  const weight = runtimeNarrativeSelection?.narrativeWeight || {};
  const saturation = runtimeNarrativeSelection?.saturationGuard || {};
  const suppression = runtimeNarrativeSelection?.suppressionRules || {};
  const intent = runtimeNarrativeSelection?.runtimeIntent || {};

  const meaningIntent = intent.meaningPreservationIntent || {};
  const breathingIntent = intent.emotionalBreathingIntent || {};
  const atmosphericIntent = intent.atmosphericIntegrityIntent || {};
  const residualIntent = intent.residualIntegrityIntent || {};

  const boundaryProtectionPolicy = {
    protectOutline:
      boundary.outlineBoundary === "guarded" ||
      suppression.suppressFullReveal === true,
    outlineBoundary: boundary.outlineBoundary || "blurred",
    useShorterSentencesWhenGuarded: true,
  };

  const emotionalBreathingPolicy = {
    preserveBreathingSpace: breathingIntent.preserveBreathingSpace === true,
    sentenceBreathBase:
      boundaryProtectionPolicy.protectOutline
        ? "slow-soft"
        : weight.movementWeight === "middle"
          ? "balanced"
          : "soft-short",
    pauseDensityBase:
      boundaryProtectionPolicy.protectOutline
        ? "high"
        : saturation.maxResidualConcepts === 1
          ? "middle-high"
          : "middle",
  };

  const residualControlPolicy = {
    limitResidual:
      boundary.residualBoundary === "leave-small-trace" ||
      saturation.maxResidualConcepts === 1 ||
      residualIntent.reduceResidualStacking === true ||
      residualIntent.avoidResidualAestheticLoop === true,
    reduceResidualStacking: residualIntent.reduceResidualStacking === true,
    keepFinalLineUnresolved:
      saturation.keepFinalLineUnresolved === true ||
      residualIntent.keepFinalLineUnresolved === true,
  };

  const atmosphericIntegrityPolicy = {
    suppressAtmosphericDrift:
      atmosphericIntent.suppressPoeticDrift === true ||
      atmosphericIntent.suppressAtmosphereOnlyContinuation === true,
    preserveMeaning:
      meaningIntent.preserveReadableMeaning === true ||
      meaningIntent.avoidMeaningEvaporation === true,
    avoidAestheticLoop:
      saturation.avoidResidualAestheticLoop === true ||
      residualIntent.avoidResidualAestheticLoop === true,
  };

  return {
    version: "runtime-policy-layer-v0.1",
    purpose: "translate runtime intents into reusable rendering policies",
    boundaryProtectionPolicy,
    emotionalBreathingPolicy,
    residualControlPolicy,
    atmosphericIntegrityPolicy,
  };
}

function buildRuntimeRenderingProfile(runtimeNarrativeSelection) {
  const boundary = runtimeNarrativeSelection?.boundaryRules || {};
  const weight = runtimeNarrativeSelection?.narrativeWeight || {};
  const saturation = runtimeNarrativeSelection?.saturationGuard || {};
  const suppression = runtimeNarrativeSelection?.suppressionRules || {};
  const intent = runtimeNarrativeSelection?.runtimeIntent || {};
  const meaningIntent = intent.meaningPreservationIntent || {};
  const breathingIntent = intent.emotionalBreathingIntent || {};
  const atmosphericIntent = intent.atmosphericIntegrityIntent || {};
  const residualIntent = intent.residualIntegrityIntent || {};

  const runtimePolicy = buildRuntimePolicyLayer(runtimeNarrativeSelection);
  const boundaryPolicy = runtimePolicy.boundaryProtectionPolicy || {};
  const breathingPolicy = runtimePolicy.emotionalBreathingPolicy || {};
  const residualPolicy = runtimePolicy.residualControlPolicy || {};
  const atmosphericPolicy = runtimePolicy.atmosphericIntegrityPolicy || {};

  const protectOutline =
    boundaryPolicy.protectOutline === true ||
    boundary.outlineBoundary === "guarded" ||
    suppression.suppressFullReveal === true;

  const limitResidual =
    residualPolicy.limitResidual === true ||
    boundary.residualBoundary === "leave-small-trace" ||
    saturation.maxResidualConcepts === 1 ||
    residualIntent.reduceResidualStacking === true ||
    residualIntent.avoidResidualAestheticLoop === true;

  const quietEnding =
    suppression.suppressStrongConclusion === true ||
    suppression.suppressMotivationalEnding === true ||
    residualIntent.keepFinalLineUnresolved === true;

  return {
    version: "runtime-rendering-controller-v0.1",
    purpose: "control sentence breath, pause density, outline softness, lingering pressure, and ending fade",
    runtimePolicy,
    renderingIntent: {
      meaningPreservation: {
        preserveReadableMeaning: meaningIntent.preserveReadableMeaning === true,
        meaningWeight: meaningIntent.meaningWeight || weight.meaningWeight || "minimal",
      },
      emotionalBreathing: {
        preserveBreathingSpace: breathingIntent.preserveBreathingSpace === true,
        suppressEmotionalCrowding: breathingIntent.suppressEmotionalCrowding === true,
      },
      atmosphericIntegrity: {
        suppressPoeticDrift: atmosphericIntent.suppressPoeticDrift === true,
        suppressAtmosphereOnlyContinuation:
          atmosphericPolicy.suppressAtmosphericDrift === true ||
        atmosphericIntent.suppressAtmosphereOnlyContinuation === true,
      },
      residualIntegrity: {
        reduceResidualStacking: residualIntent.reduceResidualStacking === true,
        keepFinalLineUnresolved: residualPolicy.keepFinalLineUnresolved === true ||
        residualIntent.keepFinalLineUnresolved === true,
      },
    },

    sentenceBreath:
      breathingPolicy.sentenceBreathBase ||
      (protectOutline
        ? "slow-soft"
        : weight.movementWeight === "middle"
          ? "balanced"
          : "soft-short"),

    pauseDensity:
      breathingPolicy.pauseDensityBase ||
      (protectOutline
        ? "high"
        : limitResidual
          ? "middle-high"
          : "middle"),

    outlineSoftness: protectOutline
      ? "guarded-blur"
      : boundary.outlineBoundary === "partial-visible"
        ? "soft-visible"
        : "blurred",

    lingeringPressure: limitResidual
      ? "controlled-low"
      : weight.residualWeight === "middle"
        ? "controlled-middle"
        : "light",

    endingFade: quietEnding
      ? "soft-fade"
      : "lingering-fade",

    renderingGuard: {
      avoidLongExplanatoryParagraphs: true,
      avoidDirectAdviceTone: true,
      avoidFinalAnswerFeeling: true,
      preferLineBreakBreathing: true,
      preferQuietImageOverSummary: true,
    },

    textBehaviorHint: {
      useShorterSentencesWhenGuarded: protectOutline,
      leaveMoreWhiteSpaceWhenSilent:
        boundary.silenceBoundary === "high" ||
        breathingPolicy.preserveBreathingSpace === true ||
        breathingIntent.preserveBreathingSpace === true,
      reduceResidualStacking:
        limitResidual ||
        residualPolicy.reduceResidualStacking === true ||
        residualIntent.reduceResidualStacking === true,
      keepLastLineUnresolved:
        saturation.keepFinalLineUnresolved === true ||
        residualPolicy.keepFinalLineUnresolved === true ||
        residualIntent.keepFinalLineUnresolved === true,
      suppressAtmosphericDrift:
        atmosphericIntent.suppressPoeticDrift === true ||
        atmosphericPolicy.suppressAtmosphericDrift === true ||
        atmosphericIntent.suppressAtmosphereOnlyContinuation === true,
    },
  };
}

function applyRuntimeSentenceBreath(text, runtimeRendering) {
  if (!text || typeof text !== "string") return "";

  const sentenceBreath = runtimeRendering?.sentenceBreath || "soft-short";

  if (sentenceBreath === "slow-soft") {
    return text
      .replace(/。/g, "。\n")
      .replace(/([.!?])\s+/g, "$1\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  if (sentenceBreath === "balanced") {
    return text
      .replace(/。\s*/g, "。\n")
      .replace(/([.!?])\s+/g, "$1\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return text.trim();
}

function applyRuntimeSilencePacing(text, runtimeRendering) {
  if (!text || typeof text !== "string") return "";

  const pauseDensity = runtimeRendering?.pauseDensity || "middle";
  const hints = runtimeRendering?.textBehaviorHint || {};

  if (pauseDensity === "high" || hints.leaveMoreWhiteSpaceWhenSilent) {
    return text
      .replace(/\n/g, "\n\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  if (pauseDensity === "middle-high") {
    return text
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return text.trim();
}

function applyRuntimeResidualPressure(text, runtimeRendering) {
  if (!text || typeof text !== "string") return "";

  const lingeringPressure = runtimeRendering?.lingeringPressure || "light";
  const hints = runtimeRendering?.textBehaviorHint || {};

  if (hints.reduceResidualStacking || lingeringPressure === "controlled-low") {
    return text
      .replace(/余韻のように/g, "静かに")
      .replace(/まだ少し残っているようです。/g, "まだ小さく残っているようでした。")
      .replace(/急いで消そうとしなくてもよいのかもしれません。/g, "急がなくてもよいのかもしれません。")
      .trim();
  }

  return text.trim();
}

function applyRuntimeEndingFade(text, runtimeRendering) {
  if (!text || typeof text !== "string") return "";

  const endingFade = runtimeRendering?.endingFade || "soft-fade";
  const hints = runtimeRendering?.textBehaviorHint || {};

  if (endingFade === "soft-fade" || hints.keepLastLineUnresolved) {
    return text
      .replace(/です。$/g, "ようでした。")
      .replace(/ます。$/g, "いるようでした。")
      .trim();
  }

  return text.trim();
}

function buildRuntimeAwareNarrative(text, runtimeRendering) {
  let rendered = text || "";

  rendered = applyRuntimeSentenceBreath(rendered, runtimeRendering);
  rendered = applyRuntimeSilencePacing(rendered, runtimeRendering);
  rendered = applyRuntimeResidualPressure(rendered, runtimeRendering);
  rendered = applyRuntimeEndingFade(rendered, runtimeRendering);

  return rendered.trim();
}

function buildSectionBreathMap(runtimeRendering) {
  const pauseDensity = runtimeRendering?.pauseDensity || "middle";
  const outlineSoftness = runtimeRendering?.outlineSoftness || "blurred";
  const lingeringPressure = runtimeRendering?.lingeringPressure || "light";
  const endingFade = runtimeRendering?.endingFade || "soft-fade";

  return {
    version: "section-breath-map-v0.1",
    purpose: "assign different breath, silence, fade, and lingering behavior for each runtime section",

    observation: {
      sentenceBreath: "soft-short",
      pauseDensity: pauseDensity === "high" ? "middle" : "low-middle",
      tone: "observational",
      rule: "observe without exposing the core",
    },

    movement: {
      sentenceBreath: "balanced",
      pauseDensity: "middle",
      tone: "flowing",
      rule: "show emotional movement without turning it into progress advice",
    },

    contact: {
      sentenceBreath: "slow-soft",
      pauseDensity: pauseDensity === "high" ? "middle-high" : "middle",
      tone: "near-but-safe",
      rule: "approach carefully and avoid over-explaining",
    },

    outline: {
      sentenceBreath: "slow-soft",
      pauseDensity: "middle-high",
      outlineSoftness,
      tone: "blurred-outline",
      rule: "leave the emotional center incomplete",
    },

    airflow: {
      sentenceBreath: "soft-short",
      pauseDensity: "middle",
      endingFade,
      tone: "leaving",
      rule: "start leaving before the ending becomes a conclusion",
    },

    residual: {
      sentenceBreath: "slow-soft",
      pauseDensity: "middle-high",
      lingeringPressure: lingeringPressure === "controlled-low" ? "low" : "controlled-low",
      endingFade: "soft-fade",
      tone: "quiet-afterimage",
      rule: "leave only a small trace; avoid residual saturation",
    },
  };
}

function buildSectionAwareNarrative(text, sectionKey, sectionBreathMap) {
  const sectionProfile = sectionBreathMap?.[sectionKey] || {};
  const runtimeRendering = {
    sentenceBreath: sectionProfile.sentenceBreath || "soft-short",
    pauseDensity: sectionProfile.pauseDensity || "middle",
    lingeringPressure: sectionProfile.lingeringPressure || "light",
    endingFade: sectionProfile.endingFade || "soft-fade",
    textBehaviorHint: {
      leaveMoreWhiteSpaceWhenSilent: false,
      reduceResidualStacking: sectionKey === "residual",
      keepLastLineUnresolved: sectionKey === "airflow" || sectionKey === "residual",
    },
  };

  return buildRuntimeAwareNarrative(text, runtimeRendering);
}
function getResidualSubjectProfile(compound) {
  const trait = compound?.primaryTrait || "";

  if (trait === "emotional_fatigue") {
    return {
      subject: "気を張ったままの疲れ",
      state: "ほどけきっていない",
      anchor: "まだ少し、休むことに慣れていないのかもしれません",
    };
  }

  if (trait === "people_pleasing") {
    return {
      subject: "自分の気持ちを後ろへ置く癖",
      state: "すぐには戻りきっていない",
      anchor: "まだ少し、自分より先に相手を見てしまうのかもしれません",
    };
  }

  if (trait === "attachment_anxiety") {
    return {
      subject: "離れることへの怖さ",
      state: "消えきっていない",
      anchor: "まだ少し、近づきたいのに身構えてしまうのかもしれません",
    };
  }

  if (trait === "future_anxiety") {
    return {
      subject: "先を考えすぎる緊張",
      state: "ゆるみきっていない",
      anchor: "まだ少し、安心する前に正解を探してしまうのかもしれません",
    };
  }

  if (trait === "identity_confusion") {
    return {
      subject: "自分を決めきれない迷い",
      state: "形になりきっていない",
      anchor: "まだ少し、自分の輪郭を確かめているのかもしれません",
    };
  }

  if (trait === "role_pressure") {
    return {
      subject: "役割を降ろせない緊張",
      state: "抜けきっていない",
      anchor: "まだ少し、休む前に役に立とうとしてしまうのかもしれません",
    };
  }

  return {
    subject: "言葉になりきらなかった感情",
    state: "残っている",
    anchor: "まだ少し、自分の内側を確かめているのかもしれません",
  };
}

function buildResidualEndingNarrative(compound, emotionTone = null) {
  const residualSubject = getResidualSubjectProfile(compound);
  const contactProfile = buildEmotionalContactProfile(compound, emotionTone);

  const endingLine =
    contactProfile.silenceDensity === "very_high"
      ? "その感覚が、まだ小さく残っているようでした。"
      : "その感覚が、まだ少し残っているようでした。";

  return `${residualSubject.subject}は、
まだ完全には${residualSubject.state}ようです。

${residualSubject.anchor}。

${endingLine}`;
}

function getResidualSubjectProfileEn(compound) {
  const trait = compound?.primaryTrait || "";

  if (trait === "emotional_fatigue") {
    return {
      subject: "the tiredness that stayed alert for too long",
      state: "has not fully loosened yet",
      anchor: "A small need for rest still seems to remain close by",
    };
  }

  if (trait === "people_pleasing") {
    return {
      subject: "the habit of placing your own feelings behind others",
      state: "has not fully returned to you yet",
      anchor: "A small movement toward others still seems to remain before the self returns",
    };
  }

  if (trait === "attachment_anxiety") {
    return {
      subject: "the fear of being left",
      state: "has not completely disappeared",
      anchor: "A small bracing still seems to remain beside the wish to come closer",
    };
  }

  if (trait === "future_anxiety") {
    return {
      subject: "the tension of thinking too far ahead",
      state: "has not fully softened yet",
      anchor: "A small search for certainty still seems to remain before safety can settle",
    };
  }

  if (trait === "identity_confusion") {
    return {
      subject: "the uncertainty of not being able to define yourself",
      state: "has not fully taken shape yet",
      anchor: "A quiet checking of the outline still seems to remain",
    };
  }

  if (trait === "role_pressure") {
    return {
      subject: "the tension of not being able to put your role down",
      state: "has not fully left your body yet",
      anchor: "A small pull toward being useful still seems to remain before rest can arrive",
    };
  }

  return {
    subject: "the feeling that did not fully become words",
    state: "is still present",
    anchor: "A quiet checking of what remains still seems to continue",
  };
}

function capitalizeFirst(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}
function buildResidualEndingNarrativeEn(compound, emotionTone = null, runtimeProfile = null) {
  const residualSubject = runtimeProfile?.stillness || getResidualSubjectProfileEn(compound);
  const contactProfile = buildEmotionalContactProfile(compound, emotionTone);
  const pressure = runtimeProfile?.pressure || "soft-low";
  const distance = runtimeProfile?.distance || "soft";
  const gravity = runtimeProfile?.gravity || "light";

  if (runtimeProfile?.stillness) {
    const lines = [
      `${capitalizeFirst(residualSubject.subject)}`,
      `${residualSubject.state}.`,
      "",
      `${residualSubject.anchor}.`,
    ];

    if (pressure === "low" || distance === "near-but-safe") {
      lines.push("");
      if (gravity === "weighted") {
        lines.push("The weight may still be there, but it no longer has to speak as loudly.");
      } else {
        lines.push(residualSubject.finalLine);
      }
      return lines.join("\n");
    }

    lines.push("");
    lines.push(residualSubject.finalLine || "It can stay unfinished for now.");
    return lines.join("\n");
  }

  const endingLine =
    contactProfile.silenceDensity === "very_high"
      ? "That feeling still seems to remain in a small, quiet way."
      : "That feeling still seems to remain, just a little.";

  return `${capitalizeFirst(residualSubject.subject)}
${residualSubject.state}.

${residualSubject.anchor}.

${endingLine}`;
}

function generateReadingId() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `HF-${yyyy}${mm}${dd}-${random}`;
}

function getRecommendedPrice(depth) {
  if (depth === "short") {
    return 100;
  }

  if (depth === "standard") {
    return 300;
  }

  if (depth === "deep") {
    return 500;
  }

  return 300;
}

app.post("/deep-fortune", async (req, res) => {
  const { score, answers, depth, locale, previousResponseStyle, previousEmotionTone, previousPrimaryTrait, previousPatterns, expectedQuestionCount } = req.body || {};
  const safeAnswers = answers || [];

  const categoryResult = getPrimaryCategory(safeAnswers);
  const traitResult = getPrimaryTrait(safeAnswers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const responsePattern = analyzeResponsePattern(safeAnswers);
  const silencePattern = analyzeSilencePattern(safeAnswers, Number(expectedQuestionCount || 15));

  res.json({
    ok: true,
    mode: "stable-paid-template",
    phase: PHASE,
    readingId: generateReadingId(),
    fallback: false,
    model: "stable-template",

    type: getScoreType(score || 0),

    category: categoryResult.primary,
    categoryScores: categoryResult.scores,

    trait: traitResult.primary,
    traitScores: traitResult.scores,

    responsePattern,
    silencePattern,
    silenceNarrative: buildSilencePatternNarrative(silencePattern),
    opennessState: getOpennessState(responsePattern),
    opennessLabel: getOpennessLabel(getOpennessState(responsePattern)),
    continuity: buildContinuityNarrative(responsePattern, previousResponseStyle || null, previousEmotionTone || null),
    contradictionPersistence: buildContradictionPersistence(compound, previousPrimaryTrait || null),
    repeatSessionMemory: buildRepeatSessionMemoryNarrative(responsePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    trustDepthState: getTrustDepthState(responsePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    trustDepthLabel: getTrustDepthLabel(getTrustDepthState(responsePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalDrift: analyzeEmotionalDrift(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalDriftNarrative: buildEmotionalDriftNarrative(analyzeEmotionalDrift(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    sessionDriftSummary: buildSessionDriftSummary(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalRelapse: analyzeEmotionalRelapse(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalRelapseNarrative: buildEmotionalRelapseNarrative(analyzeEmotionalRelapse(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalStabilization: analyzeEmotionalStabilization(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalStabilizationNarrative: buildEmotionalStabilizationNarrative(analyzeEmotionalStabilization(responsePattern, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    recurringEmotionalCenter: analyzeRecurringEmotionalCenter(responsePattern, compound, Array.isArray(previousPatterns) ? previousPatterns : []),
    recurringEmotionalCenterNarrative: buildRecurringEmotionalCenterNarrative(analyzeRecurringEmotionalCenter(responsePattern, compound, Array.isArray(previousPatterns) ? previousPatterns : [])),
    unresolvedEmotionalLoop: analyzeUnresolvedEmotionalLoop(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    unresolvedEmotionalLoopNarrative: buildUnresolvedEmotionalLoopNarrative(analyzeUnresolvedEmotionalLoop(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalGravity: analyzeEmotionalGravity(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalGravityNarrative: buildEmotionalGravityNarrative(analyzeEmotionalGravity(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalResonance: analyzeEmotionalResonance(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalResonanceNarrative: buildEmotionalResonanceNarrative(analyzeEmotionalResonance(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalInertia: analyzeEmotionalInertia(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalInertiaNarrative: buildEmotionalInertiaNarrative(analyzeEmotionalInertia(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalEcho: analyzeEmotionalEcho(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalEchoNarrative: buildEmotionalEchoNarrative(analyzeEmotionalEcho(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalAfterimage: analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalAfterimageNarrative: buildEmotionalAfterimageNarrative(analyzeEmotionalAfterimage(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalResidue: analyzeEmotionalResidue(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalResidueNarrative: buildEmotionalResidueNarrative(analyzeEmotionalResidue(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalAdaptation: analyzeEmotionalAdaptation(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalAdaptationNarrative: buildEmotionalAdaptationNarrative(analyzeEmotionalAdaptation(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    emotionalMasking: analyzeEmotionalMasking(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : []),
    emotionalMaskingNarrative: buildEmotionalMaskingNarrative(analyzeEmotionalMasking(responsePattern, compound, silencePattern, Array.isArray(previousPatterns) ? previousPatterns : [])),
    runtimeRouter: buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    }),
    runtimeSectionController: buildRuntimeSectionController(buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    })),
    runtimeComposition: buildRuntimeCompositionProfile(buildRuntimeSectionController(buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    }))),
    runtimeNarrativeSelection: buildRuntimeNarrativeSelection(buildRuntimeCompositionProfile(buildRuntimeSectionController(buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    })))),
    runtimeRendering: buildRuntimeRenderingProfile(buildRuntimeNarrativeSelection(buildRuntimeCompositionProfile(buildRuntimeSectionController(buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    }))))),
    sectionBreathMap: buildSectionBreathMap(buildRuntimeRenderingProfile(buildRuntimeNarrativeSelection(buildRuntimeCompositionProfile(buildRuntimeSectionController(buildRuntimeRouterProfile({
      responsePattern,
      silencePattern,
      compound,
      previousPatterns: Array.isArray(previousPatterns) ? previousPatterns : [],
      emotionTone: getEmotionTone(compound),
    })))))),

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

    recommendedPrice: getRecommendedPrice(depth || "deep"),
    depth: depth || "deep",
    text: locale === "en" ? stablePaidFortuneEn(score || 0, safeAnswers, depth || "deep", Array.isArray(previousPatterns) ? previousPatterns : [], Number(expectedQuestionCount || 15)) : stablePaidFortune(score || 0, safeAnswers, depth || "deep", previousResponseStyle || null, previousEmotionTone || null, previousPrimaryTrait || null, Array.isArray(previousPatterns) ? previousPatterns : [], Number(expectedQuestionCount || 15)),
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



