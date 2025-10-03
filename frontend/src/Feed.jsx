import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import PostCard from './components/PostCard';
import { t } from './components/i18n';
import SkeletonPostCard from './components/SkeletonPostCard';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({}); // postId -> array of comments
  const [commentInputs, setCommentInputs] = useState({}); // postId -> text
  const [openComments, setOpenComments] = useState({}); // postId -> bool
  const [commentsError, setCommentsError] = useState({}); // postId -> error text
  const [commentsLoading, setCommentsLoading] = useState({}); // postId -> bool
  const [commentSubmitting, setCommentSubmitting] = useState({}); // postId -> bool
  const [liked, setLiked] = useState({}); // postId -> bool (session-only)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadMoreError, setLoadMoreError] = useState('');
  const currentUser = localStorage.getItem('username') || '';
  const sentinelRef = useRef(null);

  // Keyboard navigation state
  const [focusedPostIndex, setFocusedPostIndex] = useState(-1);
  const feedRef = useRef(null);

  // Handlers MUST be inside component to access state setters
  const requireAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('info', t('auth.login_required'));
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleShare = async (postId) => {
    const token = requireAuth();
    if (!token) return;
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      notify('error', data.detail || t('errors.session_expired'));
      navigate('/login');
      return;
    }
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares: data.shares } : p));
    } else {
      notify('error', data.message || t('errors.network'));
    }
  };

  const handleEditPost = async (postId, content) => {
    const token = requireAuth();
    if (!token) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      notify('error', data.detail || t('errors.session_expired'));
      navigate('/login');
      return;
    }
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: data.post?.content || content } : p));
      notify('success', t('success.post_updated'));
    } else {
      notify('error', data.message || t('errors.failed_update_post'));
      throw new Error('update-failed');
    }
  };

  const handleDeletePost = async (postId) => {
    const token = requireAuth();
    if (!token) return;
    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      notify('error', data.detail || 'Session expired. Please log in again.');
      navigate('/login');
      return;
    }
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      notify('success', t('success.post_deleted'));
    } else {
      notify('error', data.message || t('errors.failed_delete_post'));
    }
  };

  const onChangeComment = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleLike = async (postId) => {
    const token = requireAuth();
    if (!token) return;

    // Get current state for rollback if needed
    const currentPosts = posts.find(p => p.id === postId);
    const currentLiked = !!liked[postId];
    const currentLikes = currentPosts?.likes ?? 0;

    // Optimistic update: immediately toggle UI
    const willBeLiked = !currentLiked;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: willBeLiked ? currentLikes + 1 : currentLikes - 1 } : p));
    setLiked(prev => ({ ...prev, [postId]: willBeLiked }));

    try {
      // Make API call in background
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        notify('error', data.detail || t('errors.session_expired'));
        navigate('/login');
        // Rollback optimistic update
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: currentLikes } : p));
        setLiked(prev => ({ ...prev, [postId]: currentLiked }));
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || t('errors.failed_like'));
      }

      // API success - update with real data
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
      setLiked(prev => ({ ...prev, [postId]: !!data.liked }));

    } catch (error) {
      // Rollback optimistic update on error
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: currentLikes } : p));
      setLiked(prev => ({ ...prev, [postId]: currentLiked }));
      notify('error', error.message || t('errors.failed_like'));
    }
  };

  const fetchComments = async (postId) => {
    try {
      setCommentsLoading(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      setCommentsError(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      setCommentsError(prev => ({ ...prev, [postId]: 'Could not load comments.' }));
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = async (postId) => {
    const isOpen = !!openComments[postId];
    if (isOpen) {
      setOpenComments(prev => ({ ...prev, [postId]: false }));
      return;
    }
    // open and fetch if not loaded
    setOpenComments(prev => ({ ...prev, [postId]: true }));
    setCommentsError(prev => ({ ...prev, [postId]: '' }));
    if (!comments[postId]) await fetchComments(postId);
  };

  const submitComment = async (postId) => {
    const token = requireAuth();
    if (!token) return;
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    try {
      setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        notify('error', data.detail || 'Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: [ ...(prev[postId] || []), data.comment ],
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // update comments count on the post
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
      } else {
        notify('error', data.message || 'Failed to add comment');
      }
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const fetchPosts = async (pageToLoad = 1) => {
    if (pageToLoad === 1) { setLoading(true); setLoadError(''); } else { setLoadMoreError(''); }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/posts?page=${pageToLoad}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      if (pageToLoad === 1) {
        setPosts(data.posts);
        const seed = {};
        for (const p of data.posts) seed[p.id] = !!p.likedByMe;
        setLiked(seed);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
        setLiked(prev => {
          const copy = { ...prev };
          for (const p of (data.posts || [])) copy[p.id] = !!p.likedByMe;
          return copy;
        });
      }
      setHasMore(!!data.hasMore);
      setPage(data.page || pageToLoad);
    } catch (e) {
      if (pageToLoad === 1) setLoadError(t('errors.could_not_load_feed')); else setLoadMoreError(t('errors.could_not_load_more'));
    } finally {
      if (pageToLoad === 1) setLoading(false);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (focusedPostIndex === -1 || posts.length === 0) return;

      const focusedPost = posts[focusedPostIndex];
      if (!focusedPost) return;

      switch (e.key.toLowerCase()) {
        case 'l':
          e.preventDefault();
          if (focusedPost && !e.ctrlKey && !e.metaKey && !e.altKey) {
            handleLike(focusedPost.id);
          }
          break;
        case 'c':
          e.preventDefault();
          if (focusedPost && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Focus the comment input for the focused post
            setOpenComments(prev => ({ ...prev, [focusedPost.id]: true }));
            // In a real implementation, you'd focus the comment input element
            // For now, we'll just open the comments section
          }
          break;
        case 's':
          e.preventDefault();
          if (focusedPost && !e.ctrlKey && !e.metaKey && !e.altKey) {
            handleShare(focusedPost.id);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (focusedPostIndex < posts.length - 1) {
            setFocusedPostIndex(prev => prev + 1);
          }
          break;
        case 'arrowup':
          e.preventDefault();
          if (focusedPostIndex > 0) {
            setFocusedPostIndex(prev => prev - 1);
          }
          break;
        case 'escape':
          e.preventDefault();
          setFocusedPostIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedPostIndex, posts]);

  // Focus management for PostCard components
  const handlePostFocus = (postIndex) => {
    setFocusedPostIndex(postIndex);
  };

  const handlePostBlur = () => {
    // Keep focus until Escape is pressed or focus moves outside feed
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
        loadMore();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(page + 1);
    setLoadingMore(false);
  };

  return (
    <div
      ref={feedRef}
      className="feed-wrapper"
      tabIndex={0}
      role="feed"
      aria-label="Posts feed"
      style={{
        outline: 'none',
        ...(focusedPostIndex >= 0 ? { border: '2px solid #1877f2', borderRadius: '8px', padding: '8px' } : {})
      }}
      onFocus={() => {
        if (posts.length > 0 && focusedPostIndex === -1) {
          setFocusedPostIndex(0);
        }
      }}
      onBlur={(e) => {
        // Only clear focus if focus is moving outside the feed
        if (!feedRef.current?.contains(e.relatedTarget)) {
          setFocusedPostIndex(-1);
        }
      }}
    >
      <h2 className="feed-title">{t('feed.title')}</h2>
      {focusedPostIndex >= 0 && (
        <div style={{
          background: '#e7f3ff',
          padding: '8px 12px',
          marginBottom: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#1877f2',
          border: '1px solid #1877f2'
        }}>
          <strong>Keyboard shortcuts:</strong> L=Like • C=Comment • S=Share • ↑↓=Navigate • Esc=Exit
        </div>
      )}
      {loading ? (
        <>
          <SkeletonPostCard />
          <SkeletonPostCard />
          <SkeletonPostCard />
        </>
      ) : posts.length === 0 ? (
        <div className="post-card"><div className="post-body">{t('feed.empty')}</div></div>
      ) : (
        posts.map((post, index) => (
          <div
            key={post.id}
            style={{
              ...(focusedPostIndex === index ? {
                outline: '2px solid #1877f2',
                outlineOffset: '2px',
                borderRadius: '8px',
                background: 'rgba(24, 119, 242, 0.05)'
              } : {})
            }}
          >
            <PostCard
              post={post}
              liked={!!liked[post.id]}
              onLike={handleLike}
              onShare={handleShare}
              onToggleComments={toggleComments}
              commentsList={openComments[post.id] ? (comments[post.id] || []) : []}
              commentInput={commentInputs[post.id] || ''}
              onChangeComment={onChangeComment}
              onSubmitComment={submitComment}
              commentError={openComments[post.id] ? (commentsError[post.id] || '') : ''}
              onRetryComments={() => fetchComments(post.id)}
              commentLoading={openComments[post.id] ? !!commentsLoading[post.id] : false}
              commentSubmitting={openComments[post.id] ? !!commentSubmitting[post.id] : false}
              isOwner={(post.username || '').toLowerCase() === currentUser.toLowerCase()}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onFocus={() => handlePostFocus(index)}
              isFocused={focusedPostIndex === index}
            />
          </div>
        ))
      )}
      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!!loadError && !loading && (
        <div className="post-card" style={{borderColor:'#fecaca', background:'#fef2f2'}}>
          <div className="post-body" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>{loadError || t('errors.could_not_load_feed')}</span>
            <button onClick={() => fetchPosts(1)}>{t('post.retry')}</button>
          </div>
        </div>
      )}
      {loadingMore && (
        <>
          <SkeletonPostCard />
          <SkeletonPostCard />
        </>
      )}
      {!!loadMoreError && (
        <div className="post-card" style={{borderColor:'#fecaca', background:'#fef2f2'}}>
          <div className="post-body" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>{loadMoreError || t('errors.could_not_load_more')}</span>
            <button onClick={loadMore}>{t('post.retry')}</button>
          </div>
        </div>
      )}
      {hasMore && (
        <div style={{display:'flex', justifyContent:'center'}}>
          <button onClick={loadMore} disabled={loadingMore}>{loadingMore ? t('post.loading') : t('common.load_more')}</button>
        </div>
      )}
    </div>
  );
}

export default Feed;

