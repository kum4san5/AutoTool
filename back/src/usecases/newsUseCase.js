var Autonote = Autonote || {};
Autonote.Usecases = Autonote.Usecases || {};

Autonote.Usecases.NewsUseCase = {
  fetchArticles(siteUrl) {
    return Autonote.Infrastructure.FeedParser.fetchNewsContent(siteUrl);
  }
};
