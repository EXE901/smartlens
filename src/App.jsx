import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import ParticlesBackground from './components/ParticlesBackground/ParticlesBackground';
import RecognitionDetector from './components/RecognitionDetector/RecognitionDetector';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import Profile from './components/Profile/profile';
import SearchModal from './components/SearchModal/SearchModal';
import Footer from './components/Footer/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: null,
      isLoggedIn: false,
      input: '',
      imageUrl: '',
      boxes: [],
      objects: [],
      loading: false,
      facesDetected: 0,
      objectsDetected: 0,
      searchModalOpen: false,
      searchResults: null,
      searchQuery: '',
      searchLoading: false,
      detectionMode: 'both',  // 'faces', 'objects', or 'both'
      searchMode: 'crop',     // NEW: 'crop' or 'full'
    };
  }

  componentDidMount() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.setState({ 
          user: user,
          isLoggedIn: true 
        });
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }

  onLogin = (userData) => {
    this.setState({ 
      isLoggedIn: true,
      user: userData
    });
    localStorage.setItem('user', JSON.stringify(userData));
  };

  onRegister = (userData) => {
    this.setState({ 
      isLoggedIn: true,
      user: userData
    });
    localStorage.setItem('user', JSON.stringify(userData));
  };

  onLogout = () => {
    this.setState({ 
      isLoggedIn: false,
      user: null,
      input: '',
      imageUrl: '',
      boxes: [],
      objects: [],
      facesDetected: 0,
      objectsDetected: 0,
      searchResults: null,
    });
    localStorage.removeItem('user');
  };

  onUpdateUser = (updatedUser) => {
    this.setState({ user: updatedUser });
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onModeChange = (mode) => {
    this.setState({ detectionMode: mode });
  };

  // NEW: Search mode toggle
  onSearchModeChange = (mode) => {
    this.setState({ searchMode: mode });
  };

  displayFaceBox = (boxes) => {
    this.setState({ boxes: boxes });
  };

  onButtonSubmit = async () => {
    const { detectionMode, input, user } = this.state;
    
    this.setState({ 
      loading: true, 
      imageUrl: input,
      boxes: [],
      objects: [],
      facesDetected: 0,
      objectsDetected: 0,
    });

    try {
      let faceData = { boxes: [] };
      let objectData = { objects: [] };

      if (detectionMode === 'both') {
        const response = await fetch(`${API_URL}/api/combined-detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: input }),
        });
        const data = await response.json();
        faceData = { boxes: data.boxes || [] };
        objectData = { objects: data.objects || [] };
        
      } else if (detectionMode === 'faces') {
        const response = await fetch(`${API_URL}/api/face-detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: input }),
        });
        faceData = await response.json();
        
      } else if (detectionMode === 'objects') {
        const response = await fetch(`${API_URL}/api/object-detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: input }),
        });
        objectData = await response.json();
      }

      const image = document.getElementById('inputimage');
      if (image) {
        const width = Number(image.width);
        const height = Number(image.height);

        const formattedFaces = (faceData.boxes || []).map(box => ({
          leftCol: box.left_col * width,
          topRow: box.top_row * height,
          rightCol: width - (box.right_col * width),
          bottomRow: height - (box.bottom_row * height)
        }));

        const formattedObjects = (objectData.objects || []).map(obj => ({
          name: obj.name,
          confidence: obj.confidence,
          left_col: obj.left_col,
          top_row: obj.top_row,
          right_col: obj.right_col,
          bottom_row: obj.bottom_row
        }));

        this.displayFaceBox(formattedFaces);
        this.setState({ 
          objects: formattedObjects,
          facesDetected: formattedFaces.length,
          objectsDetected: formattedObjects.length
        });

        if (user && user.id && faceData.boxes && faceData.boxes.length > 0) {
          const updateResponse = await fetch(`${API_URL}/image`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id })
          });

          const newEntries = await updateResponse.json();
          
          const updatedUser = {
            ...user,
            entries: newEntries
          };
          
          this.setState({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error during detection:', error);
    } finally {
      this.setState({ loading: false });
    }
  };

  // UPDATED: onBoxClick with searchMode support
  onBoxClick = async (type, index, objectName, box) => {
    const { searchMode, imageUrl } = this.state;
    
    console.log(`Clicked ${type} box #${index}`, objectName);
    console.log(`Search mode: ${searchMode}`);
    
    this.setState({ 
      searchModalOpen: true, 
      searchLoading: true,
      searchQuery: type === 'face' ? 'Similar Face' : objectName
    });

    let searchImageUrl = imageUrl;

    // Only crop if searchMode is 'crop'
    if (searchMode === 'crop') {
      try {
        const img = document.getElementById('inputimage');
        if (img && img.complete) {
          await new Promise((resolve) => {
            if (img.complete) resolve();
            else img.onload = resolve;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let cropX, cropY, cropWidth, cropHeight;
          
          if (type === 'face') {
            cropX = box.leftCol;
            cropY = box.topRow;
            cropWidth = img.width - box.leftCol - box.rightCol;
            cropHeight = img.height - box.topRow - box.bottomRow;
          } else {
            cropX = box.left_col * img.width;
            cropY = box.top_row * img.height;
            cropWidth = (box.right_col - box.left_col) * img.width;
            cropHeight = (box.bottom_row - box.top_row) * img.height;
          }

          cropX = Math.max(0, cropX);
          cropY = Math.max(0, cropY);
          cropWidth = Math.min(cropWidth, img.width - cropX);
          cropHeight = Math.min(cropHeight, img.height - cropY);

          if (cropWidth > 0 && cropHeight > 0) {
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            
            const formData = new FormData();
            formData.append('image', croppedBase64);

            const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
              method: 'POST',
              body: formData,
            });

            const uploadData = await uploadResponse.json();
            
            if (uploadData.success) {
              searchImageUrl = uploadData.data.url;
              console.log('✅ Using cropped image:', searchImageUrl);
            } else {
              console.log('⚠️ Crop upload failed, using full image');
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Cropping failed, using full image:', error);
      }
    } else {
      console.log('🖼️ Using full image (crop mode disabled)');
    }

    try {
      const response = await fetch(`${API_URL}/api/search-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: searchImageUrl,
          query: null
        })
      });

      const data = await response.json();
      
      if (!data.results || !data.results.visual_matches || data.results.visual_matches.length === 0) {
        console.log('⚠️ No results, retrying...');
        
        const retryResponse = await fetch(`${API_URL}/api/search-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imageUrl,
            query: null
          })
        });

        const retryData = await retryResponse.json();
        
        this.setState({ 
          searchResults: retryData.results,
          searchLoading: false
        });
      } else {
        this.setState({ 
          searchResults: data.results,
          searchLoading: false
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      this.setState({ 
        searchLoading: false,
        searchModalOpen: false 
      });
    }
  };

  closeSearchModal = () => {
    this.setState({ 
      searchModalOpen: false,
      searchResults: null,
      searchQuery: ''
    });
  };

  render() {
    const { 
      isLoggedIn, 
      user, 
      imageUrl, 
      boxes, 
      objects,
      loading, 
      facesDetected,
      searchModalOpen,
      searchResults,
      searchQuery,
      searchLoading,
      detectionMode,
      searchMode  // NEW
    } = this.state;

    return (
      <div className="App">
        <ParticlesBackground />
        
        <SearchModal 
          isOpen={searchModalOpen}
          onClose={this.closeSearchModal}
          results={searchResults}
          searchQuery={searchQuery}
          loading={searchLoading}
        />

        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/main" />
              ) : (
                <Login onLogin={this.onLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isLoggedIn ? (
                <Navigate to="/main" />
              ) : (
                <Register onRegister={this.onRegister} />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <Profile 
                  user={user} 
                  onLogout={this.onLogout}
                  onUpdateUser={this.onUpdateUser}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/main"
            element={
              isLoggedIn ? (
                <>
                  <Navigation onSignOut={this.onLogout} />
                  <Logo />
                  <Rank 
                    name={user?.name || 'User'} 
                    entries={user?.entries || 0}
                    facesDetected={facesDetected}
                  />
                  <ImageLinkForm
                    onInputChange={this.onInputChange}
                    onButtonSubmit={this.onButtonSubmit}
                    onModeChange={this.onModeChange}
                    detectionMode={detectionMode}
                    loading={loading}
                  />
                  <RecognitionDetector 
                    boxes={boxes} 
                    objects={objects}
                    imageUrl={imageUrl} 
                    loading={loading}
                    onBoxClick={this.onBoxClick}
                    searchMode={searchMode}
                    onSearchModeChange={this.onSearchModeChange}
                  />
                  <Footer />
                </>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to={isLoggedIn ? "/main" : "/login"} />} />
        </Routes>
      </div>
    );
  }
}

export default App;
