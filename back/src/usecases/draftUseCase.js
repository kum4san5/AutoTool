var Autonote = Autonote || {};
Autonote.Usecases = Autonote.Usecases || {};

Autonote.Usecases.DraftUseCase = {
  createArticleRecord(article, generated, publishResult) {
    return Autonote.Infrastructure.Storage.createArticleRecord(article, generated, publishResult);
  }
};
