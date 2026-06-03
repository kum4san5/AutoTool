const state = {
  posts: [],
  selectedCategory: 'all',
  selectedSlug: ''
};

const postList = document.querySelector('#post-list');
const postDetail = document.querySelector('#post-detail');
const contentLayout = document.querySelector('.content-layout');
const categoryButtons = document.querySelectorAll('[data-category]');
const themeToggle = document.querySelector('#theme-toggle');
const themeStorageKey = 'shirokuma-theme';

async function loadPosts() {
  try {
    const response = await fetch('./content/posts/index.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load index: ${response.status}`);
    }
    state.posts = await response.json();
    normalizePosts();
    renderCategoryCounts();
    renderList();
    openInitialPost();
  } catch (error) {
    postList.innerHTML = '<p class="error-state">まだ公開記事がありません。</p>';
    postDetail.innerHTML = '<p class="empty-state">GASからGitHub Pagesへ記事が公開されると、ここに表示されます。</p>';
  }
}

function renderList() {
  const posts = getFilteredPosts();
  if (posts.length === 0) {
    postList.innerHTML = '<p class="empty-state">このカテゴリの記事はまだありません。</p>';
    return;
  }

  postList.innerHTML = posts.map((post) => `
    <button type="button" class="post-card" data-slug="${escapeHtml(post.slug)}">
      <div class="post-meta">
        <span>${escapeHtml(post.date || '')}</span>
        <span class="pill">${escapeHtml(post.category || 'Article')}</span>
      </div>
      <h3>${escapeHtml(post.title || '')}</h3>
      <p>${escapeHtml(post.summary || '')}</p>
    </button>
  `).join('');

  postList.querySelectorAll('[data-slug]').forEach((button) => {
    button.addEventListener('click', () => selectPostPreview(button.dataset.slug));
  });
}

function getFilteredPosts() {
  if (state.selectedCategory === 'all') {
    return state.posts;
  }
  return state.posts.filter((post) => post.categoryId === state.selectedCategory);
}

function openInitialPost() {
  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get('post');
  const posts = getFilteredPosts();
  if (requestedSlug) {
    const post = findPost(requestedSlug);
    if (post) {
      selectPostPreview(requestedSlug, true);
      return;
    }
  } else if (!contentLayout.classList.contains('article-mode') && posts[0]) {
    selectPostPreview(posts[0].slug, false);
  }
}

function selectPostPreview(slug, updateUrl) {
  const post = findPost(slug);
  if (!post) {
    postDetail.innerHTML = '<p class="error-state">記事を読み込めませんでした。</p>';
    return;
  }

  state.selectedSlug = slug;
  contentLayout.classList.remove('article-mode');
  document.body.classList.remove('article-open');
  renderPostPreview(post);
  trackEvent(post, 'preview');
  postList.querySelectorAll('.post-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.slug === slug);
  });
  if (updateUrl) {
    window.history.replaceState({}, '', `?post=${encodeURIComponent(slug)}`);
  }
}

