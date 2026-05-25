var Autonote = Autonote || {};
Autonote.Infrastructure = Autonote.Infrastructure || {};

Autonote.Infrastructure.Storage = {
  HEADERS: [
    'Timestamp',
    'Updated At',
    'Title',
    'SEO Title',
    'Summary',
    'Hook',
    'Body',
    'CTA',
    'Tags',
    'Template',
    'Category',
    'Monetization Score',
    'Affiliate Angle',
    'Source URL',
    'Status',
    'Published URL',
    'Error',
    'Source',
    'PubDate',
    'Content Hash'
  ],

  getOrCreateSheet() {
    const spreadsheetId = Autonote.Config.getSpreadsheetId();

    if (!spreadsheetId) {
      const spreadsheet = SpreadsheetApp.create('AutoNote - News Summary');
      const sheet = spreadsheet.getActiveSheet();
      sheet.appendRow(this.HEADERS);
      Autonote.Config.setSpreadsheetId(spreadsheet.getId());
      return sheet;
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getActiveSheet();
    this.ensureHeaders(sheet);
    return sheet;
  },

  ensureHeaders(sheet) {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      sheet.appendRow(this.HEADERS);
      return;
    }

    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastColumn, 1)).getValues()[0];
    const missingHeaders = this.HEADERS.filter((header) => currentHeaders.indexOf(header) === -1);
    if (missingHeaders.length > 0) {
      sheet.getRange(1, currentHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    }
  },

  getHeaderMap(sheet) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const map = {};
    headers.forEach((header, index) => {
      map[header] = index + 1;
    });
    return map;
  },

  getContentHash(article) {
    const raw = [article.title, article.link, article.description].join('\n');
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    return bytes.map((byte) => {
      const value = byte < 0 ? byte + 256 : byte;
      return ('0' + value.toString(16)).slice(-2);
    }).join('');
  },

  findRowByArticle(article) {
    const sheet = this.getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return 0;
    }

    const headers = this.getHeaderMap(sheet);
    const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const contentHash = this.getContentHash(article);
    const sourceUrlColumn = headers['Source URL'] - 1;
    const contentHashColumn = headers['Content Hash'] - 1;

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if ((article.link && row[sourceUrlColumn] === article.link) || row[contentHashColumn] === contentHash) {
        return i + 2;
      }
    }

    return 0;
  },

  hasProcessedArticle(article) {
    return this.findRowByArticle(article) > 0;
  },

  createArticleRecord(article, generated, publishResult) {
    const sheet = this.getOrCreateSheet();
    const now = new Date();
    const status = publishResult && publishResult.ok ? 'Posted' : (publishResult && publishResult.attempted ? 'Error' : 'Draft');
    const rowObject = {
      'Timestamp': now,
      'Updated At': now,
      'Title': generated.title || article.title,
      'SEO Title': generated.seoTitle || generated.title || article.title,
      'Summary': generated.summary || '',
      'Hook': generated.hook || '',
      'Body': generated.body || '',
      'CTA': generated.cta || '',
      'Tags': Array.isArray(generated.tags) ? generated.tags.join(',') : '',
      'Template': generated.template || '',
      'Category': generated.category || '',
      'Monetization Score': generated.monetizationScore || '',
      'Affiliate Angle': generated.affiliateAngle || '',
      'Source URL': article.link,
      'Status': status,
      'Published URL': publishResult && publishResult.url ? publishResult.url : '',
      'Error': publishResult && publishResult.error ? publishResult.error : '',
      'Source': article.source,
      'PubDate': article.pubDate,
      'Content Hash': this.getContentHash(article)
    };

    const headers = this.getHeaderMap(sheet);
    const row = Object.keys(headers).map((header) => rowObject[header] || '');
    sheet.appendRow(row);

    console.log(`Article record created: ${rowObject.Title} (${status})`);
    return true;
  }
};
