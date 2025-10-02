import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuxPage.css';
import groupsIcon from '../assets/groups.svg';

const DEFAULT_HIGHLIGHTS = [
  {
    title: 'Communities that fit',
    body: 'Discover curated communities with smarter recommendations based on your interests and friends.',
    badges: ['Tailored Feed', 'Expert Moderators', 'Topic Tags']
  },
  {
    title: 'Powerful tools for admins',
    body: 'Schedule posts, manage membership, and automate rules with a single, intuitive dashboard.',
    badges: ['Post Scheduling', 'Automations', 'Insights']
  },
  {
    title: 'Events that resonate',
    body: 'Coordinate meetups, polls, and live sessions directly in your group without external tools.',
    badges: ['Polls', 'Live Sessions', 'Event RSVP']
  }
];

const DEFAULT_UPCOMING = [
  'Community health scorecards for admins',
  'AI-assisted moderation suggestions',
  'Cross-posting to partner communities',
  'Member spotlights and recognition badges'
];

export default function Groups({
  highlights = DEFAULT_HIGHLIGHTS,
  roadmap = DEFAULT_UPCOMING,
  onStartWaitlist
}) {
  const navigate = useNavigate();

  const handleWaitlist = () => {
    if (typeof onStartWaitlist === 'function') {
      onStartWaitlist('groups');
      return;
    }
    navigate('/signup?ref=groups');
  };

  return (
    <div className="aux-shell">
      <section className="aux-hero">
        <div className="aux-hero-icon" aria-hidden="true">
          <img src={groupsIcon} alt="" />
        </div>
        <div className="aux-hero-copy">
          <h1>Groups</h1>
          <p>Intimate spaces for shared passions, powered by tools that keep conversations welcoming and on-topic.</p>
        </div>
        <button
          type="button"
          className="aux-hero-action"
          onClick={handleWaitlist}
        >
          Start a waitlist
        </button>
      </section>

      <section className="aux-grid">
        {highlights.map((card) => (
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
        <h2>Next milestones</h2>
        <div className="aux-timeline">
          {roadmap.map((item) => (
            <div key={item} className="aux-timeline-item">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
