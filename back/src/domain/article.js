var Autonote = Autonote || {};
Autonote.Domain = Autonote.Domain || {};

/**
 * Article ドメインオブジェクト
 * @param {object} params
 * @returns {object}
 */
Autonote.Domain.Article = function (params) {
  return {
    title: params.title || '',
    description: params.description || '',
    link: params.link || '',
    pubDate: params.pubDate || '',
    source: params.source || ''
  };
};
