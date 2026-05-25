var Autonote = Autonote || {};
Autonote.App = Autonote.App || {};

Autonote.App.runAutomation = function () {
  const sites = Autonote.Config.getNewsSites();
  if (sites.length === 0) {
    console.log('ニュースサイトが設定されていません。setNewsSites() で設定してください。');
    return;
  }

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalPosted = 0;
  let totalErrors = 0;
  let totalLowScore = 0;
  const minScore = Autonote.Config.getMinMonetizationScore();
  sites.forEach((siteUrl) => {
    console.log(`Processing: ${siteUrl}`);
    const articles = Autonote.Usecases.NewsUseCase.fetchArticles(siteUrl);

    articles.forEach((article) => {
      if (Autonote.Infrastructure.Storage.hasProcessedArticle(article)) {
        console.log(`Skipped duplicate: ${article.title}`);
        totalSkipped++;
        return;
      }

      const category = Autonote.Domain.ContentTaxonomy.classify(article);
      const preScore = Autonote.Domain.ContentScorer.score(article, category);
      if (preScore.score < minScore) {
        console.log(`Skipped low score (${preScore.score}): ${article.title}`);
        totalLowScore++;
        return;
      }

      const generated = Autonote.Infrastructure.GeminiClient.generateArticle(article, category, preScore);
      if (!generated) {
        console.log(`Failed to generate article: ${article.title}`);
        totalErrors++;
        return;
      }

      const publishResult = Autonote.Infrastructure.Publisher.publish(generated, article);
      Autonote.Usecases.DraftUseCase.createArticleRecord(article, generated, publishResult);
      if (publishResult.ok) {
        totalPosted++;
      }
      if (publishResult.error) {
        totalErrors++;
      }
      if (!publishResult.error) {
        totalProcessed++;
      }
    });
  });

  console.log(`Automation completed. processed=${totalProcessed}, posted=${totalPosted}, skipped=${totalSkipped}, lowScore=${totalLowScore}, errors=${totalErrors}`);
};

Autonote.App.checkConfiguration = function () {
  const geminiKey = Autonote.Config.getGeminiApiKey();
  const sites = Autonote.Config.getNewsSites();
  const publishMode = Autonote.Config.getPublishMode();
  const webhookUrl = Autonote.Config.getNoteWebhookUrl();
  const articleTemplate = Autonote.Config.getArticleTemplate();
  const monetizationMode = Autonote.Config.getMonetizationMode();
  const affiliateLinks = Autonote.Config.getAffiliateLinks();
  const minScore = Autonote.Config.getMinMonetizationScore();
  const githubRepo = Autonote.Config.getGithubRepo();
  const siteBaseUrl = Autonote.Config.getSiteBaseUrl();

  console.log('=== Current Configuration ===');
  console.log(`Gemini API Key: ${geminiKey ? '✓ Set' : '✗ Not Set'}`);
  console.log(`News Sites: ${sites.length > 0 ? sites.length + ' site(s)' : 'Not Set'}`);
  console.log(`Sites: ${sites.length > 0 ? sites.join(', ') : 'None'}`);
  console.log(`Publish Mode: ${publishMode}`);
  console.log(`Note Webhook URL: ${webhookUrl ? '✓ Set' : '✗ Not Set'}`);
  console.log(`Article Template: ${articleTemplate}`);
  console.log(`Monetization Mode: ${monetizationMode}`);
  console.log(`Affiliate Links: ${affiliateLinks.length} link(s)`);
  console.log(`Min Monetization Score: ${minScore}`);
  console.log(`GitHub Repo: ${githubRepo || 'Not Set'}`);
  console.log(`Site Base URL: ${siteBaseUrl || 'Not Set'}`);
};
