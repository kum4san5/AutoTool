var Autonote = Autonote || {};
Autonote.Utils = Autonote.Utils || {};
Autonote.Utils.Network = Autonote.Utils.Network || {};

/**
 * URL をフェッチしてレスポンス情報をログ出力する（デバッグ用）
 * @param {string} url
 */
Autonote.Utils.Network.debugFetch = function (url) {
  try {
    console.log(`Debug fetch start: ${url}`);
    const opts = {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Google-Apps-Script)'
      }
    };

    const response = UrlFetchApp.fetch(url, opts);
    const code = response.getResponseCode();
    const headers = response.getHeaders();
    const content = response.getContentText();

    console.log(`Response code: ${code}`);
    console.log(`Content-Type: ${headers['Content-Type'] || headers['content-type']}`);

    // 最初の 2000 文字をログ出力（長すぎると切る）
    const sample = content ? content.substring(0, 2000) : '';
    console.log('Content sample start:\n' + sample + '\nContent sample end');

    return {
      code: code,
      headers: headers,
      sample: sample
    };
  } catch (e) {
    console.log(`Fetch error: ${e.toString()}`);
    return { error: e.toString() };
  }
};
