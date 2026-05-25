const state = {
  posts: [],
  selectedCategory: 'all'
};

const postList = document.querySelector('#post-list');
const postDetail = document.querySelector('#post-detail');
const categoryButtons = document.querySelectorAll('[data-category]');

async function loadPosts() {
  try {
    const response = await fetch('./content/posts/index.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load index: ${response.status}`);
    }
    state.posts = await response.json();
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
        <span class="score">${Number(post.monetizationScore || 0)} pts</span>
      </div>
      <h3>${escapeHtml(post.title || '')}</h3>
      <p>${escapeHtml(post.summary || '')}</p>
    </button>
  `).join('');

  postList.querySelectorAll('[data-slug]').forEach((button) => {
    button.addEventListener('click', () => openPost(button.dataset.slug));
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
  const firstSlug = requestedSlug || (posts[0] && posts[0].slug);
  if (firstSlug) {
    openPost(firstSlug);
  }
}

async function openPost(slug) {
  try {
    const response = await fetch(`./content/posts/${encodeURIComponent(slug)}.json`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load post: ${response.status}`);
    }
    const post = await response.json();
    renderPost(post);
    postList.querySelectorAll('.post-card').forEach((button) => {
      button.classList.toggle('active', button.dataset.slug === slug);
    });
    window.history.replaceState({}, '', `?post=${encodeURIComponent(slug)}`);
  } catch (error) {
    postDetail.innerHTML = '<p class="error-state">記事を読み込めませんでした。</p>';
  }
}

function renderPost(post) {
  document.title = post.seoTitle || post.title || 'AutoTool Notes';
  postDetail.innerHTML = `
    <div class="post-meta">
      <span>${escapeHtml(post.date || '')}</span>
      <span class="pill">${escapeHtml(post.category || 'Article')}</span>
      <span class="score">${Number(post.monetizationScore || 0)} pts</span>
    </div>
    <h2>${escapeHtml(post.title || '')}</h2>
    <p class="summary">${escapeHtml(post.summary || post.hook || '')}</p>
    <div class="tag-row">${(post.tags || []).map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join('')}</div>
    <div class="post-body">${linkify(escapeHtml(post.body || ''))}</div>
    ${post.cta ? `<div class="cta-box">${escapeHtml(post.cta)}</div>` : ''}
    ${post.sourceUrl ? `<p><a class="source-link" href="${escapeAttribute(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">出典を確認する</a></p>` : ''}
  `;
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    categoryButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.selectedCategory = button.dataset.category;
    renderList();
    openInitialPost();
  });
});

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

function linkify(value) {
  return value.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

loadPosts();
