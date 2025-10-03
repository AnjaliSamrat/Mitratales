import React from 'react';
import { createPortal } from 'react-dom';
import { t } from './i18n';
import VideoPlayer from './VideoPlayer';
import './PostCard.css';

export default function PostCard({
  post,
  liked,
  onLike,
  onShare,
  onToggleComments,
  commentsList = [],
  commentInput = '',
  onChangeComment,
  onSubmitComment,
  avatarUrl,
  authorName,
  commentError,
  onRetryComments,
  commentLoading,
  commentSubmitting,
  isOwner,
  onEdit,
  onDelete,
  onFocus,
  isFocused,
}) {
  const displayAuthor = authorName || post.username || post.email || 'User';
  const avatarLetter = (displayAuthor || 'U').charAt(0).toUpperCase();
  const createdAt = post.created_at ? new Date(post.created_at).toLocaleString() : 'just now';
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.content || '');
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [reactionOpen, setReactionOpen] = React.useState(false);
  const [myReaction, setMyReaction] = React.useState(''); // '', 'Like', 'Love', ...
  const [shareCount, setShareCount] = React.useState(post.shares || 0);
  const likeCount = post.likes ?? 0;
  const commentCount = post.comments ?? commentsList.length;
  const shareTotal = post.shares ?? shareCount;
  const reactionLabel = myReaction || t('post.like');

  const startEdit = () => { setDraft(post.content || ''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(post.content || ''); };
  const doSave = async () => {
    if (!onEdit) return;
    const text = (draft || '').trim();
    if (!text) return;
    try {
      setSaving(true);
      await onEdit(post.id, text);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className={`post-card${isFocused ? ' is-focused' : ''}${editing ? ' is-editing' : ''}`}
      onFocus={() => onFocus && onFocus()}
      tabIndex={isFocused ? 0 : -1}
      role="article"
      aria-labelledby={`post-${post.id}-author`}
      aria-describedby={`post-${post.id}-content`}
    >
      <header className="post-card-head">
        <div className="post-card-ident">
          {avatarUrl ? (
            <img className="post-card-avatar" src={avatarUrl} alt="Avatar" />
          ) : (
            <div className="post-card-avatar is-placeholder" aria-hidden="true">
              <span>{avatarLetter}</span>
              <span className="post-card-avatar-glow" />
            </div>
          )}
          <div className="post-card-author-block">
            <div id={`post-${post.id}-author`} className="post-card-author">{displayAuthor}</div>
            <div className="post-card-meta-line">
              <span className="post-card-time">{createdAt}</span>
              <span className="post-card-meta-dot" aria-hidden="true">•</span>
              <span className="post-card-visibility">Public</span>
            </div>
          </div>
        </div>
        {isOwner && !editing && (
          <OwnerMenu onEdit={startEdit} onDelete={() => setConfirmOpen(true)} />
        )}
      </header>

      <section className="post-card-body">
        {!editing ? (
          <>
            {post.content && (
              <p id={`post-${post.id}-content`} className="post-card-text">{post.content}</p>
            )}
            {post.media && post.media.length > 0 && (
              <div className={`post-card-media ${post.media.length > 1 ? 'is-grid' : 'is-single'}`}>
                {post.media.length === 1 ? (
                  post.media.map((media, idx) => (
                    <div key={idx} className="post-card-media-item">
                      {media.type === 'video' ? (
                        <VideoPlayer
                          src={media.url}
                          className="post-card-media-asset"
                          qualityOptions={['auto', '720p', '480p']}
                        />
                      ) : (
                        <img src={media.url} alt="Post media" className="post-card-media-asset" />
                      )}
                    </div>
                  ))
                ) : (
                  post.media.slice(0, 4).map((media, idx) => (
                    <div key={idx} className="post-card-media-item">
                      {media.type === 'video' ? (
                        <VideoPlayer
                          src={media.url}
                          className="post-card-media-asset"
                          controls={false}
                          autoPlay={false}
                        />
                      ) : (
                        <img src={media.url} alt={`Post media ${idx + 1}`} className="post-card-media-asset" />
                      )}
                      {post.media.length > 4 && idx === 3 && (
                        <div className="post-card-media-overlay">+{post.media.length - 4}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div className="post-card-edit">
            <textarea
              className="post-card-edit-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
            />
            <div className="post-card-edit-actions">
              <button type="button" className="post-card-edit-save" onClick={doSave} disabled={saving || !draft.trim()}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="post-card-edit-cancel" onClick={cancelEdit} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="post-card-stats" aria-label="Post engagement">
        <span className="post-card-stat">
          <span className="post-card-stat-icon">👍</span>
          {likeCount}
        </span>
        <span className="post-card-stat">
          <span className="post-card-stat-icon">💬</span>
          {commentCount}
        </span>
        <span className="post-card-stat">
          <span className="post-card-stat-icon">↗️</span>
          {shareTotal}
        </span>
      </section>

      <section className="post-card-actions" aria-label="Engage with post">
        <div className="post-card-actions-main">
          <div
            className="reactions-wrap"
            onMouseEnter={() => setReactionOpen(true)}
            onMouseLeave={() => setReactionOpen(false)}
          >
            <button
              type="button"
              className={`post-action ${liked ? 'is-active' : ''}`}
              onClick={() => onLike && onLike(post.id)}
              aria-label="Like post"
            >
              <svg className="post-action-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13 1 6.59 7.41C6.22 7.78 6 8.3 6 8.83V19c0 1.1.9 2 2 2h7c.82 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
              <span className="post-action-label">{reactionLabel}</span>
            </button>
            {reactionOpen && (
              <div className="reactions-bar">
                {[
                  {k:'Like', v:'👍'},
                  {k:'Love', v:'❤️'},
                  {k:'Care', v:'🤗'},
                  {k:'Haha', v:'😂'},
                  {k:'Wow', v:'😮'},
                  {k:'Sad', v:'😢'},
                  {k:'Angry', v:'😡'},
                ].map(r => (
                  <button
                    key={r.k}
                    type="button"
                    className="reaction-btn"
                    onClick={() => {
                      setMyReaction(`${r.v} ${r.k}`);
                      setReactionOpen(false);
                      onLike && onLike(post.id);
                    }}
                    aria-label={r.k}
                  >
                    {r.v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="post-action"
            onClick={() => onToggleComments && onToggleComments(post.id)}
            aria-label="Comment on post"
          >
            <svg className="post-action-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
            <span className="post-action-label">{t('post.comment')}</span>
            {commentLoading && (
              <span className="post-action-status">{t('post.loading')}</span>
            )}
          </button>

          <button
            type="button"
            className="post-action"
            onClick={() => { if (onShare) onShare(post.id); else setShareCount(c => c + 1); }}
            aria-label="Share post"
          >
            <svg className="post-action-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11A2.99 2.99 0 0 0 21 4a3 3 0 1 0-6 0c0 .24.04.47.09.7L8.07 8.81A2.99 2.99 0 0 0 6 8a3 3 0 1 0 2.91 3.3l7.12 4.17c-.03.17-.05.34-.05.53a3 3 0 1 0 3-3z"/></svg>
            <span className="post-action-label">Share</span>
          </button>
        </div>
      </section>

      {!!onToggleComments && commentsList && (
        <div className="comments">
          {commentLoading && (
            <div className="post-card-hint">{t('post.loading_comments')}</div>
          )}
          {commentError && (
            <div className="post-card-alert">
              <span>{commentError}</span>
              {onRetryComments && (
                <button type="button" onClick={onRetryComments}>{t('post.retry')}</button>
              )}
            </div>
          )}
          <div className="comments-list">
            {commentsList.map(c => (
              <div key={c.id} className="comment-item">
                <span className="comment-author">{c.username}</span>
                <span className="comment-text">{c.content}</span>
                <span className="comment-time">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
              </div>
            ))}
          </div>
          {onSubmitComment && (
            <div className="comment-input">
              <input
                type="text"
                placeholder={t('post.write_comment')}
                value={commentInput}
                onChange={(e) => onChangeComment && onChangeComment(post.id, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !commentSubmitting) onSubmitComment(post.id); }}
                disabled={!!commentSubmitting}
              />
              <button onClick={() => onSubmitComment(post.id)} disabled={!!commentSubmitting}>
                {commentSubmitting ? t('post.posting') : t('post.post')}
              </button>
            </div>
          )}
        </div>
      )}
      {confirmOpen && (
        <ConfirmDialog
          title={t('post.delete_title')}
          message={t('post.delete_message')}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => { if (onDelete) await onDelete(post.id); setConfirmOpen(false); }}
        />
      )}
    </article>
  );
}

function OwnerMenu({ onEdit, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0 });
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    const onCloseViewport = () => setOpen(false);
    window.addEventListener('scroll', onCloseViewport, true);
    window.addEventListener('resize', onCloseViewport, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onCloseViewport, true);
      window.removeEventListener('resize', onCloseViewport, true);
    };
  }, [open]);
  const onKeyDownButton = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    }
  };
  const onKeyDownMenu = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };
  const openMenu = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const top = Math.round(r.bottom + 6);
      const left = Math.round(Math.max(8, r.right - 160));
      setMenuPos({ top, left });
    }
    setOpen(true);
  };
  const menuItemProps = (handler) => ({
    role: 'menuitem',
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } }
  });
  return (
    <div ref={ref} className="owner-menu-wrap" style={{position:'relative'}}>
      <button ref={btnRef} className="owner-menu-btn" aria-label={t('post.actions')} aria-haspopup="menu" aria-expanded={open} onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={onKeyDownButton}>
        ⋯
      </button>
      {open && createPortal((
        <div className="owner-menu" role="menu" aria-label={t('post.actions')} onKeyDown={onKeyDownMenu} style={{position:'fixed', top: menuPos.top, left: menuPos.left}}>
          <div className="owner-menu-item" {...menuItemProps(() => { setOpen(false); onEdit(); })}>{t('post.edit')}</div>
          <div className="owner-menu-item danger" {...menuItemProps(() => { setOpen(false); onDelete(); })}>{t('post.delete')}</div>
        </div>
      ), document.body)}
    </div>
  );
}

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  const dlgRef = React.useRef(null);
  React.useEffect(() => {
    const prev = document.activeElement;
    dlgRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); };
  }, [onCancel]);
  return createPortal(
    (
      <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-label={title}>
        <div ref={dlgRef} className="confirm-dialog" tabIndex={-1}>
          <div className="confirm-title">{title}</div>
          <div className="confirm-message">{message}</div>
          <div className="confirm-actions">
            <button onClick={onCancel}>{t('common.cancel')}</button>
            <button className="danger" onClick={onConfirm}>{t('post.delete')}</button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}
