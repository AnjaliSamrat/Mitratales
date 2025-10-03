import React, { useEffect, useState, useRef } from 'react';
import { t } from './i18n';

export default function NotificationsWidget() {
  const [summary, setSummary] = useState({ pendingFriendRequests: 0, newLikes: 0, newComments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const intervalRef = useRef(null);

  const load = async (showLoading = true) => {
    if (!token) { setLoading(false); return; }
    setError('');

    if (showLoading) {
      setLoading(true);
    }

    try {
      const since = (typeof window !== 'undefined' ? localStorage.getItem('notif_since') : null) || new Date(Date.now() - 3600_000).toISOString();
      const res = await fetch(`/api/notifications/summary?since=${encodeURIComponent(since)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({ pendingFriendRequests:0, newLikes:0, newComments:0 }));

      if (!res.ok) throw new Error('Failed to load notifications');

      const newSummary = {
        pendingFriendRequests: data.pendingFriendRequests || 0,
        newLikes: data.newLikes || 0,
        newComments: data.newComments || 0,
      };

      setSummary(newSummary);

      // Check if there are new notifications since last update
      const hasNew = newSummary.pendingFriendRequests > 0 || newSummary.newLikes > 0 || newSummary.newComments > 0;
      setHasNewNotifications(hasNew);

      setLastUpdate(new Date());
      try { localStorage.setItem('notif_since', new Date().toISOString()); } catch {}
    } catch (e) {
      setError(t('errors.network') || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Set up polling every 45 seconds (same as Header)
    intervalRef.current = setInterval(() => {
      load(false); // Don't show loading spinner for background updates
    }, 45000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fb-card">
      <div className="fb-section-title" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        Notifications
        {hasNewNotifications && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'pulse 2s infinite'
          }}></div>
        )}
      </div>

      {loading ? (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)'}}>
          <div style={{width: '16px', height: '16px', border: '2px solid #ccc', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
          Loading...
        </div>
      ) : error ? (
        <div style={{
          color: '#fca5a5',
          padding: '8px',
          background: 'rgba(252, 165, 165, 0.1)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button
            onClick={() => load()}
            style={{
              background: 'transparent',
              border: '1px solid #fca5a5',
              color: '#fca5a5',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{display: 'grid', gap: '12px'}}>
          <div style={{
            display: 'grid',
            gap: '8px',
            padding: '8px',
            background: 'var(--surface-2)',
            borderRadius: '8px'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '13px'}}>Friend requests</span>
              <span style={{
                fontWeight: '800',
                color: summary.pendingFriendRequests > 0 ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '16px'
              }}>
                {summary.pendingFriendRequests}
              </span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '13px'}}>New likes</span>
              <span style={{
                fontWeight: '800',
                color: summary.newLikes > 0 ? '#22c55e' : 'var(--text-muted)',
                fontSize: '16px'
              }}>
                {summary.newLikes}
              </span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontSize: '13px'}}>New comments</span>
              <span style={{
                fontWeight: '800',
                color: summary.newComments > 0 ? '#3b82f6' : 'var(--text-muted)',
                fontSize: '16px'
              }}>
                {summary.newComments}
              </span>
            </div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>
              Updated {formatTimeAgo(lastUpdate)}
            </div>
            <button
              onClick={() => load()}
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-strong)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--surface-2)'}
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spin {
            animation: none;
          }

          @keyframes pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
