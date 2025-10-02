import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuxPage.css';
import watchIcon from '../assets/watch.svg';

const DEFAULT_FEATURES = [
  {
    title: 'Tailored for you',
    body: 'A cinematic feed that learns your taste, balancing creators you love with emerging voices.',
    badges: ['Personalized Queue', 'Watchlists', 'Creator Tokens']
  },
  {
    title: 'Premium viewing modes',
    body: 'Picture-in-picture, ambient lighting, and multi-view for live events keep you immersed.',
    badges: ['PiP', 'Ambient Lighting', 'Multi-view']
  },
  {
    title: 'Watch together',
    body: 'Host synced rooms with friends, dropping reactions and bookmarks without leaving the stream.',
    badges: ['Live Reactions', 'Shared Notes', 'Instant Invites']
  }
];

const DEFAULT_ROADMAP = [
  'Interactive chapters with creator annotations',
  'Live trivia overlays during premieres',
  'Download for offline viewing',
  'Creator storefronts embedded in streams'
];

export default function Watch({
  features = DEFAULT_FEATURES,
  roadmap = DEFAULT_ROADMAP,
  onJoinEarly
}) {
  const navigate = useNavigate();

  const handleJoin = () => {
    if (typeof onJoinEarly === 'function') {
      onJoinEarly('watch');
      return;
    }
    navigate('/signup?ref=watch');
  };

  return (
    <div className="aux-shell">
      <section className="aux-hero">
        <div className="aux-hero-icon" aria-hidden="true">
          <img src={watchIcon} alt="" />
        </div>
        <div className="aux-hero-copy">
          <h1>Watch</h1>
          <p>Discover shows, live events, and community screenings—all tuned to how and where you watch.</p>
        </div>
        <button
          type="button"
          className="aux-hero-action"
          onClick={handleJoin}
        >
          Join early screenings
        </button>
      </section>

      <section className="aux-grid">
        {features.map((card) => (
          <article key={card.title} className="aux-card">
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <div className="aux-badges">
              {card.badges.map((badge) => (
                <span key={badge} className="aux-badge">{badge}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="aux-card" style={{marginTop: 28}}>
        <h2>In production</h2>
        <div className="aux-timeline">
          {roadmap.map((item) => (
            <div key={item} className="aux-timeline-item">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
