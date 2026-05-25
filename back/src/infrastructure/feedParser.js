var Autonote = Autonote || {};
Autonote.Infrastructure = Autonote.Infrastructure || {};

Autonote.Infrastructure.FeedParser = {
  fetchNewsContent(url) {
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      if (response.getResponseCode() !== 200) {
        console.log(`Failed to fetch: ${url} (Status: ${response.getResponseCode()})`);
        return [];
      }

      const headers = response.getHeaders();
      const contentType = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
      const content = response.getContentText();
      const isXml = /xml|rss|atom/.test(contentType) || /<\?xml|<rss|<feed/i.test(content);
      const isHtml = /html/.test(contentType) || /<html/i.test(content);

      if (isXml) {
        return this.parseRSSFeed(content, Autonote.Config.getMaxArticlesPerSite());
      }

      if (isHtml) {
        console.log(`Fetched HTML content from RSS URL: ${url}`);
        return this.parseHtmlContent(content, url);
      }

      console.log(`Unsupported content type for URL ${url}: ${contentType}`);
      return [];
    } catch (error) {
      console.log(`Error fetching ${url}: ${error.toString()}`);
      return [];
    }
  },

  parseRSSFeed(rssContent, maxItems) {
    const articles = [];

    try {
      const doc = XmlService.parse(rssContent);
      const root = doc.getRootElement();
      let items = this.getChildrenByLocalName(root, 'item');

      if (items.length === 0) {
        const channel = this.getChildByLocalName(root, 'channel');
        if (channel) {
          items = this.getChildrenByLocalName(channel, 'item');
        }
      }

      if (items.length === 0) {
        items = this.getChildrenByLocalName(root, 'entry');
      }

      if (items.length === 0) {
        const channel = this.getChildByLocalName(root, 'channel');
        if (channel) {
          items = this.getChildrenByLocalName(channel, 'entry');
        }
      }

      items.slice(0, maxItems || 5).forEach((item) => {
        const title = this.cleanText(this.getXmlElementText(item, 'title'));
        const description = this.cleanText(
          this.getXmlElementText(item, 'description') ||
          this.getXmlElementText(item, 'summary') ||
          this.getXmlElementText(item, 'content')
        );
        const link = this.extractLink(item);
        const pubDate = this.getXmlElementText(item, 'pubDate') ||
          this.getXmlElementText(item, 'published') ||
          this.getXmlElementText(item, 'updated');

        if (title && description && link) {
          articles.push(Autonote.Domain.Article({
            title,
            description,
            link,
            pubDate,
            source: 'RSS'
          }));
        }
      });
    } catch (error) {
      console.log(`Error parsing RSS: ${error.toString()}`);
    }

    return articles;
  },

  parseHtmlContent(htmlContent, url) {
    const title = this.cleanText(
      Autonote.Utils.Text.extractFirstMatch(htmlContent, /<title[^>]*>([^<]*)<\/title>/i, 'Untitled')
    );

    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let description = bodyMatch ? bodyMatch[1] : htmlContent;
    description = Autonote.Utils.Text.takeFirstNChars(
      this.cleanText(description),
      1000
    );

    return [Autonote.Domain.Article({
      title,
      description,
      link: url,
      pubDate: new Date().toISOString(),
      source: 'HTML'
    })];
  },

  getXmlElementText(element, tagName) {
    try {
      const child = this.getChildByLocalName(element, tagName);
      return child ? child.getText() : '';
    } catch (e) {
      return '';
    }
  },

  getChildByLocalName(element, tagName) {
    const children = element.getChildren();
    for (let i = 0; i < children.length; i++) {
      if (children[i].getName() === tagName) {
        return children[i];
      }
    }
    return null;
  },

  getChildrenByLocalName(element, tagName) {
    return element.getChildren().filter((child) => child.getName() === tagName);
  },

  extractLink(item) {
    const linkElement = this.getChildByLocalName(item, 'link');
    if (!linkElement) {
      return '';
    }

    const href = linkElement.getAttribute('href');
    return href ? href.getValue() : linkElement.getText();
  },

  cleanText(text) {
    const withoutCdata = Autonote.Utils.Text.stripCdata(text);
    const withoutTags = Autonote.Utils.Text.stripHtmlTags(withoutCdata);
    const decoded = Autonote.Utils.Text.decodeHtmlEntities(withoutTags);
    return Autonote.Utils.Text.normalizeWhitespace(decoded);
  }
};
