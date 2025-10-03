import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';

export default function StoriesBar() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingStory, setCreatingStory] = useState(false);

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredStory, setHoveredStory] = useState(null);
  const navigate = useNavigate();
  const { notify } = useToast();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const currentUser = localStorage.getItem('username');

  const loadStories = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/stories', { headers });
      const data = await res.json().catch(() => ({ stories: [] }));

      if (!res.ok) throw new Error('Failed to load stories');

      // Add "Create Story" as first item, then real stories
      const storiesWithCreate = [
        { id: 'create', name: 'You', isCreate: true },
        ...data.stories || []
      ];

      setStories(storiesWithCreate);
    } catch (e) {
      setError('Could not load stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleStoryLeave = () => {
    setHoveredStory(null);
  };

  const handleStoryClick = async (story) => {
    if (story.isCreate) {
      // Create story flow
      setCreatingStory(true);
      // For now, just show a toast - in a real app you'd open a modal
      setTimeout(() => {
        notify('info', 'Story creation coming soon! Upload images/videos to share.');
        setCreatingStory(false);
      }, 1000);
    } else {
      // View story
      navigate(`/story/${story.id}`);
    }
  };

  if (loading) {
    return (
      <div className="fb-stories-wrap">
        <div className="fb-stories" style={{justifyContent: 'center', alignItems: 'center', height: '200px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)'}}>
            <div style={{width: '20px', height: '20px', border: '2px solid #ccc', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            Loading stories...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fb-stories-wrap">
        <div className="fb-stories" style={{justifyContent: 'center', alignItems: 'center', height: '200px'}}>
          <div style={{color: '#fca5a5', textAlign: 'center'}}>
            {error}
            <button onClick={loadStories} style={{marginLeft: '8px', background: 'transparent', border: '1px solid #fca5a5', color: '#fca5a5', borderRadius: '4px', padding: '4px 8px', fontSize: '12px'}}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-stories-wrap">
      <div
        className="fb-stories"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {stories.map(s => (
          <button
            key={s.id}
            className={`fb-story ${s.isCreate ? 'add' : ''} ${hoveredStory === s.id ? 'hovered' : ''}`}
            onMouseEnter={() => handleStoryHover(s.id)}
            onMouseLeave={handleStoryLeave}
            onClick={() => handleStoryClick(s)}
            disabled={creatingStory && s.isCreate}
            style={{
              transform: hoveredStory === s.id && !s.isCreate
                ? 'perspective(1000px) rotateY(5deg) rotateX(2deg) translateZ(10px)'
                : 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: creatingStory && s.isCreate ? 0.7 : 1,
              cursor: creatingStory && s.isCreate ? 'not-allowed' : 'pointer'
            }}
          >
            <div className="fb-story-bg" />
            <div className="fb-story-avatar">{s.name.charAt(0).toUpperCase()}</div>
            <div className="fb-story-name">
              {s.isCreate ? 'Create story' : s.name}
            </div>
            {s.media_url && (
              <div
                className="fb-story-media"
                style={{
                  backgroundImage: `url(${s.media_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .fb-stories::-webkit-scrollbar {
          display: none;
        }

        .fb-story.hovered {
          z-index: 10;
        }

        .fb-story-media {
          position: absolute;
          inset: 0;
          opacity: 0.8;
          border-radius: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .fb-story {
            transition: none !important;
          }

          .fb-story:hover {
            transform: none !important;
          }

          @keyframes spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