async function openPostPreview(slug) {
  try {
    const response = await fetch(`./content/posts/${encodeURIComponent(slug)}.json`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load post: ${response.status}`);
    }
    const post = await response.json();
    renderPost(post);
    contentLayout.classList.add('article-mode');
    document.body.classList.add('article-open');
    trackView(post);
    postList.querySelectorAll('.post-card').forEach((button) => {
      button.classList.toggle('active', button.dataset.slug === slug);
    });
    window.history.replaceState({}, '', getPostUrl(post));
  } catch (error) {
    postDetail.innerHTML = '<p class="error-state">記事を読み込めませんでした。</p>';
  }
}

function renderPost(post) {
  document.title = post.seoTitle || post.title || 'しろくまナレッジ';
  postDetail.innerHTML = `
    <div class="post-meta">
      <button type="button" class="back-button" data-close-post>一覧へ戻る</button>
      <span>${escapeHtml(post.date || '')}</span>
      <span class="pill">${escapeHtml(post.category || 'Article')}</span>
    </div>
    <h2>${escapeHtml(post.title || '')}</h2>
    <p class="summary">${escapeHtml(post.summary || post.hook || '')}</p>
    <div class="tag-row">${(post.tags || []).map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join('')}</div>
    <div class="post-body">${renderMarkdown(post.body || '', post, 'body')}</div>
    ${post.cta ? `<div class="cta-box">${escapeHtml(post.cta)}</div>` : ''}
    <div class="post-actions-bottom">
      ${post.sourceUrl ? `<a class="source-link" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">出典を確認する</a>` : ''}
      <button type="button" class="back-button" data-close-post>記事一覧へ戻る</button>
    </div>
  `;
  postDetail.querySelectorAll('[data-close-post]').forEach((button) => {
    button.addEventListener('click', closePost);
  });
}

function renderPostPreview(post) {
  postDetail.innerHTML = `
    <div class="preview-pick">
      <span class="pill">${escapeHtml(post.category || 'Article')}</span>
      <h2>${escapeHtml(post.title || '')}</h2>
      <p>${escapeHtml(post.summary || '')}</p>
      <div class="tag-row">${(post.tags || []).map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="preview-actions">
        <a class="read-button" href="${escapeAttribute(getPostUrl(post))}" data-read-slug="${escapeAttribute(post.slug || '')}">記事を読む</a>
        ${post.sourceUrl ? `<a class="source-link" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">出典を確認する</a>` : ''}
      </div>
    </div>
  `;
  postDetail.querySelectorAll('[data-read-slug]').forEach((link) => {
    link.addEventListener('click', () => trackReadClick(link.dataset.readSlug));
  });
}

function closePost() {
  contentLayout.classList.remove('article-mode');
  document.body.classList.remove('article-open');
  document.title = 'しろくまナレッジ';
  postList.querySelectorAll('.post-card').forEach((button) => {
    button.classList.remove('active');
  });
  window.history.replaceState({}, '', window.location.pathname);
  const posts = getFilteredPosts();
  if (posts[0]) {
    selectPostPreview(posts[0].slug, false);
  } else {
    postDetail.innerHTML = '<p class="empty-state">記事を選ぶと本文が表示されます。</p>';
  }
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.disabled) {
      return;
    }
    categoryButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.selectedCategory = button.dataset.category;
    renderList();
    closePost();
  });
});

function initializeTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

function setTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(themeStorageKey, nextTheme);
  if (themeToggle) {
    themeToggle.textContent = nextTheme === 'dark' ? 'Light' : 'Dark';
    themeToggle.setAttribute('aria-label', `${nextTheme === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替える`);
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme || 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}

function renderMarkdown(markdown, post, kind) {
  const lines = String(markdown || '').split(/\r?\n/);
  const html = [];
  let listType = '';

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = '';
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length + 1;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2], post, kind)}</h${level}>`);
      return;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${renderInlineMarkdown(unordered[1], post, kind)}</li>`);
      return;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${renderInlineMarkdown(ordered[1], post, kind)}</li>`);
      return;
    }

    const quote = trimmed.match(/^>\s+(.+)$/);
    if (quote) {
      closeList();
      html.push(`<blockquote>${renderInlineMarkdown(quote[1], post, kind)}</blockquote>`);
      return;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed, post, kind)}</p>`);
  });

  closeList();
  return html.join('');
}

function normalizePosts() {
  state.posts = state.posts.map((post) => {
    return Object.assign({}, post, {
      categoryId: inferCategoryId(post)
    });
  });
}

function renderCategoryCounts() {
  const counts = state.posts.reduce((accumulator, post) => {
    accumulator.all += 1;
    accumulator[post.categoryId] = (accumulator[post.categoryId] || 0) + 1;
    return accumulator;
  }, { all: 0 });

  categoryButtons.forEach((button) => {
    const category = button.dataset.category;
    const count = counts[category] || 0;
    const countElement = button.querySelector('.count');
    if (countElement) {
      countElement.textContent = String(count);
    }
    button.disabled = category !== 'all' && count === 0;
    button.classList.toggle('is-empty', category !== 'all' && count === 0);
  });
}

function inferCategoryId(post) {
  const explicit = String(post.categoryId || '').trim();
  if (['it_ai', 'pc_gadget', 'food_cafe', 'food_item', 'nature_spot'].indexOf(explicit) !== -1) {
    return explicit;
  }

  const text = `${post.category || ''} ${(post.tags || []).join(' ')} ${post.title || ''} ${post.summary || ''}`.toLowerCase();
  if (/(ガジェット|pc|パソコン|キーボード|マウス|モニター|周辺機器|スペック|性能|レビュー|比較|新製品)/i.test(text)) {
    return 'pc_gadget';
  }
  if (/(カフェ|コーヒー店|喫茶|ランチ|レストラン|スイーツ店|パン屋|ベーカリー|飲食店|作業カフェ|モーニング|店舗|お店|新店|オープン)/i.test(text)) {
    return 'food_cafe';
  }
  if (/(食品|飲料|ドリンク|レシピ|料理|食材|お菓子|スイーツ|コーヒー豆|紅茶|冷凍食品|ミールキット|お取り寄せ|新商品|限定商品|調味料|キッチン用品)/i.test(text)) {
    return 'food_item';
  }
  if (/(屋久島|日光|嵐山|上高地|箱根|軽井沢|白川郷|自然|景色|観光地|名所|公園|庭園|神社|寺|滝|島|絶景|紅葉|桜|散策|旅行先)/i.test(text)) {
    return 'nature_spot';
  }
  return 'it_ai';
}

function findPost(slug) {
  return state.posts.filter((post) => post.slug === slug)[0] || null;
}

function getPostUrl(post) {
  return post.url || `./posts/${encodeURIComponent(post.slug)}/`;
}

function renderInlineMarkdown(value, post, kind) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (match, text, url) => {
    const trackedUrl = buildTrackedUrl(decodeHtml(url), post, kind);
    return `<a href="${escapeAttribute(trackedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(decodeHtml(text))}</a>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return linkify(html, post, kind);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function linkify(value, post, kind) {
  return value.replace(/(^|[^"'=])(https?:\/\/[^\s<]+)/g, (match, prefix, url) => {
    const cleanUrl = decodeHtml(url).replace(/[).,、。]+$/, '');
    const suffix = decodeHtml(url).slice(cleanUrl.length);
    const trackedUrl = buildTrackedUrl(cleanUrl, post, kind);
    return `${prefix}<a href="${escapeAttribute(trackedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanUrl)}</a>${escapeHtml(suffix)}`;
  });
}

