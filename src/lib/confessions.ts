// confessionsページの質問定義

export type Question = {
  id: string;
  text: string;
  category: string;
};

export const questions: Question[] = [
  // 差別・摩擦
  {
    id: "racism",
    text: "現地で人種差別や理不尽な扱いを受けたことがある？",
    category: "人間関係",
  },
  {
    id: "japanese_privilege",
    text: "日本人であることで得をしたと感じた体験は？",
    category: "人間関係",
  },
  {
    id: "local_friends",
    text: "現地の人と本音で話せる友人がいる？どうやって作った？",
    category: "人間関係",
  },
  {
    id: "japanese_community",
    text: "現地の日本人コミュニティ、居心地いい？それとも息苦しい？",
    category: "人間関係",
  },
  // パートナー・家族
  {
    id: "partner_nationality",
    text: "パートナーは日本人と非日本人、どちらが良かった（良い）？実体験から教えて。",
    category: "パートナー・家族",
  },
  {
    id: "relationship_change",
    text: "海外に来てパートナーや家族との関係が変わった？",
    category: "パートナー・家族",
  },
  {
    id: "children_japanese",
    text: "子どもに日本語・日本文化を継がせることへのプレッシャーを感じる？",
    category: "パートナー・家族",
  },
  // 本音・価値観
  {
    id: "japan_feeling",
    text: "海外に出て、日本が好きになった？嫌いになった？",
    category: "本音",
  },
  {
    id: "regret",
    text: "移住を後悔したことがある？その理由は？",
    category: "本音",
  },
  {
    id: "only_abroad",
    text: "日本では絶対しなかったけど、海外では普通にやっていることは？",
    category: "本音",
  },
  {
    id: "return_to_japan",
    text: "日本に帰りたいと思ったのはどんなとき？",
    category: "本音",
  },
  {
    id: "nightlife",
    text: "現地のナイトライフ文化に参加してみた？ぶっちゃけどうだった？",
    category: "本音",
  },
  // 制度・お金
  {
    id: "pension",
    text: "日本の年金・健康保険、払い続けてる？損だと思う？",
    category: "制度・お金",
  },
  {
    id: "old_age",
    text: "海外で老後を過ごすことに不安がある？",
    category: "制度・お金",
  },
  {
    id: "give_up_nationality",
    text: "日本国籍を手放す選択肢を考えたことがある？",
    category: "制度・お金",
  },
  // 仕事
  {
    id: "local_hire_vs_expat",
    text: "現地採用と駐在員、待遇の差をリアルに感じる？",
    category: "仕事",
  },
  {
    id: "work_culture_shock",
    text: "海外の職場で一番カルチャーショックだったことは？",
    category: "仕事",
  },
];
