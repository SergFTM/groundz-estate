<script lang="ts">
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import JsonLd from '$lib/components/seo/JsonLd.svelte';

  let { data } = $props();
  let { article, related, seoProfile, currentUser } = $derived(data);

  let dateStr = $derived(
    new Date(article.publishedAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  );

  // Comments state
  type CommentUser = { id: string; name: string | null; email: string; role: string };
  type Reply = { id: string; content: string; createdAt: string | Date; userId: string; user: CommentUser; likes: { userId: string }[] };
  type Comment = Reply & { replies: Reply[]; parentId: null };

  let comments = $state<Comment[]>(data.comments as Comment[]);
  let newText = $state('');
  let submitting = $state(false);
  let replyingTo = $state<string | null>(null);
  let replyText = $state('');

  const ROLE_LABEL: Record<string, string> = {
    internal_team: 'Groundz Team',
    investor: 'Investor',
    buyer: 'Buyer',
    agent: 'Agent',
  };

  const ROLE_COLOR: Record<string, string> = {
    internal_team: 'var(--color-accent)',
    investor: '#6366f1',
    buyer: '#0ea5e9',
    agent: '#f59e0b',
  };

  function initials(user: CommentUser) {
    const name = user.name || user.email;
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function timeAgo(date: string | Date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  async function postComment() {
    if (!newText.trim() || submitting) return;
    submitting = true;
    try {
      const res = await fetch('/api/articles/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, content: newText.trim() }),
      });
      if (res.ok) {
        const c = await res.json();
        comments = [c, ...comments];
        newText = '';
      }
    } finally { submitting = false; }
  }

  async function postReply(parentId: string) {
    if (!replyText.trim() || submitting) return;
    submitting = true;
    try {
      const res = await fetch('/api/articles/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, content: replyText.trim(), parentId }),
      });
      if (res.ok) {
        const reply = await res.json();
        comments = comments.map(c =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
        );
        replyText = '';
        replyingTo = null;
      }
    } finally { submitting = false; }
  }

  async function toggleLike(commentId: string) {
    if (!currentUser) return;
    const res = await fetch('/api/articles/comments/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) return;
    const { liked } = await res.json();
    const toggle = (c: Reply) => c.id === commentId
      ? { ...c, likes: liked ? [...c.likes, { userId: currentUser!.id }] : c.likes.filter(l => l.userId !== currentUser!.id) }
      : c;
    comments = comments.map(c => ({ ...toggle(c), replies: c.replies.map(toggle) } as Comment));
  }

  async function deleteComment(commentId: string, parentId?: string) {
    const res = await fetch('/api/articles/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    if (!res.ok) return;
    if (parentId) {
      comments = comments.map(c =>
        c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c
      );
    } else {
      comments = comments.filter(c => c.id !== commentId);
    }
  }
</script>

<svelte:head>
  <title>{seoProfile?.metaTitle ?? article.title} — Groundz</title>
  <meta name="description" content={seoProfile?.metaDescription ?? article.excerpt ?? article.title} />
  <link rel="canonical" href="https://groundz.estate/knowledge/{article.slug}" />
</svelte:head>

<JsonLd data={{
  '@type': 'Article',
  headline: article.title,
  description: article.excerpt ?? undefined,
  datePublished: new Date(article.publishedAt).toISOString(),
  mainEntityOfPage: `https://groundz.estate/knowledge/${article.slug}`,
  author: { '@type': 'Organization', name: 'GROUNDZ ESTATE', url: 'https://groundz.estate' },
  publisher: { '@type': 'Organization', name: 'GROUNDZ ESTATE' },
}} />

<article class="article-page">
  <div class="container">
    <a href="/knowledge" class="back-link">← Knowledge Base</a>

    <header class="article-header">
      <span class="article-category">{article.category}</span>
      <h1 class="article-title">{article.title}</h1>
      <time class="article-date">{dateStr}</time>
    </header>

    <div class="article-content prose">
      {@html article.content}
    </div>

    <!-- Discussion Section -->
    <section class="discussion">
      <div class="discussion__header">
        <h2 class="discussion__title">Discussion</h2>
        <span class="discussion__count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </div>

      {#if currentUser}
        <div class="comment-form">
          <div class="avatar" style="background: var(--color-accent);">{initials(currentUser as CommentUser)}</div>
          <div class="comment-form__right">
            <textarea
              class="comment-form__input"
              placeholder="Share your thoughts or ask a question…"
              bind:value={newText}
              rows="3"
            ></textarea>
            <div class="comment-form__actions">
              <button
                class="btn btn--sm btn--primary"
                onclick={postComment}
                disabled={submitting || !newText.trim()}
              >Post</button>
            </div>
          </div>
        </div>
      {:else}
        <div class="discussion__login">
          <a href="/auth/login" class="btn btn--sm btn--outline">Login to join the discussion</a>
        </div>
      {/if}

      <div class="comments-list">
        {#each comments as comment, i (comment.id)}
          <div class="comment" class:comment--right={i % 2 !== 0}>
            <div class="comment__avatar" style="background: {ROLE_COLOR[comment.user.role] ?? '#888'};">
              {initials(comment.user)}
            </div>
            <div class="comment__body">
              <div class="comment__meta">
                <span class="comment__name">{comment.user.name ?? comment.user.email.split('@')[0]}</span>
                <span class="comment__role" style="color: {ROLE_COLOR[comment.user.role] ?? '#888'};">
                  {ROLE_LABEL[comment.user.role] ?? comment.user.role}
                </span>
                <span class="comment__time">{timeAgo(comment.createdAt)}</span>
              </div>
              <p class="comment__text">{comment.content}</p>
              <div class="comment__actions">
                <button
                  class="action-btn"
                  class:action-btn--liked={currentUser && comment.likes.some(l => l.userId === currentUser?.id)}
                  onclick={() => toggleLike(comment.id)}
                  title={currentUser ? 'Like' : 'Login to like'}
                >
                  ♥ {comment.likes.length > 0 ? comment.likes.length : ''}
                </button>
                {#if currentUser}
                  <button class="action-btn" onclick={() => { replyingTo = replyingTo === comment.id ? null : comment.id; replyText = ''; }}>
                    Reply
                  </button>
                {/if}
                {#if currentUser && (currentUser.id === comment.userId || currentUser.role === 'internal_team')}
                  <button class="action-btn action-btn--delete" onclick={() => deleteComment(comment.id)}>Delete</button>
                {/if}
              </div>

              <!-- Reply form -->
              {#if replyingTo === comment.id}
                <div class="reply-form">
                  <textarea
                    class="comment-form__input"
                    placeholder="Write a reply…"
                    bind:value={replyText}
                    rows="2"
                  ></textarea>
                  <div class="comment-form__actions">
                    <button class="btn btn--sm btn--primary" onclick={() => postReply(comment.id)} disabled={submitting || !replyText.trim()}>Reply</button>
                    <button class="btn btn--sm btn--outline" onclick={() => replyingTo = null}>Cancel</button>
                  </div>
                </div>
              {/if}

              <!-- Replies -->
              {#if comment.replies.length > 0}
                <div class="replies">
                  {#each comment.replies as reply (reply.id)}
                    <div class="comment comment--reply">
                      <div class="comment__avatar comment__avatar--sm" style="background: {ROLE_COLOR[reply.user.role] ?? '#888'};">
                        {initials(reply.user)}
                      </div>
                      <div class="comment__body">
                        <div class="comment__meta">
                          <span class="comment__name">{reply.user.name ?? reply.user.email.split('@')[0]}</span>
                          <span class="comment__role" style="color: {ROLE_COLOR[reply.user.role] ?? '#888'};">
                            {ROLE_LABEL[reply.user.role] ?? reply.user.role}
                          </span>
                          <span class="comment__time">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p class="comment__text">{reply.content}</p>
                        <div class="comment__actions">
                          <button
                            class="action-btn"
                            class:action-btn--liked={currentUser && reply.likes.some(l => l.userId === currentUser?.id)}
                            onclick={() => toggleLike(reply.id)}
                          >♥ {reply.likes.length > 0 ? reply.likes.length : ''}</button>
                          {#if currentUser && (currentUser.id === reply.userId || currentUser.role === 'internal_team')}
                            <button class="action-btn action-btn--delete" onclick={() => deleteComment(reply.id, comment.id)}>Delete</button>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}

        {#if comments.length === 0}
          <p class="discussion__empty">No comments yet. Be the first to start the discussion.</p>
        {/if}
      </div>
    </section>

    {#if related.length > 0}
      <section class="related">
        <h2 class="related-title">Related Articles</h2>
        <div class="related-grid">
          {#each related as r}
            <ArticleCard
              slug={r.slug}
              title={r.title}
              category={r.category}
              publishedAt={r.publishedAt}
              excerpt={r.excerpt}
              imageUrl={r.imageUrl}
            />
          {/each}
        </div>
      </section>
    {/if}
  </div>
</article>

<style>
  .article-page {
    padding: var(--space-16) 0 var(--space-20);
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .back-link {
    display: inline-block;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    margin-bottom: var(--space-8);
  }

  .back-link:hover { color: var(--color-accent); }

  .article-header {
    margin-bottom: var(--space-10);
    padding-bottom: var(--space-8);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .article-category {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-accent);
    margin-bottom: var(--space-3);
  }

  .article-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    line-height: 1.2;
    margin: 0 0 var(--space-4);
  }

  .article-date {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .prose :global(p) {
    font-size: var(--text-base);
    line-height: 1.8;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
  }

  .prose :global(h3) {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: var(--space-8) 0 var(--space-4);
  }

  .prose :global(ul) {
    padding-left: var(--space-6);
    margin: 0 0 var(--space-5);
  }

  .prose :global(li) {
    font-size: var(--text-base);
    line-height: 1.7;
    color: var(--color-text);
    margin-bottom: var(--space-2);
  }

  /* Discussion */
  .discussion {
    margin-top: var(--space-16);
    padding-top: var(--space-10);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .discussion__header {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }

  .discussion__title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .discussion__count {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .discussion__login {
    margin-bottom: var(--space-6);
  }

  .discussion__empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    padding: var(--space-8) 0;
    text-align: center;
  }

  /* Comment form */
  .comment-form {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-8);
  }

  .comment-form__right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .comment-form__input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text);
    background: var(--color-bg);
    resize: vertical;
    transition: border-color var(--transition-fast);
    box-sizing: border-box;
  }

  .comment-form__input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .comment-form__actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  .reply-form {
    margin-top: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* Avatar */
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  /* Comments */
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .comment {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .comment--right {
    flex-direction: row-reverse;
  }

  .comment--right .comment__body {
    align-items: flex-end;
  }

  .comment--right .comment__meta {
    flex-direction: row-reverse;
  }

  .comment--right .comment__time {
    margin-left: 0;
    margin-right: auto;
  }

  .comment--right .comment__text {
    text-align: right;
  }

  .comment--right .comment__actions {
    flex-direction: row-reverse;
  }

  .comment--right .replies {
    border-left: none;
    border-right: 2px solid rgba(0,0,0,0.06);
    padding-left: 0;
    padding-right: var(--space-4);
  }

  .comment--reply {
    margin-top: var(--space-3);
  }

  .comment__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .comment__avatar--sm {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }

  .comment__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .comment__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-1);
    flex-wrap: wrap;
  }

  .comment__name {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
  }

  .comment__role {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .comment__time {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-left: auto;
  }

  .comment__text {
    font-size: var(--text-sm);
    line-height: 1.65;
    color: var(--color-text);
    margin: 0 0 var(--space-2);
    white-space: pre-wrap;
  }

  .comment__actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  .action-btn {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: var(--font-body);
    transition: color var(--transition-fast);
  }

  .action-btn:hover { color: var(--color-accent); }

  .action-btn--liked { color: var(--color-accent); }

  .action-btn--delete:hover { color: #ef4444; }

  .replies {
    margin-top: var(--space-4);
    padding-left: var(--space-4);
    border-left: 2px solid rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* Related */
  .related {
    margin-top: var(--space-16);
    padding-top: var(--space-10);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    max-width: 100%;
  }

  .related-title {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-6);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }

  @media (max-width: 700px) {
    .related-grid { grid-template-columns: 1fr; }
    .container { max-width: 100%; }
  }
</style>
