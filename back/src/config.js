var Autonote = Autonote || {};

Autonote.Config = {
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',

  getGeminiApiKey() {
    return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  },

  setGeminiApiKey(apiKey) {
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  },

  getNewsSites() {
    const newsSites = PropertiesService.getScriptProperties().getProperty('NEWS_SITES');
    return newsSites ? newsSites.split('\n').map((s) => s.trim()).filter(Boolean) : [];
  },

  setNewsSites(siteUrls) {
    const urls = Array.isArray(siteUrls) ? siteUrls.join('\n') : siteUrls;
    PropertiesService.getScriptProperties().setProperty('NEWS_SITES', urls);
  },

  getPublishMode() {
    return PropertiesService.getScriptProperties().getProperty('PUBLISH_MODE') || 'draft';
  },

  setPublishMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (['draft', 'webhook', 'github', 'multi'].indexOf(normalized) === -1) {
      throw new Error('PUBLISH_MODE must be one of: draft, webhook, github, multi.');
    }
    PropertiesService.getScriptProperties().setProperty('PUBLISH_MODE', normalized);
  },

  getNoteWebhookUrl() {
    return PropertiesService.getScriptProperties().getProperty('NOTE_WEBHOOK_URL');
  },

  setNoteWebhookUrl(webhookUrl) {
    PropertiesService.getScriptProperties().setProperty('NOTE_WEBHOOK_URL', webhookUrl);
  },

  getNoteWebhookSecret() {
    return PropertiesService.getScriptProperties().getProperty('NOTE_WEBHOOK_SECRET');
  },

  setNoteWebhookSecret(secret) {
    PropertiesService.getScriptProperties().setProperty('NOTE_WEBHOOK_SECRET', secret);
  },

  getMaxArticlesPerSite() {
    const value = Number(PropertiesService.getScriptProperties().getProperty('MAX_ARTICLES_PER_SITE') || 5);
    return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 20) : 5;
  },

  setMaxArticlesPerSite(maxArticles) {
    const value = Number(maxArticles);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('MAX_ARTICLES_PER_SITE must be a positive number.');
    }
    PropertiesService.getScriptProperties().setProperty('MAX_ARTICLES_PER_SITE', String(Math.min(Math.floor(value), 20)));
  },

  getArticleTemplate() {
    return PropertiesService.getScriptProperties().getProperty('ARTICLE_TEMPLATE') || 'news_affiliate_explainer';
  },

  setArticleTemplate(templateName) {
    const normalized = String(templateName || '').trim();
    const templates = ['news_affiliate_explainer', 'comparison', 'review', 'howto'];
    if (templates.indexOf(normalized) === -1) {
      throw new Error('ARTICLE_TEMPLATE must be one of: ' + templates.join(', '));
    }
    PropertiesService.getScriptProperties().setProperty('ARTICLE_TEMPLATE', normalized);
  },

  getMonetizationMode() {
    return PropertiesService.getScriptProperties().getProperty('MONETIZATION_MODE') || 'affiliate';
  },

  setMonetizationMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (['none', 'affiliate'].indexOf(normalized) === -1) {
      throw new Error('MONETIZATION_MODE must be "none" or "affiliate".');
    }
    PropertiesService.getScriptProperties().setProperty('MONETIZATION_MODE', normalized);
  },

  getAffiliateDisclosure() {
    return PropertiesService.getScriptProperties().getProperty('AFFILIATE_DISCLOSURE') ||
      'この記事には広告・アフィリエイトリンクを含む場合があります。';
  },

  setAffiliateDisclosure(disclosure) {
    PropertiesService.getScriptProperties().setProperty('AFFILIATE_DISCLOSURE', disclosure);
  },

  getAffiliateLinks() {
    const value = PropertiesService.getScriptProperties().getProperty('AFFILIATE_LINKS');
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log(`Invalid AFFILIATE_LINKS JSON: ${error.toString()}`);
      return [];
    }
  },

  setAffiliateLinks(links) {
    const normalized = Array.isArray(links) ? links : [];
    PropertiesService.getScriptProperties().setProperty('AFFILIATE_LINKS', JSON.stringify(normalized));
  },

  getMinMonetizationScore() {
    const value = Number(PropertiesService.getScriptProperties().getProperty('MIN_MONETIZATION_SCORE') || 55);
    return Number.isFinite(value) ? Math.max(0, Math.min(Math.floor(value), 100)) : 55;
  },

  setMinMonetizationScore(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) {
      throw new Error('MIN_MONETIZATION_SCORE must be a number.');
    }
    PropertiesService.getScriptProperties().setProperty('MIN_MONETIZATION_SCORE', String(Math.max(0, Math.min(Math.floor(value), 100))));
  },

  getGithubToken() {
    return PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  },

  setGithubToken(token) {
    PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  },

  getGithubRepo() {
    return PropertiesService.getScriptProperties().getProperty('GITHUB_REPO');
  },

  setGithubRepo(repo) {
    PropertiesService.getScriptProperties().setProperty('GITHUB_REPO', repo);
  },

  getGithubBranch() {
    return PropertiesService.getScriptProperties().getProperty('GITHUB_BRANCH') || 'main';
  },

  setGithubBranch(branch) {
    PropertiesService.getScriptProperties().setProperty('GITHUB_BRANCH', branch);
  },

  getGithubPostsPath() {
    return PropertiesService.getScriptProperties().getProperty('GITHUB_POSTS_PATH') || 'front/content/posts';
  },

  setGithubPostsPath(path) {
    PropertiesService.getScriptProperties().setProperty('GITHUB_POSTS_PATH', path);
  },

  getSiteBaseUrl() {
    return PropertiesService.getScriptProperties().getProperty('SITE_BASE_URL') || '';
  },

  setSiteBaseUrl(url) {
    PropertiesService.getScriptProperties().setProperty('SITE_BASE_URL', url);
  },

  getSpreadsheetId() {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  },

  setSpreadsheetId(spreadsheetId) {
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
  }
};
