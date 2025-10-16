import React, { useState, useRef } from 'react';
import './ImageLinkForm.css';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const ImageLinkForm = ({ onInputChange, onButtonSubmit, onImageLoadSuccess, onImageLoadError, loading, detectionMode, onModeChange }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const errorTimer = useRef(null);

  const isValid = value.trim().length > 0;

  const clearError = () => {
    setError(null);
    if (errorTimer.current) {
      clearTimeout(errorTimer.current);
      errorTimer.current = null;
    }
  };

  const showError = (msg) => {
    clearError();
    setError(msg);
    errorTimer.current = setTimeout(() => setError(null), 3000);
  };

  const [success, setSuccess] = useState(null);
  const clearSuccess = () => setSuccess(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (typeof onInputChange === 'function') onInputChange(e);
    if (error) clearError();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];

        const formData = new FormData();
        formData.append('image', base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          const imageUrl = data.data.url;
          setValue(imageUrl);
          
          if (typeof onInputChange === 'function') {
            onInputChange({ target: { value: imageUrl } });
          }
          
          setTimeout(() => {
            if (typeof onImageLoadSuccess === 'function') onImageLoadSuccess(imageUrl);
            if (typeof onButtonSubmit === 'function') onButtonSubmit();
          }, 100);

          setSuccess('Image uploaded!');
          setTimeout(() => clearSuccess(), 2500);
        } else {
          showError('Upload failed. Please try again.');
        }

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      showError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) {
      showError('Please enter an image URL or upload an image');
      return;
    }

    const img = new Image();
    let called = false;
    const onSuccess = () => {
      if (called) return; 
      called = true;
      clearError();
      setSuccess('Image loaded');
      setTimeout(() => clearSuccess(), 2500);
      if (typeof onImageLoadSuccess === 'function') onImageLoadSuccess(value);
      if (typeof onButtonSubmit === 'function') onButtonSubmit();
    };
    const onFail = () => {
      if (called) return; 
      called = true;
      showError('Could not load image. Please provide a direct image link.');
      if (typeof onImageLoadError === 'function') onImageLoadError(value);
    };

    img.onload = onSuccess;
    img.onerror = onFail;
    const timeout = setTimeout(() => onFail(), 7000);
    img.src = value;
    const cleanup = () => clearTimeout(timeout);
    img.onload = () => { cleanup(); onSuccess(); };
    img.onerror = () => { cleanup(); onFail(); };
  };

  return (
    <div className="tc pa5 br3 center">
      <p className="f2 pa2 white">
        {detectionMode === 'faces' && 'This Model will detect faces in your pictures.'}
        {detectionMode === 'objects' && 'This Model will detect objects in your pictures.'}
        {detectionMode === 'both' && 'This Model will detect faces and objects in your pictures.'}
        {' '}Give it a try.
      </p>

      {/* NEW: Mode Toggle Buttons */}
      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-btn ${detectionMode === 'faces' ? 'active' : ''}`}
          onClick={() => onModeChange && onModeChange('faces')}
          disabled={loading || uploading}
        >
          <span className="mode-icon">👤</span>
          Faces Only
        </button>
        <button
          type="button"
          className={`mode-btn ${detectionMode === 'objects' ? 'active' : ''}`}
          onClick={() => onModeChange && onModeChange('objects')}
          disabled={loading || uploading}
        >
          <span className="mode-icon">🎯</span>
          Objects Only
        </button>
        <button
          type="button"
          className={`mode-btn ${detectionMode === 'both' ? 'active' : ''}`}
          onClick={() => onModeChange && onModeChange('both')}
          disabled={loading || uploading}
        >
          <span className="mode-icon">🔍</span>
          Both
        </button>
      </div>

      <form className="form center pa4 br3 shadow-4" onSubmit={handleSubmit}>
        <input
          aria-label="image-url"
          className="f4 pa2 input-link"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Paste image URL here"
          disabled={loading || uploading}
        />
        
        <div className="upload-divider">
          <span>OR</span>
        </div>
        
        <label htmlFor="file-upload" className={`upload-button ${uploading ? 'uploading' : ''}`}>
          {uploading ? (
            <>
              <span className="btn-spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-1l-2-3H8L6 7H5a2 2 0 00-2 2z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              Choose images
            </>
          )}
        </label>
        <input 
          id="file-upload"
          type="file" 
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={loading || uploading}
        />
        
        <p className="upload-hint">
          Click to choose, copy and paste, or drag and drop files anywhere
        </p>
        
        <button
          type="submit"
          className={`w-30 grow f4 link ph3 pv2 dib white detect-button ${isValid && !loading && !uploading ? 'active' : 'disabled'}`}
          disabled={!isValid || loading || uploading}
          aria-busy={loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="btn-spinner" aria-hidden="true"></span>
              Detecting...
            </span>
          ) : (
            'Detect'
          )}
        </button>
      </form>

      {error && (
        <div className="error-popup" role="alert">
          <div className="error-x">✖</div>
          <div className="error-text">{error}</div>
        </div>
      )}

      {success && (
        <div className="success-popup" role="status">
          <div className="success-check">✓</div>
          <div className="success-text">{success}</div>
        </div>
      )}
    </div>
  );
}

export default ImageLinkForm;
