var Autonote = Autonote || {};
Autonote.Index = Autonote.Index || {};

Autonote.Index.runAutomation = function () {
  Autonote.App.runAutomation();
};

Autonote.Index.setNewsSites = function (siteUrls) {
  Autonote.Config.setNewsSites(siteUrls);
};

Autonote.Index.setGeminiApiKey = function (apiKey) {
  Autonote.Config.setGeminiApiKey(apiKey);
};

Autonote.Index.setPublishMode = function (mode) {
  Autonote.Config.setPublishMode(mode);
};

Autonote.Index.setNoteWebhookUrl = function (webhookUrl) {
  Autonote.Config.setNoteWebhookUrl(webhookUrl);
};

Autonote.Index.setNoteWebhookSecret = function (secret) {
  Autonote.Config.setNoteWebhookSecret(secret);
};

Autonote.Index.setMaxArticlesPerSite = function (maxArticles) {
  Autonote.Config.setMaxArticlesPerSite(maxArticles);
};

Autonote.Index.setArticleTemplate = function (templateName) {
  Autonote.Config.setArticleTemplate(templateName);
};

Autonote.Index.setMonetizationMode = function (mode) {
  Autonote.Config.setMonetizationMode(mode);
};

Autonote.Index.setAffiliateDisclosure = function (disclosure) {
  Autonote.Config.setAffiliateDisclosure(disclosure);
};

Autonote.Index.setAffiliateLinks = function (links) {
  Autonote.Config.setAffiliateLinks(links);
};

Autonote.Index.setMinMonetizationScore = function (score) {
  Autonote.Config.setMinMonetizationScore(score);
};

Autonote.Index.setGithubToken = function (token) {
  Autonote.Config.setGithubToken(token);
};

Autonote.Index.setGithubRepo = function (repo) {
  Autonote.Config.setGithubRepo(repo);
};

Autonote.Index.setGithubBranch = function (branch) {
  Autonote.Config.setGithubBranch(branch);
};

Autonote.Index.setGithubPostsPath = function (path) {
  Autonote.Config.setGithubPostsPath(path);
};

Autonote.Index.setSiteBaseUrl = function (url) {
  Autonote.Config.setSiteBaseUrl(url);
};

Autonote.Index.checkConfiguration = function () {
  Autonote.App.checkConfiguration();
};
