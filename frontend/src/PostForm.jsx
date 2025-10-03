import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import PhotoEditor from './components/PhotoEditor';
import VideoPlayer from './components/VideoPlayer';
import VideoEditor from './components/VideoEditor';
import './PostForm.css';

function PostForm({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]); // {file, url, uploading, uploadProgress, uploadedUrl}
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const { notify } = useToast();

  const requireAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      notify('info', 'Please log in to create a post.');
      navigate('/login');
      return null;
    }
    return token;
  };

  const handleQuickAction = (actionKey) => {
    if (posting) return;
    if (actionKey === 'media') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    notify('info', 'This experience is coming soon.');
  };

  const uploadFile = async (file) => {
    const token = requireAuth();
    if (!token) return null;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return {
        url: data.url,
        type: data.media_type,
        filename: data.filename,
        size: file.size
      };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = requireAuth();
    if (!token) return;

    if (!content.trim() && media.length === 0) {
      notify('error', 'Please add some content or media to your post.');
      return;
    }

    setPosting(true);

    try {
      // Upload all media files first
      const uploadedMedia = [];

      for (const mediaItem of media) {
        if (mediaItem.file && !mediaItem.uploadedUrl) {
          try {
            const uploaded = await uploadFile(mediaItem.file);
            uploadedMedia.push(uploaded);
          } catch (error) {
            notify('error', `Failed to upload ${mediaItem.file.name}: ${error.message}`);
            return;
          }
        } else if (mediaItem.uploadedUrl) {
          uploadedMedia.push({
            url: mediaItem.uploadedUrl,
            type: mediaItem.type,
            filename: mediaItem.filename,
            size: mediaItem.size
          });
        }
      }

      // Create the post
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          media: uploadedMedia
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setContent("");
        // Clean up media previews
        media.forEach(m => {
          if (m.url && m.url.startsWith('blob:')) {
            URL.revokeObjectURL(m.url);
          }
        });
        setMedia([]);
        onPostCreated && onPostCreated();
        notify('success', 'Post published');
      } else {
        if (res.status === 401) {
          notify('error', data.detail || 'Your session expired. Please log in again.');
        } else {
          notify('error', data.message || 'Failed to create post');
        }
      }
    } catch (error) {
      notify('error', 'Network error. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const onPickMedia = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxFiles = 8 - media.length;
    const filesToAdd = files.slice(0, maxFiles);

    const newMedia = filesToAdd.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
      filename: f.name,
      size: f.size,
      uploading: false,
      uploadProgress: 0,
      uploadedUrl: null
    }));

    setMedia(prev => [...prev, ...newMedia]);

    // Reset input so selecting same file again triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMediaAt = (idx) => {
    setMedia(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed) {
        if (removed.url && removed.url.startsWith('blob:')) {
          URL.revokeObjectURL(removed.url);
        }
      }
      return copy;
    });
  };

  const handleEditImage = (mediaItem, index) => {
    if (mediaItem.type === 'video') {
      setEditingVideo(mediaItem.url);
      setEditingIndex(index);
    } else {
      setEditingImage(mediaItem.url);
      setEditingIndex(index);
    }
  };

  const handleEditSave = (editedImageDataUrl) => {
    if (editingIndex !== null) {
      setMedia(prev => prev.map((item, index) =>
        index === editingIndex
          ? { ...item, url: editedImageDataUrl, edited: true }
          : item
      ));
    }
    setEditingImage(null);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingImage(null);
    setEditingIndex(null);
    setEditingVideo(null);
  };

  const handleVideoEditSave = (editedVideoDataUrl) => {
    if (editingIndex !== null) {
      setMedia(prev => prev.map((item, index) =>
        index === editingIndex
          ? { ...item, url: editedVideoDataUrl, edited: true }
          : item
      ));
    }
    setEditingVideo(null);
    setEditingIndex(null);
  };

  const displayName = localStorage.getItem('username') || 'there';
  const charCount = content.trim().length;
  const quickActions = [
    { key: 'media', label: 'Photo / Video', emoji: '📷', primary: true },
    { key: 'mood', label: 'Feeling / Activity', emoji: '😊' },
    { key: 'live', label: 'Live Room', emoji: '🎥' }
  ];
  const disablePost = posting || (!content.trim() && media.length === 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="composer">
        <header className="composer-head">
          <div className="composer-author">
            <div className="composer-avatar" aria-hidden="true">
              <span>{(displayName || 'U')[0].toUpperCase()}</span>
              <span className="composer-avatar-glow" />
            </div>
            <div>
              <h3 className="composer-title">Share something great</h3>
              <p className="composer-subtitle">What's on your mind, {displayName}?</p>
            </div>
          </div>
          {posting && (
            <div className="composer-status" role="status" aria-live="polite">
              <span className="composer-status-dot" /> Posting…
            </div>
          )}
        </header>

        <section className="composer-body">
          <textarea
            className="composer-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start typing your story, ${displayName}…`}
            disabled={posting}
          />

          {!!media.length && (
            <div className="composer-media-grid">
              {media.map((m, idx) => (
                <div className="composer-media-item" key={`${m.url}-${idx}`}>
                  {m.type === 'video' ? (
                    <VideoPlayer
                      src={m.url}
                      controls={true}
                      className="composer-media-preview"
                      qualityOptions={['auto', '720p', '480p']}
                    />
                  ) : (
                    <img src={m.url} alt="Selected media preview" className="composer-media-preview" />
                  )}
                  <div className="composer-media-controls">
                    <button
                      type="button"
                      className="composer-media-edit"
                      onClick={() => handleEditImage(m, idx)}
                      title="Edit media"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="composer-media-remove"
                      onClick={() => removeMediaAt(idx)}
                      aria-label="Remove media"
                      disabled={posting}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="composer-dock" aria-label="Composer quick actions">
          {quickActions.map(action => (
            <button
              type="button"
              key={action.key}
              className={`composer-chip${action.primary ? ' is-primary' : ''}`}
              onClick={() => handleQuickAction(action.key)}
              disabled={posting || (action.key === 'media' && media.length >= 8)}
            >
              <span className="composer-chip-icon" aria-hidden="true">{action.emoji}</span>
              <span>{action.label}{action.key === 'media' && media.length > 0 ? ` (${media.length}/8)` : ''}</span>
            </button>
          ))}
        </section>

        <footer className="composer-footer">
          <div className="composer-meta">
            <span className="composer-char-count">{charCount} characters</span>
            <span className="composer-media-count">{media.length} attachments</span>
          </div>
          <button
            type="submit"
            className="composer-submit"
            disabled={disablePost}
          >
            {posting ? 'Publishing…' : 'Publish'}
          </button>
        </footer>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={onPickMedia}
        />
      </form>

      {/* Photo Editor Modal */}
      {editingImage && (
        <div className="photo-editor-modal">
          <div className="modal-backdrop" onClick={handleEditCancel} />
          <div className="modal-content">
            <PhotoEditor
              imageUrl={editingImage}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

      {/* Video Editor Modal */}
      {editingVideo && (
        <div className="video-editor-modal">
          <div className="modal-backdrop" onClick={handleEditCancel} />
          <div className="modal-content">
            <VideoEditor
              videoUrl={editingVideo}
              onSave={handleVideoEditSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default PostForm;

