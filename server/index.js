const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

function getScoreType(score) {
  const n = Number(score || 0);

  if (n <= 8) return "inner_guarded";
  if (n <= 16) return "sensitive_balancer";
  if (n <= 24) return "hidden_longing";

  return "emotionally_open";
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

  let primary = "self";

  for (const key of Object.keys(scores)) {
    if (scores[key] > scores[primary]) {
      primary = key;
    }
  }

  return {
    primary,
    scores,
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
      scores[trait] += Number(answer.value || 0);
    }
  }

  let primary = "identity_confusion";

  for (const key of Object.keys(scores)) {
    if (scores[key] > scores[primary]) {
      primary = key;
    }
  }

  return {
    primary,
    scores,
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
  const type = getScoreType(score);
  const categoryResult = getPrimaryCategory(answers);
  const category = categoryResult.primary;

  if (category === "work") {
    return `【さらに深い本音】
あなたが今いちばん揺れているのは、仕事や役割の中で「自分はこのままでいいのか」と感じる部分です。
求められることに応えながら、本当の自分の望みを後回しにしてきたのかもしれません。

【今のあなたが悩んでいること】
頑張っているのに、どこか満たされない感覚があります。
評価されたい気持ちと、無理を続けたくない気持ちが、心の中でぶつかっています。

【本当は求めているもの】
あなたが欲しいのは、ただ忙しくなることではありません。
自分の力がちゃんと意味を持ち、誰かの役に立っていると感じられる場所です。

【次に進むためのサイン】
違和感を無視しないことが、次の流れを変えていきます。
小さくても「これは自分の本音に近い」と思える選択を増やしてください。`;
  }

  if (category === "future") {
    return `【さらに深い本音】
あなたの奥には、未来に対する期待と不安が同時にあります。
変わりたい気持ちはあるのに、失敗した時のことを考えて、足が止まってしまうのかもしれません。

【今のあなたが悩んでいること】
このまま進んでいいのか、どこかで道を変えるべきなのか。
答えが出ないまま、心だけが先に疲れているようです。

【本当は求めているもの】
あなたが欲しいのは、完璧な未来ではありません。
不安があっても進めるだけの、小さな確信です。

【次に進むためのサイン】
一気に人生を変えようとしなくて大丈夫です。
今の自分が少し呼吸しやすくなる方向に、次の答えがあります。`;
  }

  if (category === "mental") {
    return `【さらに深い本音】
あなたは今、自分でも説明しきれない疲れを抱えているようです。
何か大きな出来事がなくても、心が静かにすり減ってきたのかもしれません。

【今のあなたが悩んでいること】
平気なふりはできるのに、ひとりになると急に力が抜ける。
本当は誰かに気づいてほしいのに、うまく言葉にできない状態です。

【本当は求めているもの】
あなたが欲しいのは、正論ではなく安心です。
頑張れと言われるより、少し休んでもいいと思える場所です。

【次に進むためのサイン】
まずは無理に前向きにならなくて大丈夫です。
心が落ち着く時間を取り戻すことが、今のあなたの最初の答えです。`;
  }

  if (category === "relationship") {
    return `【さらに深い本音】
あなたが今強く反応しているのは、人との距離感です。
近づきたいのに疲れる、離れたいのに寂しい、その両方を抱えているのかもしれません。

【今のあなたが悩んでいること】
相手に合わせすぎるほど、自分の気持ちが分からなくなることがあります。
本当は嫌だったことまで、あとから飲み込んできたようです。

【本当は求めているもの】
あなたが欲しいのは、無理に笑わなくても続く関係です。
気を遣ったあなたではなく、本音に近いあなたを受け止めてくれるつながりです。

【次に進むためのサイン】
少しだけ距離を置いても壊れない関係が、本当に残る関係です。
あなたが自分を消さなくても、そばにいる人を選んでください。`;
  }

  if (category === "love") {
    return `【さらに深い本音】
あなたの中には、ちゃんと大切にされたいという願いがあります。
ただ、その気持ちを見せすぎるのが怖くて、平気なふりをしてしまうようです。

【今のあなたが悩んでいること】
求めたいのに、求めるほど重いと思われそうで止まってしまう。
本当は言葉にしたい寂しさを、何度も飲み込んできたのかもしれません。

【本当は求めているもの】
あなたが欲しいのは、駆け引きではなく安心です。
不安にさせる人ではなく、不安になった時に向き合ってくれる人です。

【次に進むためのサイン】
愛されるために自分を小さくしなくて大丈夫です。
あなたの本音を大切にできる人だけが、次の関係に残っていきます。`;
  }

  return `【さらに深い本音】
あなたが今向き合っているのは、誰かとの関係よりも、自分自身の本音です。
本当は分かっているのに、まだ言葉にしきれていない気持ちが残っています。

【今のあなたが悩んでいること】
自分は何を望んでいるのか、何に疲れているのか。
答えを急ぐほど、心の声が遠くなってしまうことがあります。

【本当は求めているもの】
あなたが欲しいのは、誰かに決めてもらう答えではありません。
自分の感覚を信じてもいいと思える、静かな確信です。

【次に進むためのサイン】
迷っている自分を責めなくて大丈夫です。
小さな違和感を見逃さないことが、次のあなたを導いていきます。`;
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
  const categoryResult = getPrimaryCategory(answers || []);
  const traitResult = getPrimaryTrait(answers || []);

  res.json({
    ok: true,
    mode: "stable-paid-template",
    phase: "stable-paid-v2",
    fallback: false,
    model: "stable-template",
    type: getScoreType(score || 0),
    category: categoryResult.primary,
    categoryScores: categoryResult.scores,
    trait: traitResult.primary,
    traitScores: traitResult.scores,
    text: stablePaidFortune(score || 0, answers || []),
  });
});

const server = app.listen(8787, "127.0.0.1", () => {
  console.log("=================================");
  console.log("FREE: /fortune stable-free-template");
  console.log("DEEP: /deep-fortune stable-paid-template");
  console.log("Phase: stable-paid-v2");
  console.log("Listening: http://127.0.0.1:8787");
  console.log("=================================");
});

server.on("error", (error) => {
  console.error("[server error]", error);
});

process.stdin.resume();

