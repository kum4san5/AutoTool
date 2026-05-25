var Autonote = Autonote || {};

/**
 * GAS から呼び出すエントリポイント
 */
function runAutomation() {
  Autonote.Index.runAutomation();
}

function setNewsSites(siteUrls) {
  Autonote.Index.setNewsSites(siteUrls);
  console.log('News sites configured.');
}

function setGeminiApiKey(apiKey) {
  Autonote.Index.setGeminiApiKey(apiKey);
  console.log('Gemini API Key set successfully.');
}

function setPublishMode(mode) {
  Autonote.Index.setPublishMode(mode);
  console.log('Publish mode configured.');
}

function setNoteWebhookUrl(webhookUrl) {
  Autonote.Index.setNoteWebhookUrl(webhookUrl);
  console.log('Note webhook URL configured.');
}

function setNoteWebhookSecret(secret) {
  Autonote.Index.setNoteWebhookSecret(secret);
  console.log('Note webhook secret configured.');
}

function setMaxArticlesPerSite(maxArticles) {
  Autonote.Index.setMaxArticlesPerSite(maxArticles);
  console.log('Max articles per site configured.');
}

function setArticleTemplate(templateName) {
  Autonote.Index.setArticleTemplate(templateName);
  console.log('Article template configured.');
}

function setMonetizationMode(mode) {
  Autonote.Index.setMonetizationMode(mode);
  console.log('Monetization mode configured.');
}

function setAffiliateDisclosure(disclosure) {
  Autonote.Index.setAffiliateDisclosure(disclosure);
  console.log('Affiliate disclosure configured.');
}

function setAffiliateLinks(links) {
  Autonote.Index.setAffiliateLinks(links);
  console.log('Affiliate links configured.');
}

function setMinMonetizationScore(score) {
  Autonote.Index.setMinMonetizationScore(score);
  console.log('Min monetization score configured.');
}

function setGithubToken(token) {
  Autonote.Index.setGithubToken(token);
  console.log('GitHub token configured.');
}

function setGithubRepo(repo) {
  Autonote.Index.setGithubRepo(repo);
  console.log('GitHub repo configured.');
}

function setGithubBranch(branch) {
  Autonote.Index.setGithubBranch(branch);
  console.log('GitHub branch configured.');
}

function setGithubPostsPath(path) {
  Autonote.Index.setGithubPostsPath(path);
  console.log('GitHub posts path configured.');
}

function setSiteBaseUrl(url) {
  Autonote.Index.setSiteBaseUrl(url);
  console.log('Site base URL configured.');
}

function checkConfiguration() {
  Autonote.Index.checkConfiguration();
}

// --- デバッグ用ラッパー（Apps Script エディタの関数ドロップダウンから実行可能）
function debugFetchTechCrunch() {
  Autonote.Utils.Network.debugFetch('https://jp.techcrunch.com/feed/');
}

function debugFetchEngadget() {
  Autonote.Utils.Network.debugFetch('https://japanese.engadget.com/rss.xml');
}

function debugFetchHackerNews() {
  Autonote.Utils.Network.debugFetch('https://news.ycombinator.com/rss');
}
