const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PHASE = "stable-paid-v32";

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
function stablePaidFortune(score, answers = [], depth = "deep") {
  const categoryResult = getPrimaryCategory(answers);
  const traitResult = getPrimaryTrait(answers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const responsePattern = analyzeResponsePattern(answers);
  const emotionTone = getEmotionTone(compound);

  if (depth === "short") {
    return buildShortFortune(compound);
  }

  if (depth === "standard") {
    return buildStandardFortune(compound);
  }

  return `【読みはじめ】
${buildReadingLead(compound)}

【奥にある本音】
${buildDynamicOpening(compound)}

【今の心】
今回の感情温度は「${getEmotionToneLabel(emotionTone)}」です。
${getEmotionTonePhrase(emotionTone)}

【感情の揺れ方】
${buildResponsePatternNarrative(responsePattern)}

【心を守る反応】
${buildResponseStyleTraitNarrative(responsePattern, compound)}

【ずっと残っていたもの】
${getInnerNarrative(compound)}

【揺れているもの】
${getContradiction(compound)}

【言葉になる前の願い】
${getUnspokenDesire(compound)}

【本音の中心】
${getNarrativeIntegration(compound)}

【次へ向かうサイン】
${buildDynamicSign(compound)}

【余韻】
${getAfterglowMessage("deep", compound)}`;
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
  const { score, answers, depth } = req.body || {};
  const safeAnswers = answers || [];

  const categoryResult = getPrimaryCategory(safeAnswers);
  const traitResult = getPrimaryTrait(safeAnswers);
  const compound = buildCompoundInsight(categoryResult, traitResult);
  const responsePattern = analyzeResponsePattern(answers);

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
    text: stablePaidFortune(score || 0, safeAnswers, depth || "deep"),
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




















































