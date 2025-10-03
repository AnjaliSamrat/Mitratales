// import React, { useEffect, useRef, useState } from "react";

// export default function Profile({ username }) {
//   const [profile, setProfile] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!username) {
//       setError("No username provided");
//       return;
//     }
//     fetch(`/api/profile/${username}`)
//       .then(res => {
//         if (!res.ok) throw new Error("User not found");
//         return res.json();
//       })
//       .then(data => setProfile(data))
//       .catch(err => setError(err.message));
//   }, [username, location.search]);

//   if (error) return <div>{error}</div>;
//   if (!profile) return <div>Loading...</div>;
//   return (
//     <div>
//       <h2>Profile</h2>
//       <p>Username: {profile.username}</p>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import PostCard from './components/PostCard';
import SkeletonPostCard from './components/SkeletonPostCard';
import PostForm from './PostForm';
import "./Profile.css";
import { t } from './components/i18n';

export default function Profile({ username }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('Timeline');
  const [friendStatus, setFriendStatus] = useState('none'); // self|none|pending_outgoing|pending_incoming|friends
  const [friendBusy, setFriendBusy] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [liked, setLiked] = useState({});
  const [comments, setComments] = useState({});
  const [commentsError, setCommentsError] = useState({}); // postId -> error text
  const [commentsLoading, setCommentsLoading] = useState({}); // postId -> bool
  const [commentSubmitting, setCommentSubmitting] = useState({}); // postId -> bool
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { notify } = useToast();
  const location = useLocation();
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [profileLoadMoreError, setProfileLoadMoreError] = useState('');
  const currentUser = (localStorage.getItem('username') || '').toLowerCase();
  const sentinelRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('u');
    const u = fromQuery || username || localStorage.getItem('username');
    if (!u) {
      setError("No username provided");
      return;
    }
    setProfileLoadError('');
    fetch(`/api/profile/${u}`)
      .then(res => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then(async (data) => {
        setProfile(data);
        // Friend status for the viewed profile
        try {
          const token = localStorage.getItem('token');
          if (token && (data.username || u)) {
            const resFR = await fetch(`/api/friends/status?user=${encodeURIComponent(data.username || u)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const s = await resFR.json().catch(() => ({ status: 'none' }));
            if (resFR.ok) setFriendStatus(s.status || 'none');
          }
        } catch {}
        // Load posts for this username via dedicated endpoint
        const token = localStorage.getItem('token');
        setLoadingPosts(true);
        const resPosts = await fetch(`/api/users/${data.username || u}/posts?page=1&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!resPosts.ok) throw new Error('Failed to load posts');
        const postsData = await resPosts.json();
        const list = postsData.posts || [];
        setProfilePosts(list);
        const seed = {};
        for (const p of list) seed[p.id] = !!p.likedByMe;
        setLiked(seed);
        setPage(postsData.page || 1);
        setHasMore(!!postsData.hasMore);
        setLoadingPosts(false);
      })
      .catch(err => { setError(err.message); setProfileLoadError(t('errors.could_not_load_timeline')); setLoadingPosts(false); });
  }, [username, location.search]);

  const reloadFirstPage = async () => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('u');
    const u = fromQuery || username || localStorage.getItem('username');
    if (!u) return;
    try {
      setProfileLoadError('');
      setLoadingPosts(true);
      const token = localStorage.getItem('token');
      const resPosts = await fetch(`/api/users/${u}/posts?page=1&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resPosts.ok) throw new Error('Failed to load posts');
      const postsData = await resPosts.json();
      const list = postsData.posts || [];
      setProfilePosts(list);
      const seed = {};
      for (const p of list) seed[p.id] = !!p.likedByMe;
      setLiked(seed);
      setPage(postsData.page || 1);
      setHasMore(!!postsData.hasMore);
    } catch (e) {
      setProfileLoadError(t('errors.could_not_load_timeline'));
    } finally {
      setLoadingPosts(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) { notify('info', t('auth.login_required')); navigate('/login'); return; }
    try {
      setFriendBusy(true);
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: profile.username })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFriendStatus(data.status || 'pending_outgoing');
        notify('success', data.message || 'Request sent');
      } else {
        notify('error', data.message || t('errors.network'));
      }
    } finally {
      setFriendBusy(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (!profile) return;
    const token = localStorage.getItem('token');
    if (!token) { notify('info', t('auth.login_required')); navigate('/login'); return; }
    try {
      setFriendBusy(true);
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ from: profile.username })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFriendStatus('friends');
        notify('success', data.message || 'Friend request accepted');
      } else {
        notify('error', data.message || t('errors.network'));
      }
    } finally {
      setFriendBusy(false);
    }
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
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, shares: data.shares } : p));
    } else {
      notify('error', data.message || t('errors.network'));
    }
  };

  // IntersectionObserver for profile timeline
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingPosts && !loadingMorePosts && hasMore) {
        loadMore();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingPosts, loadingMorePosts, page, profile]);

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
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, content: data.post?.content || content } : p));
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
      notify('error', data.detail || t('errors.session_expired'));
      navigate('/login');
      return;
    }
    if (res.ok) {
      setProfilePosts(prev => prev.filter(p => p.id !== postId));
      notify('success', t('success.post_deleted'));
    } else {
      notify('error', data.message || t('errors.failed_delete_post'));
    }
  };
 
  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newPost }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify('error', data.message || t('errors.failed_create_post'));
        return;
      }
      // Optimistically add to profile posts list
      const post = {
        id: data.post?.id,
        content: data.post?.content || newPost,
        created_at: data.post?.created_at,
        username: profile.username,
        email: '',
        likes: 0,
        comments: 0,
        likedByMe: false,
      };
      setProfilePosts(prev => [post, ...prev]);
      setNewPost('');
      notify('success', t('success.post_published'));
    } catch (e) {
      notify('error', t('errors.network'));
    }
  };

  const loadMore = async () => {
    if (!profile || !hasMore || loadingMorePosts) return;
    setProfileLoadMoreError('');
    setLoadingMorePosts(true);
    const nextPage = page + 1;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${profile.username}/posts?page=${nextPage}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to load more posts');
      const data = await res.json();
      const list = data.posts || [];
      setProfilePosts(prev => [...prev, ...list]);
      setHasMore(!!data.hasMore);
      setPage(data.page || nextPage);
      // seed liked for new posts
      setLiked(prev => {
        const copy = { ...prev };
        for (const p of list) copy[p.id] = !!p.likedByMe;
        return copy;
      });
    } catch (e) {
      setProfileLoadMoreError(t('errors.could_not_load_more'));
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const onChangeComment = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const requireAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('info', t('auth.login_required'));
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleLike = async (postId) => {
    const token = requireAuth();
    if (!token) return;
    const res = await fetch(`/api/posts/${postId}/like`, {
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
      setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
      setLiked(prev => ({ ...prev, [postId]: !!data.liked }));
    } else {
      notify('error', data.message || t('errors.failed_like'));
    }
  };

  const toggleComments = async (postId) => {
    const isOpen = !!openComments[postId];
    if (isOpen) {
      setOpenComments(prev => ({ ...prev, [postId]: false }));
      return;
    }
    setOpenComments(prev => ({ ...prev, [postId]: true }));
    setCommentsError(prev => ({ ...prev, [postId]: '' }));
    if (!comments[postId]) await fetchComments(postId);
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
        notify('error', data.detail || t('errors.session_expired'));
        navigate('/login');
        return;
      }
      if (res.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: [ ...(prev[postId] || []), data.comment ],
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setProfilePosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        notify('success', t('success.comment_added'));
      } else {
        notify('error', data.message || t('errors.failed_add_comment'));
      }
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      {/* Cover Photo */}
      <div className="cover-photo">
        {profile.coverPicUrl ? (
          <img src={profile.coverPicUrl} alt="Cover" />
        ) : (
          <div className="cover-placeholder"></div>
        )}
      </div>

      {/* Header with Avatar */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profilePicUrl ? (
            <img src={profile.profilePicUrl} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder"></div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.name || profile.username}</h1>
          <p>{profile.bio || "No bio available"}</p>
          <div className="profile-stats">
            <span>{profile.friendsCount || 0} Friends</span>
          </div>
          {/* Friend actions: hide when viewing self */}
          {friendStatus !== 'self' && (
            <div style={{marginTop:8, display:'flex', gap:8}}>
              {friendStatus === 'none' && (
                <button onClick={sendFriendRequest} disabled={friendBusy}>Add Friend</button>
              )}
              {friendStatus === 'pending_outgoing' && (
                <span style={{color:'#65676B'}}>Request sent</span>
              )}
              {friendStatus === 'pending_incoming' && (
                <button onClick={acceptFriendRequest} disabled={friendBusy}>Accept Request</button>
              )}
              {friendStatus === 'friends' && (
                <span style={{color:'#22c55e'}}>Friends ✓</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="profile-nav">
        <ul>
          <li
            className={activeTab === 'Timeline' ? 'active' : ''}
            onClick={() => setActiveTab('Timeline')}
          >{t('tabs.timeline')}</li>
          <li
            className={activeTab === 'About' ? 'active' : ''}
            onClick={() => setActiveTab('About')}
          >{t('tabs.about')}</li>
          <li
            className={activeTab === 'Friends' ? 'active' : ''}
            onClick={() => setActiveTab('Friends')}
          >{t('tabs.friends')}</li>
          <li
            className={activeTab === 'Photos' ? 'active' : ''}
            onClick={() => setActiveTab('Photos')}
          >{t('tabs.photos')}</li>
          <li>More</li>
        </ul>
      </div>

      {/* Timeline Create Post only on Timeline tab */}
      {activeTab === 'Timeline' && (
        <div className="profile-composer">
          <PostForm onPostCreated={reloadFirstPage} />
        </div>
      )}
      {/* Content Section */}
      <div className="profile-content">
        {activeTab === 'Timeline' && (
          <>
            <div className="post-section">
              {loadingPosts ? (
                <>
                  <SkeletonPostCard />
                  <SkeletonPostCard />
                  <SkeletonPostCard />
                </>
              ) : profilePosts && profilePosts.length > 0 ? (
                profilePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    liked={!!liked[post.id]}
                    onLike={handleLike}
                    onShare={handleShare}
                    onToggleComments={toggleComments}
                    commentsList={openComments[post.id] ? (comments[post.id] || []) : []}
                    commentInput={commentInputs[post.id] || ''}
                    onChangeComment={onChangeComment}
                    onSubmitComment={submitComment}
                    avatarUrl={profile.profilePicUrl}
                    authorName={profile.name || profile.username}
                    commentError={openComments[post.id] ? (commentsError[post.id] || '') : ''}
                    onRetryComments={() => fetchComments(post.id)}
                    commentLoading={openComments[post.id] ? !!commentsLoading[post.id] : false}
                    commentSubmitting={openComments[post.id] ? !!commentSubmitting[post.id] : false}
                    isOwner={(post.username || '').toLowerCase() === currentUser}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                  />
                ))
              ) : (
                <p>{t('profile.no_posts')}</p>
              )}
            </div>
            {/* Sentinel for infinite scroll on profile timeline */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {!!profileLoadError && !loadingPosts && (
              <div className="post-card" style={{borderColor:'#fecaca', background:'#fef2f2'}}>
                <div className="post-body" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{profileLoadError}</span>
                  <button onClick={reloadFirstPage}>Retry</button>
                </div>
              </div>
            )}
            {loadingMorePosts && (
              <>
                <SkeletonPostCard />
                <SkeletonPostCard />
              </>
            )}
            {!!profileLoadMoreError && (
              <div className="post-card" style={{borderColor:'#fecaca', background:'#fef2f2'}}>
                <div className="post-body" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{profileLoadMoreError}</span>
                  <button onClick={loadMore}>Retry</button>
                </div>
              </div>
            )}
            {hasMore && (
              <div style={{display:'flex', justifyContent:'center', marginTop: 8}}>
                <button onClick={loadMore} disabled={loadingMorePosts}>{loadingMorePosts ? 'Loading...' : 'Load more'}</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'About' && (
          <div className="profile-tab about-tab">
            <section className="profile-card">
              <header className="profile-card-head">
                <div>
                  <span className="profile-eyebrow">{t('about.title')}</span>
                  <h2>{profile.name || profile.username}</h2>
                </div>
                <div className="profile-pill">Member since {profile.created_at ? new Date(profile.created_at).getFullYear() : '—'}</div>
              </header>
              <div className="profile-card-body">
                <div className="profile-about-grid">
                  <div className="profile-about-item">
                    <span className="label">{t('about.name')}</span>
                    <span className="value">{profile.name || profile.username}</span>
                  </div>
                  <div className="profile-about-item">
                    <span className="label">{t('about.gender')}</span>
                    <span className="value">{profile.gender || '—'}</span>
                  </div>
                  <div className="profile-about-item">
                    <span className="label">{t('about.dob')}</span>
                    <span className="value">{profile.dob || '—'}</span>
                  </div>
                  <div className="profile-about-item span">
                    <span className="label">{t('about.bio')}</span>
                    <span className="value">{profile.bio || '—'}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Friends' && (
          <div className="profile-tab friends-tab">
            <section className="profile-card">
              <header className="profile-card-head">
                <div>
                  <span className="profile-eyebrow">{t('tabs.friends')}</span>
                  <h2>People you might know</h2>
                </div>
                <div className="profile-pill">{profile.friendsCount || friendShowcase.length} connections</div>
              </header>
              <div className="friends-grid">
                {friendShowcase.map(friend => (
                  <article className="friend-card" key={friend.id}>
                    <div className="friend-card-header">
                      <div className="friend-avatar">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} />
                        ) : (
                          <span className="friend-avatar-fallback">{(friend.name || 'U')[0].toUpperCase()}</span>
                        )}
                        <span className="friend-avatar-glow" aria-hidden="true" />
                      </div>
                      <div className="friend-meta">
                        <div className="friend-name">{friend.name}</div>
                        <div className="friend-sub">{friend.mutual} mutual connections</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="friend-action"
                      onClick={() => handleViewProfile(friend.username)}
                    >
                      View profile
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Photos' && (
          <div className="profile-tab photos-tab">
            <section className="profile-card">
              <header className="profile-card-head">
                <div>
                  <span className="profile-eyebrow">{t('tabs.photos')}</span>
                  <h2>Captured moments</h2>
                </div>
                <div className="profile-pill">{mediaGallery.length} memories</div>
              </header>
              <div className="photos-grid">
                {mediaGallery.map((media) => (
                  <figure className="photo-card" key={media.id || media.url}>
                    <div className="photo-frame">
                      <img src={media.url} alt={media.label || 'Profile media'} loading="lazy" />
                      <span className="photo-glow" aria-hidden="true" />
                    </div>
                    {media.label && <figcaption>{media.label}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

