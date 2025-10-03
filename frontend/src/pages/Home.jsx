import React, { useEffect, useState } from 'react';
import PostForm from '../PostForm';
import Feed from '../Feed';
import StoriesBar from '../components/StoriesBar';
import './Home.css';
import { t } from '../components/i18n';
import FriendsWidget from '../components/FriendsWidget';
import NotificationsWidget from '../components/NotificationsWidget';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const sponsored = [
    {
      img: 'https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800&auto=format&fit=crop',
      title: 'Grow your business with Ads',
      sub: 'Reach more people with targeted campaigns',
      cta: 'Learn more',
    },
    {
      img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
      title: 'Build your next app faster',
      sub: 'Ship with modern tools and cloud services',
      cta: 'Start free',
    },
    {
      img: 'https://images.unsplash.com/photo-1553484771-047a44eee27d?q=80&w=800&auto=format&fit=crop',
      title: 'Upgrade your workspace',
      sub: 'Desks, chairs and more for productivity',
      cta: 'Shop now',
    },
  ];
  const [adIndex, setAdIndex] = useState(0);
  const [adPaused, setAdPaused] = useState(false);
  useEffect(() => {
    if (adPaused) return; // do not rotate while paused
    const id = setInterval(() => setAdIndex(i => (i + 1) % sponsored.length), 6000);
    return () => clearInterval(id);
  }, [adPaused]);

  const navGroups = [
    {
      title: 'Quick access',
      items: [
        {
          key: 'friends',
          label: t('left.friends'),
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
          )
        },
        {
          key: 'groups',
          label: t('left.groups'),
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" /></svg>
          )
        },
        {
          key: 'marketplace',
          label: t('left.marketplace'),
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 4h16v4H4V4zm0 6h16v10H4V10zm4 2v6h2v-6H8zm6 0v6h2v-6h-2z" /></svg>
          )
        },
        {
          key: 'watch',
          label: t('left.watch'),
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 16.5l6-4.5-6-4.5v9z M21 3H3c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h18c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2z" /></svg>
          )
        }
      ]
    },
    {
      title: 'Discover',
      items: [
        {
          key: 'memories',
          label: t('left.memories'),
          badge: 'New',
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9 0 3.87 2.35 7.17 5.67 8.5-.08-.72-.14-1.82.03-2.6.15-.65.97-4.16.97-4.16s-.25-.51-.25-1.26c0-1.18.69-2.06 1.55-2.06.73 0 1.08.55 1.08 1.21 0 .73-.47 1.82-.71 2.83-.2.85.43 1.55 1.26 1.55 1.51 0 2.66-1.59 2.66-3.88 0-2.03-1.46-3.46-3.54-3.46-2.41 0-3.83 1.81-3.83 3.68 0 .73.28 1.51.65 1.93.07.08.08.16.06.25-.07.27-.23.85-.26.97-.04.15-.14.2-.32.12-1.19-.55-1.93-2.27-1.93-3.64 0-2.97 2.16-5.7 6.25-5.7 3.28 0 5.83 2.34 5.83 5.47 0 3.26-2.05 5.88-4.9 5.88-.96 0-1.86-.5-2.17-1.09 0 0-.47 1.79-.59 2.23-.18.66-.54 1.32-.87 1.83.77.24 1.59.37 2.44.37 4.97 0 9-4.03 9-9s-4.03-9-9-9z" /></svg>
          )
        },
        {
          key: 'events',
          label: 'Events',
          badge: '3',
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z" /></svg>
          )
        },
        {
          key: 'saved',
          label: 'Saved',
          icon: (
            <svg className="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
          )
        }
      ]
    }
  ];

  const composerActions = [
    { key: 'media', label: 'Media', emoji: '📷' },
    { key: 'live', label: 'Live', emoji: '🔴' },
    { key: 'event', label: 'Event', emoji: '🗓️' },
  ];

  const liveNow = [
    { key: 'sonia', initials: 'SM', name: 'Sonia Mehta', status: 'Design sprint in 5m', online: true },
    { key: 'leon', initials: 'LK', name: 'Leon Kapoor', status: 'Open for a call', online: true },
    { key: 'aiko', initials: 'AT', name: 'Aiko Tan', status: 'Editing travel vlog', online: false },
  ];

  const onAdClick = () => {
    const ad = sponsored[adIndex];
    try {
      const arr = JSON.parse(localStorage.getItem('ad_clicks') || '[]');
      arr.push({ title: ad.title, ts: Date.now() });
      localStorage.setItem('ad_clicks', JSON.stringify(arr));
    } catch {}
    // Basic client-side tracking
    console.log('[Sponsored] CTA clicked:', ad.title);
  };
  return (
    <div className="home-stage">
      <div className="home-aurora" aria-hidden="true" />
      <div className="home-aurora home-aurora--two" aria-hidden="true" />
      <div className="fb-shell home-grid">
        <aside className="fb-col fb-left home-left">
          <ErrorBoundary title="Navigation" message="Navigation menu couldn't load properly.">
            <div className="fb-card home-card home-card--nav">
              <div className="home-card-head">
                <div>
                  <span className="home-eyebrow">Navigation</span>
                  <h2 className="home-card-title">Jump back in</h2>
                </div>
              </div>
              {navGroups.map(group => (
                <section className="home-nav-section" key={group.title}>
                  <header className="home-nav-header">{group.title}</header>
                  <div className="home-nav-items">
                    {group.items.map(item => (
                      <button type="button" className="home-nav-item" key={item.key}>
                        <span className="home-nav-icon">{item.icon}</span>
                        <span className="home-nav-label">{item.label}</span>
                        {item.badge && <span className="home-nav-badge">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ErrorBoundary>
        </aside>
        <main className="fb-col fb-center home-center">
          <ErrorBoundary title="Stories" message="Stories couldn't load properly.">
            <section className="fb-card home-card home-card--stories">
              <div className="home-card-head">
                <div>
                  <span className="home-eyebrow">Stories</span>
                  <h2 className="home-card-title">Highlights from your circle</h2>
                </div>
                <button type="button" className="home-pill" aria-label="Create story">
                  <span className="home-pill-dot">＋</span>
                  Create story
                </button>
              </div>
              <div className="fb-stories-wrap">
                <StoriesBar />
              </div>
            </section>
          </ErrorBoundary>
          <ErrorBoundary title="Create Post" message="Post creation is temporarily unavailable.">
            <section className="fb-card home-card home-card--composer">
              <div className="home-card-head home-card-head--composer">
                <div>
                  <span className="home-eyebrow">Share a moment</span>
                  <h2 className="home-card-title">What would you like to create?</h2>
                </div>
                <div className="home-quick-actions">
                  {composerActions.map(action => (
                    <span className="home-quick-action" key={action.key}>
                      <span className="home-quick-emoji" aria-hidden="true">{action.emoji}</span>
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
              <PostForm onPostCreated={() => { /* Feed component fetches independently; can wire refresh via state if needed */ }} />
            </section>
          </ErrorBoundary>
          <ErrorBoundary title="Feed" message="Feed couldn't load properly. Please refresh the page.">
            <section className="fb-card home-card home-card--feed">
              <div className="home-card-head home-card-head--feed">
                <div>
                  <span className="home-eyebrow">Latest</span>
                  <h2 className="home-card-title">Your personalized feed</h2>
                </div>
                <button type="button" className="home-pill is-ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Back to top
                </button>
              </div>
              <Feed />
            </section>
          </ErrorBoundary>
        </main>
        <aside className="fb-col fb-right home-right">
          <ErrorBoundary title="Notifications" message="Notifications couldn't load properly.">
            <div className="fb-card home-card">
              <NotificationsWidget />
            </div>
          </ErrorBoundary>
          <ErrorBoundary title="Friends" message="Friends widget couldn't load properly.">
            <div className="fb-card home-card">
              <FriendsWidget />
            </div>
          </ErrorBoundary>
          <section className="fb-card home-card home-card--live">
            <div className="home-card-head">
              <div>
                <span className="home-eyebrow">Live now</span>
                <h2 className="home-card-title">Catch up in real-time</h2>
              </div>
            </div>
            <div className="home-live-list">
              {liveNow.map(person => (
                <button type="button" className="home-live-item" key={person.key}>
                  <span className="home-live-avatar" data-online={person.online}>{person.initials}</span>
                  <span className="home-live-copy">
                    <span className="home-live-name">{person.name}</span>
                    <span className="home-live-status">{person.status}</span>
                  </span>
                  <span className="home-live-ping" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
          <section className="fb-card home-card home-card--sponsor">
            <div className="home-card-head">
              <div>
                <span className="home-eyebrow">{t('home.sponsored')}</span>
                <h2 className="home-card-title">Discover something new</h2>
              </div>
            </div>
            <div
              key={adIndex}
              className="home-sponsor-card"
              onMouseEnter={() => setAdPaused(true)}
              onMouseLeave={() => setAdPaused(false)}
            >
              <div className="home-sponsor-media">
                <img src={sponsored[adIndex].img} alt="Ad" loading="lazy" />
              </div>
              <div className="home-sponsor-meta">
                <div className="title">{sponsored[adIndex].title}</div>
                <div className="sub">{sponsored[adIndex].sub}</div>
                <button className="home-pill" type="button" onClick={onAdClick}>
                  {sponsored[adIndex].cta}
                </button>
              </div>
            </div>
          </section>
          <section className="fb-card home-card home-card--intel">
            <div className="home-card-head">
              <div>
                <span className="home-eyebrow">Celebrations</span>
                <h2 className="home-card-title">Today's birthdays</h2>
              </div>
            </div>
            <div className="home-birthday-list">
              <div className="home-birthday-item">🎂 John Doe</div>
              <div className="home-birthday-item">🎂 Priya Verma</div>
              <div className="home-birthday-item">🎂 Alex Johnson</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
