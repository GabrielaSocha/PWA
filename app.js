// ============== PWA INSTALL FUNCTIONALITY ==============
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const installNavbarBtn = document.getElementById('install-navbar-btn');

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js', { scope: './' })
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration);
                console.log('Service Worker scope:', registration.scope);
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });
} else {
    console.warn('Service Worker not supported in this browser');
}

// Check if app is already installed
function checkIfInstalled() {
    // Check if running as standalone (already installed)
    if (window.navigator.standalone === true) {
        console.log('✅ App is running in standalone mode (installed)');
        return true;
    }
    
    // Check display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ App is in standalone display mode');
        return true;
    }
    
    return false;
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt event fired - app is installable');
    
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Show install prompts if not already installed
    if (!checkIfInstalled()) {
        console.log('Showing install prompts');
        installBanner.style.display = 'block';
        installNavbarBtn.style.display = 'block';
    }
});

// Install button handler - banner
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.warn('Install prompt not available');
            alert('Install prompt is not available. Your browser may not support PWA installation.');
            return;
        }
        
        console.log('User clicked install button');
        
        try {
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user response
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`📱 User response to install prompt: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted installation');
            } else {
                console.log('❌ User declined installation');
            }
            
            // Clear the deferred prompt for later use
            deferredPrompt = null;
            
            // Hide install prompts
            installBanner.style.display = 'none';
            installNavbarBtn.style.display = 'none';
        } catch (error) {
            console.error('Error during installation:', error);
        }
    });
}

// Install button handler - navbar
if (installNavbarBtn) {
    installNavbarBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.warn('Install prompt not available');
            alert('Install prompt is not available. Your browser may not support PWA installation.');
            return;
        }
        
        console.log('User clicked navbar install button');
        
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`📱 User response to install prompt: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted installation');
            } else {
                console.log('❌ User declined installation');
            }
            
            deferredPrompt = null;
            installBanner.style.display = 'none';
            installNavbarBtn.style.display = 'none';
        } catch (error) {
            console.error('Error during installation:', error);
        }
    });
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('✅ GeoShare PWA was successfully installed');
    deferredPrompt = null;
    // Hide install prompts
    installBanner.style.display = 'none';
    installNavbarBtn.style.display = 'none';
});

// Listen for display mode changes
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
        console.log('✅ App is now in standalone mode');
        installBanner.style.display = 'none';
        installNavbarBtn.style.display = 'none';
    } else {
        console.log('ℹ️ App is running in browser mode');
    }
});

// Initial check on load
window.addEventListener('load', () => {
    if (checkIfInstalled()) {
        installBanner.style.display = 'none';
        installNavbarBtn.style.display = 'none';
    }
});

// ============== CAMERA FUNCTIONALITY ==============
let currentPhotoBlob = null;
let photoLocation = null; // Store location when photo is captured

const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const clearPhotoBtn = document.getElementById('clear-photo-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

async function startCamera() {
    try {
        // Request camera with more flexible constraints for mobile
        const constraints = {
            video: {
                facingMode: 'user',
                width: { min: 320, ideal: 640, max: 1280 },
                height: { min: 240, ideal: 480, max: 720 },
            },
            audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set video element properties
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            console.log('Video stream loaded, video dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.play().catch(err => console.error('Play error:', err));
        };
        
        // Wait for the video to play
        await new Promise((resolve) => {
            video.onplaying = () => {
                console.log('Video is playing');
                resolve();
            };
            video.onloadedmetadata = () => {
                video.play().catch(err => console.error('Play error:', err));
            };
        });
        
        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'block';
        capturePhotoBtn.style.display = 'block';
        
        console.log('Camera started successfully');
    } catch (error) {
        console.error('Camera access error:', error);
        
        let errorMessage = 'Unable to access camera. ';
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Camera permission denied. Please enable camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is in use by another application.';
        } else if (error.name === 'SecurityError') {
            errorMessage += 'Camera access requires HTTPS connection.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

function stopCamera() {
    try {
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped:', track.kind);
            });
        }
        video.srcObject = null;
        
        startCameraBtn.style.display = 'block';
        stopCameraBtn.style.display = 'none';
        capturePhotoBtn.style.display = 'none';
        
        console.log('Camera stopped');
    } catch (error) {
        console.error('Error stopping camera:', error);
    }
}

function capturePhoto() {
    try {
        // Check if video is playing
        if (video.paused || video.ended) {
            alert('Video is not ready. Please wait for the camera to load.');
            return Promise.resolve();
        }
        
        // Update canvas dimensions to match video
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        if (width === 0 || height === 0) {
            alert('Camera not ready. Please try again.');
            return Promise.resolve();
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        // Flip horizontally for selfie camera
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        
        // Reset transform
        ctx.translate(width, 0);
        ctx.scale(-1, 1);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Failed to capture photo. Please try again.');
                    resolve();
                    return;
                }
                
                currentPhotoBlob = blob;
                console.log('Photo captured successfully:', blob.size, 'bytes');
                
                // Get location when photo is captured
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude, accuracy } = position.coords;
                            photoLocation = { latitude, longitude, accuracy };
                            
                            // Display photo location
                            const photoLocationCoords = document.getElementById('photo-location-coords');
                            photoLocationCoords.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                            document.getElementById('photo-location-display').style.display = 'block';
                            
                            // Add marker on map for photo location
                            if (mapMarker) {
                                map.removeLayer(mapMarker);
                            }
                            mapMarker = L.marker([latitude, longitude])
                                .addTo(map)
                                .bindPopup(`<strong>Photo Location</strong><br>${latitude.toFixed(4)}, ${longitude.toFixed(4)}<br>Accuracy: ${Math.round(accuracy)}m`)
                                .openPopup();
                            
                            map.setView([latitude, longitude], 15);
                            console.log('Photo location captured:', { latitude, longitude, accuracy });
                        },
                        (error) => {
                            console.log('Could not get location for photo:', error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                }
                
                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('photo-preview').src = e.target.result;
                    document.getElementById('photo-preview-container').style.display = 'block';
                    updateShareUI();
                    console.log('Photo preview displayed');
                };
                reader.onerror = () => {
                    console.error('Error reading blob');
                };
                reader.readAsDataURL(blob);
                
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    } catch (error) {
        console.error('Error capturing photo:', error);
        alert('Error capturing photo: ' + error.message);
        return Promise.resolve();
    }
}

