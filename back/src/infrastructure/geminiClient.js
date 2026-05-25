var Autonote = Autonote || {};
Autonote.Infrastructure = Autonote.Infrastructure || {};

Autonote.Infrastructure.GeminiClient = {
  generateArticle(article, category, preScore) {
    const sourceText = Autonote.Utils.Text.takeFirstNChars(article.description, 3000);
    const template = Autonote.Domain.ArticleStrategy.getTemplate(Autonote.Config.getArticleTemplate());
    const affiliateLinks = Autonote.Config.getAffiliateLinks();
    const monetizationMode = Autonote.Config.getMonetizationMode();
    const disclosure = monetizationMode === 'affiliate' ? Autonote.Config.getAffiliateDisclosure() : '';
    const prompt = this.buildArticlePrompt(article, sourceText, template, affiliateLinks, disclosure, category, preScore);

    const result = this.callGemini(prompt, true);
    if (!result) {
      return null;
    }

    return {
      title: result.title || article.title,
      seoTitle: result.seoTitle || result.title || article.title,
      summary: result.summary || '',
      hook: result.hook || '',
      body: this.withRequiredNotices(result.body || result.summary || '', article.link, disclosure),
      cta: result.cta || '',
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 5) : [],
      template: template.name,
      category: result.category || category.label,
      categoryId: category.id,
      monetizationScore: Number(result.monetizationScore || preScore.score || 0),
      affiliateAngle: result.affiliateAngle || ''
    };
  },

  buildArticlePrompt(article, sourceText, template, affiliateLinks, disclosure, category, preScore) {
    const rules = Autonote.Domain.ArticleStrategy.getWritingRules();
    const affiliateCatalog = affiliateLinks.length > 0
      ? JSON.stringify(affiliateLinks.slice(0, 10))
      : '[]';

    return [
      'あなたは日本語のnote記事編集者兼アフィリエイト編集者です。',
      '目的は、ニュースを丸めるだけでなく、読者が背景・用語・影響を理解し、必要なら次の行動を取れる記事にすることです。',
      '以下のRSS抜粋だけを根拠にしてください。不明な事実は「現時点では不明」と書いてください。',
      '',
      '記事テンプレート:',
      `- name: ${template.name}`,
      `- purpose: ${template.purpose}`,
      '- structure:',
      template.structure.map((item) => `  - ${item}`).join('\n'),
      '',
      '編集ルール:',
      rules.map((rule) => `- ${rule}`).join('\n'),
      '',
      '収益化ルール:',
      disclosure ? `- 本文の冒頭付近に次の開示文を自然に入れる: ${disclosure}` : '- 広告導線は入れない。',
      '- アフィリエイトリンク候補が記事内容と関係ない場合は使わない。',
      '- 商品・サービスを紹介する場合は、メリットだけでなく注意点も添える。',
      '- CTAは強引に煽らず、読者の状況に合う行動を1つ提示する。',
      '',
      '分類情報:',
      `- categoryId: ${category.id}`,
      `- categoryLabel: ${category.label}`,
      `- categoryDescription: ${category.description}`,
      `- likelyAffiliateAngles: ${category.affiliateAngles.join(', ')}`,
      `- preScore: ${preScore.score}`,
      `- scoreReasons: ${preScore.reasons.join(', ')}`,
      '',
      'アフィリエイトリンク候補(JSON):',
      affiliateCatalog,
      '',
      '出力はJSONだけにしてください。',
      'JSON schema:',
      '{"title":"note向けタイトル","seoTitle":"検索向けタイトル","summary":"120字以内","hook":"冒頭の掴み","body":"本文。900〜1600字。Markdown見出しを使う","cta":"最後の行動喚起","tags":["タグ1","タグ2","タグ3"],"category":"分類名","monetizationScore":80,"affiliateAngle":"自然に紹介できる導線。なければ空文字"}',
      '',
      `元タイトル: ${article.title}`,
      `出典URL: ${article.link}`,
      `公開日: ${article.pubDate || '不明'}`,
      '',
      `RSS抜粋:\n${sourceText}`
    ].join('\n');
  },

  summarize(text) {
    const result = this.callGemini(`以下のテキストを日本語で簡潔に要約してください。200文字以内の要約文を1つ作成してください。\n\n${text}`, false);
    return result || '';
  },

  callGemini(prompt, asJson) {
    const apiKey = Autonote.Config.getGeminiApiKey();
    if (!apiKey) {
      console.log('Error: GEMINI_API_KEY が設定されていません');
      return null;
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: asJson ? {
        responseMimeType: 'application/json'
      } : undefined
    };

    try {
      const response = UrlFetchApp.fetch(Autonote.Config.GEMINI_API_URL + '?key=' + apiKey, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const text = result.candidates[0].content.parts[0].text;
        return asJson ? this.parseJsonResponse(text) : text;
      }

      if (result.error) {
        console.log(`Gemini API Error: ${result.error.message}`);
      }
    } catch (error) {
      console.log(`Error calling Gemini API: ${error.toString()}`);
    }

    return null;
  },

  parseJsonResponse(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      const match = String(text || '').match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw error;
    }
  },

  withRequiredNotices(body, sourceUrl, disclosure) {
    const normalizedBody = Autonote.Utils.Text.normalizeWhitespace(body);
    const sourceNotice = [
      '',
      '---',
      '本稿は公開RSSの情報をもとにした要約・解説です。詳細は出典をご確認ください。',
      `出典: ${sourceUrl}`
    ].join('\n');
    const bodyWithDisclosure = disclosure && normalizedBody.indexOf(disclosure) === -1
      ? `${disclosure}\n\n${normalizedBody}`
      : normalizedBody;

    return bodyWithDisclosure.indexOf(sourceUrl) === -1 ? bodyWithDisclosure + sourceNotice : bodyWithDisclosure;
  }
};
