// ============== CAMERA FUNCTIONALITY ==============
let currentPhotoBlob = null;

const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const capturePhotoBtn = document.getElementById('capture-photo-btn');
const clearPhotoBtn = document.getElementById('clear-photo-btn');
const shareButton = document.getElementById('share-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        video.srcObject = stream;
        video.play();
        
        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'block';
        capturePhotoBtn.style.display = 'block';
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access denied. Please allow camera permissions.');
    }
}

function stopCamera() {
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    startCameraBtn.style.display = 'block';
    stopCameraBtn.style.display = 'none';
    capturePhotoBtn.style.display = 'none';
}

function capturePhoto() {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            currentPhotoBlob = blob;
            console.log('Photo captured:', blob);
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('photo-preview').src = e.target.result;
                document.getElementById('photo-preview-container').style.display = 'block';
            };
            reader.readAsDataURL(blob);
            
            resolve(blob);
        }, 'image/png');
    });
}

function clearPhoto() {
    currentPhotoBlob = null;
    document.getElementById('photo-preview-container').style.display = 'none';
    document.getElementById('photo-preview').src = '';
}

startCameraBtn.addEventListener('click', startCamera);
stopCameraBtn.addEventListener('click', stopCamera);
capturePhotoBtn.addEventListener('click', capturePhoto);
clearPhotoBtn.addEventListener('click', clearPhoto);

// ============== AUDIO RECORDING FUNCTIONALITY ==============
// Removed - functionality moved to sharing features


// ============== SHARING FUNCTIONALITY ==============
const sharePhotoStandaloneBtn = document.getElementById('share-photo-standalone-btn');
const shareLocationBtn = document.getElementById('share-location-btn');
const getLocationBtn = document.getElementById('get-location-btn');
const locationDisplay = document.getElementById('location-display');
const locationCoords = document.getElementById('location-coords');

let currentLocation = null;
let mapMarker = null;

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

// Share photo from preview (embedded button)
if (document.getElementById('share-button')) {
    document.getElementById('share-button').addEventListener('click', async () => {
        if (currentPhotoBlob) {
            await share('My Photo', 'Check out this photo I captured!', currentPhotoBlob);
        } else {
            alert('Please capture a photo first');
        }
    });
}

// Share photo standalone button
sharePhotoStandaloneBtn.addEventListener('click', async () => {
    if (currentPhotoBlob) {
        await share('My Photo', 'Check out this photo I captured!', currentPhotoBlob);
    } else {
        alert('Please capture a photo first from the Camera Capture section');
    }
});

// Get current location
function getLocation() {
    if (navigator.geolocation) {
        getLocationBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Getting Location...';
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
                
                getLocationBtn.innerHTML = '<i class="bi bi-geo"></i> Get My Location';
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
                getLocationBtn.innerHTML = '<i class="bi bi-geo"></i> Get My Location';
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

// Share location
shareLocationBtn.addEventListener('click', async () => {
    if (currentLocation) {
        const { latitude, longitude } = currentLocation;
        const locationText = `Check out my location: https://maps.google.com/?q=${latitude},${longitude}`;
        await share('My Location', locationText);
    } else {
        alert('Please allow location access to share your location');
    }
});

// ============== MAP FUNCTIONALITY ==============
// Initialize map
let map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
}).addTo(map);