function clearPhoto() {
    currentPhotoBlob = null;
    photoLocation = null;
    document.getElementById('photo-preview-container').style.display = 'none';
    document.getElementById('photo-location-display').style.display = 'none';
    document.getElementById('photo-preview').src = '';
    updateShareUI();
}

startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);
capturePhotoBtn.addEventListener('click', capturePhoto);
clearPhotoBtn.addEventListener('click', clearPhoto);

// ============== AUDIO RECORDING FUNCTIONALITY ==============
// Removed - functionality moved to sharing features


// ============== SHARING FUNCTIONALITY ==============
const shareButton = document.getElementById('share-button');
const sharePhotoInfoDiv = document.getElementById('share-photo-info');
const shareLocationInfoDiv = document.getElementById('share-location-info');
const shareLocationText = document.getElementById('share-location-text');
const getLocationBtn = document.getElementById('get-location-btn');
const locationDisplay = document.getElementById('location-display');
const locationCoords = document.getElementById('location-coords');

let currentLocation = null;
let mapMarker = null;

// Update share UI based on available data
function updateShareUI() {
    const hasPhoto = currentPhotoBlob !== null;
    const hasPhotoLocation = photoLocation !== null;
    
    if (hasPhoto) {
        sharePhotoInfoDiv.style.display = 'block';
        shareButton.disabled = false;
    } else {
        sharePhotoInfoDiv.style.display = 'none';
        shareButton.disabled = true;
    }
    
    if (hasPhotoLocation) {
        shareLocationInfoDiv.style.display = 'block';
        shareLocationText.textContent = `${photoLocation.latitude.toFixed(4)}, ${photoLocation.longitude.toFixed(4)}`;
    }
}

// Share photo with its captured location
const share = async (title, text, blob = null) => {
  const data = {
    title: title,
    text: text,
  };

  // Add file if blob is provided
  if (blob) {
    data.files = [
      new File([blob], 'photo.png', {
        type: blob.type,
      }),
    ];
  }

  try {
    if (blob && !(navigator.canShare(data))) {
      throw new Error("Can't share data.", data);
    }
    await navigator.share(data);
  } catch (err) {
    console.error(err.name, err.message);
    alert('Sharing not supported on this device. Try copying the information instead.');
  }
};

// Share button - shares photo with location
shareButton.addEventListener('click', async () => {
    if (currentPhotoBlob) {
        let shareText = 'Check out this photo I captured!';
        
        if (photoLocation) {
            const { latitude, longitude } = photoLocation;
            shareText += `\n\nLocation: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\nGoogle Maps: https://maps.google.com/?q=${latitude},${longitude}`;
        }
        
        await share('My Photo', shareText, currentPhotoBlob);
    } else {
        alert('Please capture a photo first');
    }
});

// Get current location
function getLocation() {
    if (navigator.geolocation) {
        getLocationBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Getting...';
        getLocationBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                currentLocation = { latitude, longitude, accuracy };
                
                // Display location
                locationCoords.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                locationDisplay.style.display = 'block';
                
                // Update map
                map.setView([latitude, longitude], 15);
                
                // Clear old marker
                if (mapMarker) {
                    map.removeLayer(mapMarker);
                }
                
                // Add new marker
                mapMarker = L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup(`Your Location<br>Accuracy: ${Math.round(accuracy)}m`)
                    .openPopup();
                
                getLocationBtn.innerHTML = '<i class="bi bi-geo"></i> Get Location';
                getLocationBtn.disabled = false;
                console.log('Location retrieved:', { latitude, longitude, accuracy });
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMsg = 'Unable to get your location.';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'The request to get user location timed out.';
                        break;
                }
                
                alert(errorMsg);
                getLocationBtn.innerHTML = '<i class="bi bi-geo"></i> Get Location';
                getLocationBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

getLocationBtn.addEventListener('click', getLocation);

// ============== MAP FUNCTIONALITY ==============
// Initialize map
let map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
}).addTo(map);