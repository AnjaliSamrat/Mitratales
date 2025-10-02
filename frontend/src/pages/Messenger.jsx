import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuxPage.css';
import messengerIcon from '../assets/messenger.svg';

const DEFAULT_MESSAGES = [
  {
    title: 'Seamless conversations',
    body: 'All your chats in one place with rich media, reactions, and quick replies.',
    badges: ['Encrypted', 'Typing Indicators', 'Media Sharing']
  },
  {
    title: 'Smart inbox',
    body: 'Focus on the people that matter with smart filters, pinned threads, and reminders.',
    badges: ['Pinned Threads', 'Custom Labels', 'Priority Inbox']
  },
  {
    title: 'Crystal clear calls',
    body: 'Instant voice and video with studio lighting, live captions, and screen sharing.',
    badges: ['HD Video', 'Live Captions', 'Screen Share']
  }
];

const DEFAULT_ROADMAP = [
  'Unified presence across web and mobile apps',
  'Auto-translate incoming messages in real time',
  'Scheduled messages and recurring reminders',
  'Collaborative whiteboard for group calls'
];

export default function Messenger({
  cards = DEFAULT_MESSAGES,
  roadmap = DEFAULT_ROADMAP,
  onNotify
}) {
  const navigate = useNavigate();

  const handleNotify = () => {
    if (typeof onNotify === 'function') {
      onNotify('messenger');
      return;
    }
    navigate('/signup?ref=messenger');
  };

  return (
    <div className="aux-shell">
      <section className="aux-hero">
        <div className="aux-hero-icon" aria-hidden="true">
          <img src={messengerIcon} alt="" />
        </div>
        <div className="aux-hero-copy">
          <h1>Messenger</h1>
          <p>Conversations, calls, and collaborations—designed for a calmer, more intentional inbox.</p>
        </div>
        <button
          type="button"
          className="aux-hero-action"
          onClick={handleNotify}
        >
          Notify me when live
        </button>
      </section>

      <section className="aux-grid">
        {cards.map((card) => (
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
        <h2>Coming up next</h2>
        <div className="aux-timeline">
          {roadmap.map((item) => (
            <div key={item} className="aux-timeline-item">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
