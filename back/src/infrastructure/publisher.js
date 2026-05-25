var Autonote = Autonote || {};
Autonote.Infrastructure = Autonote.Infrastructure || {};

Autonote.Infrastructure.Publisher = {
  publish(generated, article) {
    const mode = Autonote.Config.getPublishMode();
    if (mode === 'draft') {
      return {
        attempted: false,
        ok: false,
        url: '',
        error: ''
      };
    }

    if (mode === 'webhook') {
      return this.publishToWebhook(generated, article);
    }

    if (mode === 'github') {
      return this.publishToGithub(generated, article);
    }

    if (mode === 'multi') {
      return this.publishToMultipleTargets(generated, article);
    }

    return {
      attempted: true,
      ok: false,
      url: '',
      error: `Unsupported publish mode: ${mode}`
    };
  },

  publishToMultipleTargets(generated, article) {
    const results = [];
    if (Autonote.Config.getNoteWebhookUrl()) {
      results.push(this.publishToWebhook(generated, article));
    }
    if (Autonote.Config.getGithubToken() && Autonote.Config.getGithubRepo()) {
      results.push(this.publishToGithub(generated, article));
    }

    if (results.length === 0) {
      return {
        attempted: true,
        ok: false,
        url: '',
        error: 'No publish targets configured.'
      };
    }

    const failed = results.filter((result) => !result.ok);
    return {
      attempted: true,
      ok: failed.length === 0,
      url: results.map((result) => result.url).filter(Boolean).join(', '),
      error: failed.map((result) => result.error).filter(Boolean).join(' | ')
    };
  },

  publishToWebhook(generated, article) {
    const webhookUrl = Autonote.Config.getNoteWebhookUrl();
    if (!webhookUrl) {
      return {
        attempted: true,
        ok: false,
        url: '',
        error: 'NOTE_WEBHOOK_URL is not set.'
      };
    }

    const payload = {
      title: generated.title,
      seoTitle: generated.seoTitle || generated.title,
      hook: generated.hook || '',
      body: generated.body,
      summary: generated.summary,
      cta: generated.cta || '',
      tags: generated.tags || [],
      template: generated.template || '',
      sourceUrl: article.link,
      sourceTitle: article.title,
      publishedAt: article.pubDate || '',
      visibility: 'public'
    };

    const headers = {};
    const secret = Autonote.Config.getNoteWebhookSecret();
    if (secret) {
      headers['X-Autonote-Secret'] = secret;
    }

    try {
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        headers,
        muteHttpExceptions: true
      });
      const statusCode = response.getResponseCode();
      const body = response.getContentText();
      const parsed = this.tryParseJson(body);

      if (statusCode >= 200 && statusCode < 300) {
        return {
          attempted: true,
          ok: true,
          url: parsed.url || parsed.publishedUrl || '',
          error: ''
        };
      }

      return {
        attempted: true,
        ok: false,
        url: '',
        error: `Webhook failed (${statusCode}): ${body.substring(0, 500)}`
      };
    } catch (error) {
      return {
        attempted: true,
        ok: false,
        url: '',
        error: error.toString()
      };
    }
  },

  publishToGithub(generated, article) {
    const token = Autonote.Config.getGithubToken();
    const repo = Autonote.Config.getGithubRepo();
    const branch = Autonote.Config.getGithubBranch();
    const postsPath = Autonote.Config.getGithubPostsPath();

    if (!token || !repo) {
      return {
        attempted: true,
        ok: false,
        url: '',
        error: 'GITHUB_TOKEN and GITHUB_REPO are required.'
      };
    }

    try {
      const slug = this.createSlug(generated.title || article.title);
      const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const postPath = `${postsPath}/${slug}.json`;
      const post = this.buildSitePost(generated, article, slug, date);
      this.putGithubFile(repo, branch, postPath, JSON.stringify(post, null, 2), `Publish article: ${generated.title}`, token);
      this.upsertGithubIndex(repo, branch, postsPath, post, token);

      const siteBaseUrl = Autonote.Config.getSiteBaseUrl();
      return {
        attempted: true,
        ok: true,
        url: siteBaseUrl ? `${siteBaseUrl.replace(/\/$/, '')}/?post=${encodeURIComponent(post.slug)}` : postPath,
        error: ''
      };
    } catch (error) {
      return {
        attempted: true,
        ok: false,
        url: '',
        error: error.toString()
      };
    }
  },

  buildSitePost(generated, article, slug, date) {
    return {
      slug,
      date,
      title: generated.title,
      seoTitle: generated.seoTitle || generated.title,
      summary: generated.summary || '',
      hook: generated.hook || '',
      body: generated.body || '',
      cta: generated.cta || '',
      tags: generated.tags || [],
      category: generated.category || '',
      categoryId: generated.categoryId || '',
      monetizationScore: generated.monetizationScore || 0,
      affiliateAngle: generated.affiliateAngle || '',
      sourceUrl: article.link,
      sourceTitle: article.title,
      publishedAt: article.pubDate || ''
    };
  },

  upsertGithubIndex(repo, branch, postsPath, post, token) {
    const indexPath = `${postsPath}/index.json`;
    const current = this.getGithubFile(repo, branch, indexPath, token);
    let posts = [];
    if (current && current.content) {
      posts = JSON.parse(current.content);
    }

    posts = posts.filter((item) => item.slug !== post.slug);
    posts.unshift({
      slug: post.slug,
      date: post.date,
      title: post.title,
      seoTitle: post.seoTitle,
      summary: post.summary,
      tags: post.tags,
      category: post.category,
      categoryId: post.categoryId,
      monetizationScore: post.monetizationScore,
      sourceUrl: post.sourceUrl
    });

    this.putGithubFile(repo, branch, indexPath, JSON.stringify(posts.slice(0, 500), null, 2), `Update post index: ${post.title}`, token, current ? current.sha : '');
  },

  getGithubFile(repo, branch, path, token) {
    const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: this.githubHeaders(token),
      muteHttpExceptions: true
    });
    const statusCode = response.getResponseCode();
    if (statusCode === 404) {
      return null;
    }
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`GitHub get failed (${statusCode}): ${response.getContentText().substring(0, 500)}`);
    }

    const json = JSON.parse(response.getContentText());
    return {
      sha: json.sha,
      content: Utilities.newBlob(Utilities.base64Decode(json.content.replace(/\s/g, ''))).getDataAsString('UTF-8')
    };
  },

  putGithubFile(repo, branch, path, content, message, token, sha) {
    const current = sha ? { sha } : this.getGithubFile(repo, branch, path, token);
    const payload = {
      message,
      content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
      branch
    };
    if (current && current.sha) {
      payload.sha = current.sha;
    }

    const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
    const response = UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      headers: this.githubHeaders(token),
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const statusCode = response.getResponseCode();
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`GitHub put failed (${statusCode}): ${response.getContentText().substring(0, 500)}`);
    }
  },

  githubHeaders(token) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  },

  createSlug(title) {
    const roman = String(title || 'article')
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, title || 'article', Utilities.Charset.UTF_8)
      .map((byte) => {
        const value = byte < 0 ? byte + 256 : byte;
        return ('0' + value.toString(16)).slice(-2);
      })
      .join('')
      .substring(0, 8);
    return `${roman || 'article'}-${digest}`;
  },

  tryParseJson(text) {
    try {
      return JSON.parse(text || '{}');
    } catch (error) {
      return {};
    }
  }
};
