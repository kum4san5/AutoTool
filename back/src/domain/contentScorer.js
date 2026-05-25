var Autonote = Autonote || {};
Autonote.Domain = Autonote.Domain || {};

Autonote.Domain.ContentScorer = {
  score(article, category) {
    const text = `${article.title}\n${article.description}`;
    const normalized = text.toLowerCase();
    let score = 35;
    const reasons = [];

    if (category.keywordHits > 0) {
      score += Math.min(category.keywordHits * 8, 24);
      reasons.push(`${category.label} keywords`);
    }

    if (/[?？]|とは|方法|比較|おすすめ|選び方|使い方|入門|レビュー|料金|無料|有料/.test(text)) {
      score += 14;
      reasons.push('search intent');
    }

    if (/AI|ツール|サービス|アプリ|ガジェット|カフェ|旅行|予約|購入|セール|新製品|発売|アップデート/i.test(text)) {
      score += 14;
      reasons.push('affiliate fit');
    }

    if (/発表|公開|開始|新機能|リリース|提供|導入|対応|値下げ|キャンペーン/.test(text)) {
      score += 10;
      reasons.push('timeliness');
    }

    if (article.link) {
      score += 4;
      reasons.push('source URL');
    }

    if (normalized.length < 80) {
      score -= 12;
      reasons.push('thin source');
    }

    return {
      score: Math.max(0, Math.min(score, 100)),
      reasons: reasons
    };
  }
};
