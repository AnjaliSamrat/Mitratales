import React, { useState, useRef, useEffect } from 'react';
import './VideoEditor.css';

export default function VideoEditor({ videoUrl, onSave, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setTrimEnd(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      video.currentTime = trimStart;
    };

    const handleError = () => {
      setError('Failed to load video');
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Ensure playback stays within trim bounds
      if (video.currentTime < trimStart) {
        video.currentTime = trimStart;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = trimStart + (percent * (trimEnd - trimStart));

    // Constrain to trim bounds
    const clampedTime = Math.max(trimStart, Math.min(trimEnd, newTime));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleTrimStartChange = (e) => {
    const newStart = parseFloat(e.target.value);
    if (newStart < trimEnd && newStart >= 0) {
      setTrimStart(newStart);
      // Adjust current time if it's now outside the trim range
      if (currentTime < newStart) {
        videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      }
    }
  };

  const handleTrimEndChange = (e) => {
    const newEnd = parseFloat(e.target.value);
    if (newEnd > trimStart && newEnd <= duration) {
      setTrimEnd(newEnd);
      // Adjust current time if it's now outside the trim range
      if (currentTime > newEnd) {
        videoRef.current.currentTime = newEnd;
        setCurrentTime(newEnd);
      }
    }
  };

  const processVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size (you might want to adjust this based on quality settings)
      canvas.width = 640;
      canvas.height = 360;

      const trimmedDuration = trimEnd - trimStart;
      const fps = 30; // Target FPS for output
      const totalFrames = Math.floor(trimmedDuration * fps);

      // For demo purposes, we'll just capture a few frames
      // In a real implementation, you'd use a video processing library
      const frames = [];
      const captureInterval = trimmedDuration / Math.min(totalFrames, 10); // Capture up to 10 frames

      for (let i = 0; i < Math.min(totalFrames, 10); i++) {
        const frameTime = trimStart + (i * captureInterval);
        video.currentTime = frameTime;

        // Wait for seek to complete
        await new Promise(resolve => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
        });

        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob (you'd typically use a video encoding library here)
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });

        frames.push(blob);
      }

      // For demo purposes, return the first frame as a data URL
      // In a real implementation, you'd encode this as a proper video file
      const reader = new FileReader();
      reader.onload = () => {
        onSave(reader.result);
        setProcessing(false);
      };
      reader.readAsDataURL(frames[0]);

    } catch (error) {
      console.error('Video processing error:', error);
      setError('Failed to process video');
      setProcessing(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="video-editor">
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (error && !processing) {
    return (
      <div className="video-editor">
        <div className="editor-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-editor">
      <div className="editor-header">
        <h3>Video Editor</h3>
        <div className="editor-actions">
          <button onClick={onCancel} className="btn-secondary" disabled={processing}>
            Cancel
          </button>
          <button
            onClick={processVideo}
            className="btn-primary"
            disabled={processing || trimStart >= trimEnd}
          >
            {processing ? 'Processing...' : 'Save Trimmed Video'}
          </button>
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-preview">
          <video
            ref={videoRef}
            src={videoUrl}
            className="editor-video"
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay */}
          {!isPlaying && !loading && (
            <div className="play-overlay" onClick={togglePlay}>
              <div className="play-button">▶️</div>
            </div>
          )}

          {/* Trim Indicators */}
          <div className="trim-indicators">
            <div
              className="trim-start"
              style={{ left: `${(trimStart / duration) * 100}%` }}
            />
            <div
              className="trim-end"
              style={{ left: `${(trimEnd / duration) * 100}%` }}
            />
            <div
              className="trim-selection"
              style={{
                left: `${(trimStart / duration) * 100}%`,
                width: `${((trimEnd - trimStart) / duration) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="editor-controls">
          {/* Playback Controls */}
          <div className="playback-controls">
            <button onClick={togglePlay} className="control-btn">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Timeline/Seek Bar */}
          <div className="timeline-container">
            <div className="timeline" onClick={handleSeek}>
              <div className="timeline-progress">
                <div
                  className="timeline-fill"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="timeline-markers">
                <div
                  className="timeline-marker trim-start-marker"
                  style={{ left: `${(trimStart / duration) * 100}%` }}
                />
                <div
                  className="timeline-marker trim-end-marker"
                  style={{ left: `${(trimEnd / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Trim Controls */}
          <div className="trim-controls">
            <div className="trim-control">
              <label>Start Time</label>
              <div className="trim-input-group">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={trimStart}
                  onChange={handleTrimStartChange}
                  className="trim-slider"
                />
                <input
                  type="number"
                  min="0"
                  max={trimEnd}
                  step="0.1"
                  value={trimStart}
                  onChange={(e) => handleTrimStartChange(e)}
                  className="trim-input"
                />
              </div>
            </div>

            <div className="trim-control">
              <label>End Time</label>
              <div className="trim-input-group">
                <input
                  type="range"
                  min={trimStart}
                  max={duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={handleTrimEndChange}
                  className="trim-slider"
                />
                <input
                  type="number"
                  min={trimStart}
                  max={duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={(e) => handleTrimEndChange(e)}
                  className="trim-input"
                />
              </div>
            </div>

            <div className="trim-info">
              <span>Duration: {formatTime(trimEnd - trimStart)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
