var Autonote = Autonote || {};
Autonote.Utils = Autonote.Utils || {};
Autonote.Utils.Text = {
  extractFirstMatch(text, regex, defaultValue) {
    const match = text.match(regex);
    return match ? match[1] : defaultValue || '';
  },

  stripHtmlTags(text) {
    return String(text || '').replace(/<[^>]*>/g, '');
  },

  stripCdata(text) {
    return String(text || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
  },

  decodeHtmlEntities(text) {
    const entityMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' '
    };
    return String(text || '')
      .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => entityMap[entity] || entity)
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
  },

  normalizeWhitespace(text) {
    return String(text || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  },

  normalizeLineBreaks(text) {
    return String(text || '').replace(/\r\n|\r/g, '\n');
  },

  takeFirstNChars(text, length) {
    const value = String(text || '');
    return value.length > length ? value.substring(0, length) : value;
  },

  safeTrim(text) {
    return text ? String(text).trim() : '';
  }
};
