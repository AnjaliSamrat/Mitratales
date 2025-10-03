import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';
import VideoPlayer from './VideoPlayer';
import './MediaGallery.css';

const ITEMS_PER_PAGE = 20;

export default function MediaGallery() {
  const [media, setMedia] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'size'
  const [filterType, setFilterType] = useState('all'); // 'all', 'images', 'videos'
  const [smartCategories, setSmartCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkOperation, setBulkOperation] = useState('');

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      const mediaIds = Array.from(selectedItems);

      // Remove from media array
      setMedia(prev => prev.filter(item => !mediaIds.includes(item.id)));

      // Update album counts
      setAlbums(prev => prev.map(album => {
        const itemsInAlbum = mediaIds.filter(id => {
          const item = media.find(m => m.id === id);
          return item && item.album === album.id;
        }).length;
        return { ...album, count: Math.max(0, album.count - itemsInAlbum) };
      }));

      setSelectedItems(new Set());
      setShowBulkMenu(false);
      notify('success', `${mediaIds.length} items deleted`);
    } catch (e) {
      notify('error', 'Failed to delete items');
    }
  };

  const moveSelectedItems = async (targetAlbumId) => {
    if (selectedItems.size === 0) return;

    try {
      const mediaIds = Array.from(selectedItems);
      const currentAlbum = selectedAlbum;

      // Update media items
      setMedia(prev => prev.map(item =>
        mediaIds.includes(item.id)
          ? { ...item, album: targetAlbumId }
          : item
      ));

      // Update album counts
      setAlbums(prev => prev.map(album => {
        if (album.id === currentAlbum) {
          return { ...album, count: Math.max(0, album.count - mediaIds.length) };
        } else if (album.id === targetAlbumId) {
          return { ...album, count: album.count + mediaIds.length };
        }
        return album;
      }));

      setSelectedItems(new Set());
      setShowBulkMenu(false);
      setShowAddToAlbum(false);
      notify('success', `${mediaIds.length} items moved to album`);
    } catch (e) {
      notify('error', 'Failed to move items');
    }
  };

  const downloadSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    try {
      const mediaIds = Array.from(selectedItems);
      const selectedMedia = media.filter(item => mediaIds.includes(item.id));

      for (const item of selectedMedia) {
        // Create download link
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSelectedItems(new Set());
      setShowBulkMenu(false);
      notify('success', `${mediaIds.length} items downloaded`);
    } catch (e) {
      notify('error', 'Failed to download items');
    }
  };

  const renameSelectedItems = async (namePattern) => {
    if (selectedItems.size === 0 || !namePattern) return;

    try {
      const mediaIds = Array.from(selectedItems);
      const selectedMedia = media.filter(item => mediaIds.includes(item.id));

      setMedia(prev => prev.map(item => {
        if (mediaIds.includes(item.id)) {
          const index = selectedMedia.findIndex(m => m.id === item.id);
          const newName = namePattern.replace('%n', index + 1);
          return { ...item, name: newName };
        }
        return item;
      }));

      setSelectedItems(new Set());
      setShowBulkMenu(false);
      notify('success', `${mediaIds.length} items renamed`);
    } catch (e) {
      notify('error', 'Failed to rename items');
    }
  };

  const navigate = useNavigate();
  const { notify } = useToast();
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadMedia();
    loadAlbums();
  }, []);

  useEffect(() => {
    generateSmartCategories();
  }, [media]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAlbum, selectedCategory, sortBy, filterType, searchQuery]);

  const loadMedia = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll simulate media data
      // In a real implementation, this would fetch from an API
      const mockMedia = generateMockMedia();
      setMedia(mockMedia);
    } catch (e) {
      setError('Could not load media');
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async () => {
    if (!token) return;

    try {
      // For demo purposes, we'll simulate albums
      const mockAlbums = [
        { id: 'all', name: 'All Media', count: 45, cover: null },
        { id: 'favorites', name: 'Favorites', count: 12, cover: null },
        { id: 'vacation', name: 'Vacation 2024', count: 8, cover: null },
        { id: 'work', name: 'Work Projects', count: 15, cover: null },
      ];
      setAlbums(mockAlbums);
    } catch (e) {
      console.error('Failed to load albums:', e);
    }
  };

  const generateMockMedia = () => {
    const mediaItems = [];
    const types = ['image', 'video'];
    const names = ['Vacation Photo', 'Work Meeting', 'Family Portrait', 'Travel Video', 'Product Shot', 'Event Recording'];

    for (let i = 0; i < 45; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

      mediaItems.push({
        id: `media-${i}`,
        name: `${name} ${i + 1}`,
        type,
        url: type === 'video'
          ? `https://sample-videos.com/zip/10/mp4/720/SampleVideo_720x480_${i % 3 + 1}.mp4`
          : `https://picsum.photos/400/400?random=${i}`,
        thumbnail: type === 'video'
          ? `https://picsum.photos/400/400?random=${i + 100}`
          : null,
        size: Math.floor(Math.random() * 10 * 1024 * 1024), // 0-10MB
        date,
        dimensions: type === 'video' ? '720x480' : '400x400',
        album: Math.random() > 0.7 ? 'favorites' : 'all'
      });
    }

    return mediaItems;
  };

  const filteredMedia = media.filter(item => {
    // Album filter
    if (selectedAlbum !== 'all' && item.album !== selectedAlbum) return false;

    // Category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(item.date) < today) return false;
          break;
        case 'yesterday':
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (new Date(item.date) < yesterday || new Date(item.date) >= todayStart) return false;
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (new Date(item.date) < weekAgo) return false;
          break;
        case 'month':
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          if (new Date(item.date) < monthStart) return false;
          break;
        case 'images':
          if (item.type !== 'image') return false;
          break;
        case 'videos':
          if (item.type !== 'video') return false;
          break;
        case 'small':
          if (item.size >= 1024 * 1024) return false;
          break;
        case 'medium':
          if (item.size < 1024 * 1024 || item.size >= 10 * 1024 * 1024) return false;
          break;
        case 'large':
          if (item.size < 10 * 1024 * 1024) return false;
          break;
      }
    }

    // Type filter
    if (filterType !== 'all' && item.type !== filterType) return false;

    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const sortedMedia = [...filteredMedia].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.size - a.size;
      default:
        return 0;
    }
  });

  const paginatedMedia = sortedMedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(sortedMedia.length / ITEMS_PER_PAGE);

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === paginatedMedia.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedMedia.map(item => item.id)));
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;

    try {
      const newAlbum = {
        id: `album-${Date.now()}`,
        name: newAlbumName.trim(),
        count: 0,
        cover: null,
        created: new Date().toISOString(),
        description: ''
      };

      setAlbums(prev => [...prev, newAlbum]);
      setNewAlbumName('');
      setShowAlbumModal(false);
      notify('success', `Album "${newAlbum.name}" created`);
      setEditingAlbum(null);
    } catch (e) {
      notify('error', 'Failed to create album');
    }
  };

  const editAlbum = async (albumId, newName) => {
    if (!newName.trim()) return;

    try {
      setAlbums(prev => prev.map(album =>
        album.id === albumId
          ? { ...album, name: newName.trim() }
          : album
      ));
      setEditingAlbum(null);
      notify('success', 'Album updated');
    } catch (e) {
      notify('error', 'Failed to update album');
    }
  };

  const deleteAlbum = async (albumId) => {
    if (albumId === 'all') return;

    try {
      // Remove album from all media items
      setMedia(prev => prev.map(item =>
        item.album === albumId ? { ...item, album: 'all' } : item
      ));

      // Remove album
      setAlbums(prev => prev.filter(album => album.id !== albumId));

      if (selectedAlbum === albumId) {
        setSelectedAlbum('all');
      }

      setShowAlbumMenu(null);
      notify('success', 'Album deleted');
    } catch (e) {
      notify('error', 'Failed to delete album');
    }
  };

  const addToAlbum = async (albumId) => {
    if (selectedItems.size === 0) return;

    try {
      const mediaIds = Array.from(selectedItems);

      setMedia(prev => prev.map(item =>
        mediaIds.includes(item.id)
          ? { ...item, album: albumId }
          : item
      ));

      // Update album count
      setAlbums(prev => prev.map(album =>
        album.id === albumId
          ? { ...album, count: album.count + mediaIds.length }
          : album
      ));

      setSelectedItems(new Set());
      setShowAddToAlbum(false);
      notify('success', `${mediaIds.length} items added to album`);
    } catch (e) {
      notify('error', 'Failed to add items to album');
    }
  };

  const removeFromAlbum = async (albumId) => {
    if (selectedItems.size === 0) return;

    try {
      const mediaIds = Array.from(selectedItems);

      setMedia(prev => prev.map(item =>
        mediaIds.includes(item.id) && item.album === albumId
          ? { ...item, album: 'all' }
          : item
      ));

      // Update album count
      setAlbums(prev => prev.map(album =>
        album.id === albumId
          ? { ...album, count: Math.max(0, album.count - mediaIds.length) }
          : album
      ));

      setSelectedItems(new Set());
      notify('success', `${mediaIds.length} items removed from album`);
    } catch (e) {
      notify('error', 'Failed to remove items from album');
    }
  };

  const generateSmartCategories = () => {
    const categories = [
      { id: 'all', name: 'All Media', count: media.length, icon: '📷' }
    ];

    // Date-based categories
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    const todayMedia = media.filter(item => new Date(item.date) >= today).length;
    const yesterdayMedia = media.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= yesterday && itemDate < today;
    }).length;
    const thisWeekMedia = media.filter(item => new Date(item.date) >= thisWeek).length;
    const thisMonthMedia = media.filter(item => new Date(item.date) >= thisMonth).length;
    const thisYearMedia = media.filter(item => new Date(item.date) >= thisYear).length;

    if (todayMedia > 0) categories.push({ id: 'today', name: 'Today', count: todayMedia, icon: '📅' });
    if (yesterdayMedia > 0) categories.push({ id: 'yesterday', name: 'Yesterday', count: yesterdayMedia, icon: '⏳' });
    if (thisWeekMedia > 0) categories.push({ id: 'week', name: 'This Week', count: thisWeekMedia, icon: '📆' });
    if (thisMonthMedia > 0) categories.push({ id: 'month', name: 'This Month', count: thisMonthMedia, icon: '🗓️' });

    // Type-based categories
    const images = media.filter(item => item.type === 'image').length;
    const videos = media.filter(item => item.type === 'video').length;

    if (images > 0) categories.push({ id: 'images', name: 'Images', count: images, icon: '🖼️' });
    if (videos > 0) categories.push({ id: 'videos', name: 'Videos', count: videos, icon: '🎥' });

    // Size-based categories
    const smallFiles = media.filter(item => item.size < 1024 * 1024).length; // < 1MB
    const mediumFiles = media.filter(item => item.size >= 1024 * 1024 && item.size < 10 * 1024 * 1024).length; // 1-10MB
    const largeFiles = media.filter(item => item.size >= 10 * 1024 * 1024).length; // > 10MB

    if (smallFiles > 0) categories.push({ id: 'small', name: 'Small Files', count: smallFiles, icon: '📱' });
    if (mediumFiles > 0) categories.push({ id: 'medium', name: 'Medium Files', count: mediumFiles, icon: '💾' });
    if (largeFiles > 0) categories.push({ id: 'large', name: 'Large Files', count: largeFiles, icon: '🗄️' });

    setSmartCategories(categories);
  };

  const handleAlbumMenu = (albumId, action) => {
    switch (action) {
      case 'edit':
        const album = albums.find(a => a.id === albumId);
        setEditingAlbum({ id: albumId, name: album.name });
        break;
      case 'delete':
        deleteAlbum(albumId);
        break;
      case 'generate-cover':
        generateAlbumCover(albumId);
        break;
    }
    setShowAlbumMenu(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="media-gallery">
        <div className="gallery-loading">
          <div className="loading-spinner"></div>
          <p>Loading media gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="media-gallery">
      {/* Header */}
      <div className="gallery-header">
        <h2>Media Gallery</h2>
        <div className="gallery-actions">
          <button
            onClick={() => setShowAlbumModal(true)}
            className="btn-primary"
          >
            + New Album
          </button>
        </div>
      </div>

      {/* Albums Section */}
      <div className="albums-section">
        <h3>Albums</h3>
        <div className="albums-grid">
          {albums.map(album => (
            <div key={album.id} className="album-card">
              <div className="album-cover">
                {album.cover ? (
                  <img src={album.cover} alt={album.name} />
                ) : (
                  <div className="album-placeholder">
                    <span>📷</span>
                  </div>
                )}
                <div className="album-overlay">
                  <button
                    onClick={() => setShowAlbumMenu(showAlbumMenu === album.id ? null : album.id)}
                    className="album-menu-btn"
                  >
                    ⋯
                  </button>
                  {showAlbumMenu === album.id && (
                    <div className="album-menu">
                      <button onClick={() => handleAlbumMenu(album.id, 'edit')}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleAlbumMenu(album.id, 'generate-cover')}>
                        🖼️ Generate Cover
                      </button>
                      <button onClick={() => handleAlbumMenu(album.id, 'delete')}>
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="album-info">
                <h4>{album.name}</h4>
                <p>{album.count} items</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="gallery-controls">
        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Categories */}
        <div className="categories-section">
          <div className="categories-scroll">
            {smartCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="filter-controls">
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="filter-select"
          >
            {albums.map(album => (
              <option key={album.id} value={album.id}>
                {album.name} ({album.count})
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Media</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size</option>
          </select>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedItems.size} selected</span>
          <div className="bulk-buttons">
            <button
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              className="btn-secondary"
            >
              ⋯ More Actions
            </button>
            <button onClick={() => setShowAddToAlbum(true)} className="btn-secondary">
              📁 Move to Album
            </button>
            <button onClick={downloadSelectedItems} className="btn-secondary">
              ⬇️ Download
            </button>
            <button onClick={deleteSelectedItems} className="btn-danger">
              🗑️ Delete
            </button>
            <button onClick={() => setSelectedItems(new Set())} className="btn-secondary">
              ✕ Clear
            </button>
          </div>

          {/* Bulk Menu Dropdown */}
          {showBulkMenu && (
            <div className="bulk-menu">
              <button onClick={() => {
                const tag = prompt('Enter tag name:');
                if (tag) tagSelectedItems(tag);
              }}>
                🏷️ Add Tag
              </button>
              <button onClick={() => {
                const newName = prompt('Enter new name pattern (use %n for number):');
                if (newName) renameSelectedItems(newName);
              }}>
                ✏️ Rename
              </button>
              <button onClick={() => setShowBulkMenu(false)}>
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="gallery-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={loadMedia} className="btn-retry">Retry</button>
        </div>
      ) : sortedMedia.length === 0 ? (
        <div className="gallery-empty">
          <div className="empty-icon">📷</div>
          <h3>No media found</h3>
          <p>Upload some photos or videos to get started</p>
        </div>
      ) : (
        <>
          {/* Media Grid/List */}
          <div className={`media-content ${viewMode}`}>
            {paginatedMedia.map(item => (
              <div
                key={item.id}
                className={`media-item ${selectedItems.has(item.id) ? 'selected' : ''}`}
                onClick={() => viewMode === 'list' ? null : toggleItemSelection(item.id)}
              >
                {viewMode === 'grid' ? (
                  <div className="media-preview">
                    {item.type === 'video' ? (
                      <VideoPlayer
                        src={item.url}
                        poster={item.thumbnail}
                        controls={false}
                        className="media-video"
                      />
                    ) : (
                      <img src={item.url} alt={item.name} className="media-image" />
                    )}
                    <div className="media-overlay">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="media-checkbox"
                      />
                      <div className="media-info">
                        <span className="media-type">{item.type}</span>
                        <span className="media-size">{formatFileSize(item.size)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="media-list-item">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="media-checkbox"
                    />
                    <div className="media-list-preview">
                      {item.type === 'video' ? (
                        <video src={item.url} className="media-list-video" />
                      ) : (
                        <img src={item.url} alt={item.name} className="media-list-image" />
                      )}
                    </div>
                    <div className="media-list-info">
                      <div className="media-list-name">{item.name}</div>
                      <div className="media-list-details">
                        <span>{item.type.toUpperCase()}</span>
                        <span>{formatFileSize(item.size)}</span>
                        <span>{formatDate(item.date)}</span>
                        <span>{item.dimensions}</span>
                      </div>
                    </div>
                    <div className="media-list-actions">
                      <button className="btn-icon">📝</button>
                      <button className="btn-icon">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="gallery-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages} ({sortedMedia.length} items)
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Album Creation/Edit Modal */}
      {showAlbumModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowAlbumModal(false)} />
          <div className="modal-content">
            <h3>{editingAlbum ? 'Edit Album' : 'Create New Album'}</h3>
            <input
              type="text"
              placeholder="Album name"
              value={editingAlbum ? editingAlbum.name : newAlbumName}
              onChange={(e) => editingAlbum
                ? setEditingAlbum({...editingAlbum, name: e.target.value})
                : setNewAlbumName(e.target.value)
              }
              className="album-input"
            />
            <div className="modal-actions">
              <button onClick={() => {
                setShowAlbumModal(false);
                setEditingAlbum(null);
                setNewAlbumName('');
              }} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingAlbum) {
                    editAlbum(editingAlbum.id, editingAlbum.name);
                  } else {
                    createAlbum();
                  }
                }}
                className="btn-primary"
              >
                {editingAlbum ? 'Update Album' : 'Create Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Album Modal */}
      {showAddToAlbum && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowAddToAlbum(false)} />
          <div className="modal-content">
            <h3>Add to Album</h3>
            <div className="album-list">
              {albums.filter(album => album.id !== 'all').map(album => (
                <button
                  key={album.id}
                  onClick={() => addToAlbum(album.id)}
                  className="album-option"
                >
                  {album.cover ? (
                    <img src={album.cover} alt={album.name} className="album-option-cover" />
                  ) : (
                    <div className="album-option-placeholder">📷</div>
                  )}
                  <div className="album-option-info">
                    <span className="album-option-name">{album.name}</span>
                    <span className="album-option-count">{album.count} items</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddToAlbum(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
