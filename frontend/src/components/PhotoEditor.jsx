import React, { useState, useRef, useEffect } from 'react';
import './PhotoEditor.css';

const FILTERS = {
  none: { name: 'Original', filter: '' },
  vintage: { name: 'Vintage', filter: 'sepia(0.3) contrast(1.1) brightness(1.1) saturate(1.2)' },
  bw: { name: 'Black & White', filter: 'grayscale(1)' },
  sepia: { name: 'Sepia', filter: 'sepia(1)' },
  warm: { name: 'Warm', filter: 'sepia(0.2) saturate(1.3) brightness(1.1)' },
  cool: { name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
  dramatic: { name: 'Dramatic', filter: 'contrast(1.4) brightness(0.9) saturate(1.3)' },
  faded: { name: 'Faded', filter: 'brightness(1.1) saturate(0.8) contrast(0.9)' },
  vibrant: { name: 'Vibrant', filter: 'saturate(1.4) contrast(1.1) brightness(1.05)' },
  cinematic: { name: 'Cinematic', filter: 'contrast(1.3) brightness(0.95) saturate(1.1)' }
};

const ADJUSTMENTS = {
  brightness: { name: 'Brightness', min: -100, max: 100, default: 0, unit: '%' },
  contrast: { name: 'Contrast', min: -100, max: 100, default: 0, unit: '%' },
  saturation: { name: 'Saturation', min: -100, max: 100, default: 0, unit: '%' },
  hue: { name: 'Hue', min: -180, max: 180, default: 0, unit: 'deg' },
  blur: { name: 'Blur', min: 0, max: 20, default: 0, unit: 'px' },
  sharpen: { name: 'Sharpen', min: 0, max: 100, default: 0, unit: '%' }
};

export default function PhotoEditor({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
    sharpen: 0
  });
  const [originalImage, setOriginalImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('filters');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  const loadImage = async () => {
    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setLoading(false);
      applyEdits();
    };
    img.src = imageUrl;
  };

  const applyEdits = () => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match image aspect ratio but limit to reasonable size
    const maxWidth = 800;
    const maxHeight = 600;
    let { width, height } = originalImage;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply adjustments
    const filterValue = buildFilterString();
    ctx.filter = filterValue;

    // Draw image
    ctx.drawImage(originalImage, 0, 0, width, height);

    // Convert to data URL for preview
    const editedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setEditedImage(editedDataUrl);

    // Save to history
    saveToHistory(adjustments, selectedFilter);
  };

  const buildFilterString = () => {
    const filterParts = [];

    // Add selected filter
    if (selectedFilter !== 'none') {
      filterParts.push(FILTERS[selectedFilter].filter);
    }

    // Add adjustments
    if (adjustments.brightness !== 0) {
      filterParts.push(`brightness(${100 + adjustments.brightness}%)`);
    }
    if (adjustments.contrast !== 0) {
      filterParts.push(`contrast(${100 + adjustments.contrast}%)`);
    }
    if (adjustments.saturation !== 0) {
      filterParts.push(`saturate(${100 + adjustments.saturation}%)`);
    }
    if (adjustments.hue !== 0) {
      filterParts.push(`hue-rotate(${adjustments.hue}deg)`);
    }
    if (adjustments.blur > 0) {
      filterParts.push(`blur(${adjustments.blur}px)`);
    }

    return filterParts.join(' ');
  };

  const saveToHistory = (currentAdjustments, currentFilter) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      adjustments: { ...currentAdjustments },
      filter: currentFilter,
      timestamp: Date.now()
    });

    // Limit history to 20 entries
    if (newHistory.length > 20) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setAdjustments(prevState.adjustments);
      setSelectedFilter(prevState.filter);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setAdjustments(nextState.adjustments);
      setSelectedFilter(nextState.filter);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const updateAdjustment = (key, value) => {
    const newAdjustments = { ...adjustments, [key]: value };
    setAdjustments(newAdjustments);
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      blur: 0,
      sharpen: 0
    });
    setSelectedFilter('none');
  };

  const saveImage = () => {
    if (editedImage && onSave) {
      onSave(editedImage);
    }
  };

  if (loading) {
    return (
      <div className="photo-editor">
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>Loading photo editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-editor">
      <div className="editor-header">
        <h3>Photo Editor</h3>
        <div className="editor-actions">
          <button onClick={undo} disabled={historyIndex <= 0} className="btn-secondary">
            ↶ Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="btn-secondary">
            ↷ Redo
          </button>
          <button onClick={resetAdjustments} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-preview">
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="editor-controls">
          <div className="controls-tabs">
            <button
              className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              Filters
            </button>
            <button
              className={`tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
              onClick={() => setActiveTab('adjust')}
            >
              Adjust
            </button>
          </div>

          <div className="controls-content">
            {activeTab === 'filters' && (
              <div className="filters-panel">
                {Object.entries(FILTERS).map(([key, filter]) => (
                  <button
                    key={key}
                    className={`filter-btn ${selectedFilter === key ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(key)}
                  >
                    <div className="filter-preview" style={{ filter: filter.filter }}></div>
                    <span>{filter.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'adjust' && (
              <div className="adjustments-panel">
                {Object.entries(ADJUSTMENTS).map(([key, adj]) => (
                  <div key={key} className="adjustment-control">
                    <label>{adj.name}</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        min={adj.min}
                        max={adj.max}
                        value={adjustments[key]}
                        onChange={(e) => updateAdjustment(key, parseInt(e.target.value))}
                        className="adjustment-slider"
                      />
                      <span className="slider-value">
                        {adjustments[key]}{adj.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="editor-footer">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button onClick={saveImage} className="btn-primary">
          Apply Changes
        </button>
      </div>
    </div>
  );
}
