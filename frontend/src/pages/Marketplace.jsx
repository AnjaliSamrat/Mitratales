import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuxPage.css';
import marketplaceIcon from '../assets/marketplace.svg';

const DEFAULT_PILLARS = [
  {
    title: 'Trusted local commerce',
    body: 'Verified sellers, secure payments, and ratings that highlight reliable community partners.',
    badges: ['Verified Sellers', 'Secure Escrow', 'Review Insights']
  },
  {
    title: 'Immersive listings',
    body: '360° imagery, smart descriptions, and AI-generated highlights make browsing effortless.',
    badges: ['360° Viewer', 'Smart Tags', 'AR Preview']
  },
  {
    title: 'Logistics handled',
    body: 'Pickups, delivery, and returns coordinated through trusted local partners in a click.',
    badges: ['Partner Couriers', 'Return Labels', 'Insurance']
  }
];

const DEFAULT_PIPELINE = [
  'Bundle deals and cross-listing between friends',
  'Price insights powered by local market data',
  'Repair history badges for electronics and vehicles',
  'Sustainability score for pre-loved items'
];

export default function Marketplace({
  pillars = DEFAULT_PILLARS,
  roadmap = DEFAULT_PIPELINE,
  onPilot
}) {
  const navigate = useNavigate();

  const handlePilot = () => {
    if (typeof onPilot === 'function') {
      onPilot('marketplace');
      return;
    }
    navigate('/signup?ref=marketplace');
  };

  return (
    <div className="aux-shell">
      <section className="aux-hero">
        <div className="aux-hero-icon" aria-hidden="true">
          <img src={marketplaceIcon} alt="" />
        </div>
        <div className="aux-hero-copy">
          <h1>Marketplace</h1>
          <p>Buy, sell, and trade with confidence—built around people you trust and the interests you share.</p>
        </div>
        <button
          type="button"
          className="aux-hero-action"
          onClick={handlePilot}
        >
          Become a pilot seller
        </button>
      </section>

      <section className="aux-grid">
        {pillars.map((card) => (
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
        <h2>What we are building next</h2>
        <div className="aux-timeline">
          {roadmap.map((item) => (
            <div key={item} className="aux-timeline-item">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
