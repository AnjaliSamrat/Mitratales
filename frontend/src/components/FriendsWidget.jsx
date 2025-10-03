import React, { useEffect, useState } from 'react';
import { useToast } from './ToastProvider';
import { t } from './i18n';

export default function FriendsWidget() {
  const { notify } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(new Set());
  const [toUser, setToUser] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadPending = async () => {
    if (!token) { setLoading(false); return; }
    setError('');
    try {
      setLoading(true);
      const res = await fetch('/api/friends/pending', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({ pending: [] }));
      if (!res.ok) throw new Error(data.message || 'Failed to load pending requests');
      setPending(data.pending || []);
    } catch (e) {
      setError(t('errors.network') || 'Could not load friend requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const accept = async (fromUsername) => {
    if (!token) return notify('info', t('auth.login_required'));
    setAccepting(prev => new Set(prev).add(fromUsername));
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ from: fromUsername })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed');
      notify('success', 'Friend request accepted');
      setPending(pending.filter(p => p.username !== fromUsername));
    } catch (e) {
      notify('error', e.message || 'Failed to accept');
    } finally {
      setAccepting(prev => {
        const next = new Set(prev);
        next.delete(fromUsername);
        return next;
      });
    }
  };

  const sendRequest = async () => {
    const u = toUser.trim();
    if (!u) return;
    if (!token) return notify('info', t('auth.login_required'));
    try {
      setSending(true);
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: u })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to send request');
      notify('success', data.message || 'Request sent');
      setToUser('');
      setShowSuggestions(false);
    } catch (e) {
      notify('error', e.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => ({ users: [] }));
      setSuggestions(data.users || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleInputChange = (value) => {
    setToUser(value);
    searchUsers(value);
  };

  const selectSuggestion = (username) => {
    setToUser(username);
    setShowSuggestions(false);
  };

  return (
    <div className="fb-card">
      <div className="fb-section-title">Friends</div>

      {loading ? (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)'}}>
          <div style={{width: '16px', height: '16px', border: '2px solid #ccc', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
          Loading friend requests...
        </div>
      ) : error ? (
        <div style={{color: '#fca5a5', padding: '8px', background: 'rgba(252, 165, 165, 0.1)', borderRadius: '6px'}}>
          {error}
          <button onClick={loadPending} style={{marginLeft: '8px', background: 'transparent', border: '1px solid #fca5a5', color: '#fca5a5', borderRadius: '4px', padding: '2px 6px', fontSize: '12px'}}>
            Retry
          </button>
        </div>
      ) : pending.length === 0 ? (
        <div style={{color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px'}}>
          No pending friend requests
        </div>
      ) : (
        <div style={{display: 'grid', gap: '8px'}}>
          {pending.map(p => (
            <div key={p.username} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px',
              background: 'var(--surface-2)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <span className="fb-avatar-circle" style={{fontSize: '14px'}}>{p.username.charAt(0).toUpperCase()}</span>
                <div>
                  <div style={{fontWeight: '600', color: 'var(--text-strong)'}}>{p.username}</div>
                  <div style={{color: 'var(--text-muted)', fontSize: '12px'}}>{p.email}</div>
                </div>
              </div>
              <div style={{display: 'flex', gap: '6px'}}>
                <button
                  onClick={() => accept(p.username)}
                  disabled={accepting.has(p.username)}
                  style={{
                    background: 'var(--accent)',
                    color: '#0b1220',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: accepting.has(p.username) ? 'not-allowed' : 'pointer',
                    opacity: accepting.has(p.username) ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {accepting.has(p.username) ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop: '16px'}}>
        <div style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px'}}>
          Add Friends
        </div>
        <div style={{position: 'relative'}}>
          <div style={{display: 'flex', gap: '8px'}}>
            <input
              value={toUser}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search for friends..."
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                color: 'var(--text-strong)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={() => toUser && searchUsers(toUser)}
            />
            <button
              onClick={sendRequest}
              disabled={sending || !toUser.trim()}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (sending || !toUser.trim()) ? 'not-allowed' : 'pointer',
                opacity: (sending || !toUser.trim()) ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {sending ? 'Sending...' : 'Add'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {suggestions.slice(0, 5).map(u => (
                <button
                  key={u.username}
                  onClick={() => selectSuggestion(u.username)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-strong)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <span className="fb-avatar-circle" style={{fontSize: '12px'}}>{u.username.charAt(0).toUpperCase()}</span>
                  <div>
                    <div style={{fontWeight: '600'}}>{u.username}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
