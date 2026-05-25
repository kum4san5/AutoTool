var Autonote = Autonote || {};
Autonote.Domain = Autonote.Domain || {};

Autonote.Domain.ContentTaxonomy = {
  CATEGORIES: [
    {
      id: 'it_ai',
      label: 'IT/AI',
      description: 'AIツール、個人開発、技術トレンド、用語解説、開発ノウハウ。',
      keywords: ['AI', '人工知能', 'ChatGPT', 'Claude', 'Gemini', 'LLM', '生成AI', '個人開発', 'SaaS', 'API', 'GitHub', 'プログラミング', '開発', 'DX', '自動化', 'ノーコード', 'ローコード'],
      affiliateAngles: ['AIツール', '開発支援SaaS', '学習教材', 'クラウドサービス', ' productivity tool']
    },
    {
      id: 'pc_gadget',
      label: 'PC周辺ガジェット',
      description: 'PC、周辺機器、デスク環境、ガジェット、作業効率化デバイス。',
      keywords: ['PC', 'パソコン', 'Mac', 'Windows', 'キーボード', 'マウス', 'モニター', 'ディスプレイ', 'SSD', 'USB', '充電器', 'イヤホン', 'ガジェット', 'デスク', '周辺機器'],
      affiliateAngles: ['Amazon商品', 'PC周辺機器', 'デスク環境', '作業効率化グッズ']
    },
    {
      id: 'food_cafe',
      label: 'カフェ/グルメ',
      description: 'カフェ、飲食店、グルメ、作業場所、地域紹介。',
      keywords: ['カフェ', 'コーヒー', 'ランチ', 'グルメ', 'レストラン', '喫茶', 'スイーツ', 'パン', '食', '飲食', '作業カフェ', 'モーニング'],
      affiliateAngles: ['予約サービス', '地域ガイド', 'コーヒー器具', 'ギフト']
    },
    {
      id: 'nature_spot',
      label: '自然/景色',
      description: '自然、景色、旅行、散歩、写真、地域スポット紹介。',
      keywords: ['自然', '景色', '旅行', '観光', '公園', '山', '海', '川', '森', '絶景', '散歩', '写真', 'キャンプ', 'アウトドア'],
      affiliateAngles: ['旅行予約', 'カメラ用品', 'アウトドア用品', '地域ガイド']
    }
  ],

  classify(article) {
    const text = `${article.title}\n${article.description}`.toLowerCase();
    let best = this.CATEGORIES[0];
    let bestScore = -1;

    this.CATEGORIES.forEach((category) => {
      const score = category.keywords.reduce((total, keyword) => {
        return text.indexOf(String(keyword).toLowerCase()) !== -1 ? total + 1 : total;
      }, 0);
      if (score > bestScore) {
        best = category;
        bestScore = score;
      }
    });

    return {
      id: best.id,
      label: best.label,
      description: best.description,
      affiliateAngles: best.affiliateAngles,
      keywordHits: Math.max(bestScore, 0)
    };
  },

  getCategory(id) {
    return this.CATEGORIES.filter((category) => category.id === id)[0] || this.CATEGORIES[0];
  }
};
