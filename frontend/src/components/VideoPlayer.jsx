import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  controls = true,
  qualityOptions = ['auto', '1080p', '720p', '480p', '360p'],
  onTimeUpdate,
  onDurationChange,
  onEnded,
  className = ''
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackMenu, setShowPlaybackMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
      onDurationChange?.(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setError('Failed to load video');
      setLoading(false);
    };

    const handleLoadStart = () => {
      setLoading(true);
      setError('');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, onTimeUpdate, onDurationChange, onEnded]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    let timeout;
    if (showControls && !isFullscreen) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [showControls, isFullscreen]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const changeQuality = (quality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    // In a real implementation, you'd switch video sources here
    // For now, we'll just show the selection
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowPlaybackMenu(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  if (error) {
    return (
      <div className={`video-player error ${className}`}>
        <div className="video-error">
          <div className="error-icon">⚠️</div>
          <p>Failed to load video</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-player ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isFullscreen && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        className="video-element"
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="video-loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Custom Controls */}
      {controls && (showControls || isFullscreen) && (
        <div className="video-controls">
          {/* Progress Bar */}
          <div className="progress-container" onClick={handleSeek}>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="progress-handle"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="controls-main">
            <div className="controls-left">
              <button onClick={togglePlay} className="control-btn">
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? '🔇' : '🔊'}
              </button>

              <div className="volume-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="controls-right">
              {/* Playback Speed */}
              <div className="control-group">
                <button
                  onClick={() => setShowPlaybackMenu(!showPlaybackMenu)}
                  className="control-btn"
                >
                  {playbackRate}x
                </button>
                {showPlaybackMenu && (
                  <div className="dropdown-menu">
                    {playbackRates.map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`dropdown-item ${playbackRate === rate ? 'active' : ''}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Selection */}
              <div className="control-group">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="control-btn"
                >
                  {selectedQuality}
                </button>
                {showQualityMenu && (
                  <div className="dropdown-menu">
                    {qualityOptions.map(quality => (
                      <button
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        className={`dropdown-item ${selectedQuality === quality ? 'active' : ''}`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="control-btn">
                {isFullscreen ? '🪟' : '⛶'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click to play overlay */}
      {!isPlaying && !loading && (
        <div className="play-overlay" onClick={togglePlay}>
          <div className="play-button">▶️</div>
        </div>
      )}
    </div>
  );
}