function decodeHtml(value) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function buildTrackedUrl(url, post, kind) {
  if (!post.clickTrackerUrl || url === post.sourceUrl) {
    return url;
  }
  const params = new URLSearchParams({
    action: 'go',
    url,
    slug: post.slug || '',
    kind: kind || 'link',
    title: post.title || '',
    referrer: document.referrer || ''
  });
  return `${post.clickTrackerUrl}${post.clickTrackerUrl.includes('?') ? '&' : '?'}${params.toString()}`;
}

function trackView(post) {
  trackEvent(post, 'view');
}

function trackReadClick(slug) {
  const post = findPost(slug);
  if (post) {
    trackEvent(post, 'read');
  }
}

function trackEvent(post, kind) {
  if (!post || !post.clickTrackerUrl) {
    return;
  }
  const params = new URLSearchParams({
    action: 'event',
    kind: kind || 'view',
    slug: post.slug || '',
    title: post.title || '',
    referrer: document.referrer || '',
    t: String(Date.now())
  });
  const url = `${post.clickTrackerUrl}${post.clickTrackerUrl.includes('?') ? '&' : '?'}${params.toString()}`;
  try {
    fetch(url, { mode: 'no-cors', keepalive: true });
  } catch (error) {
    // Ignore tracking failures in the public UI.
  }
  const img = document.createElement('img');
  img.alt = '';
  img.width = 1;
  img.height = 1;
  img.style.position = 'absolute';
  img.style.left = '-9999px';
  img.src = url;
  document.body.appendChild(img);
}

initializeTheme();
loadPosts();
