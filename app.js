async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.play();
    } catch (error) {
        console.error('Camera access denied:', error);
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');
    
    console.log('Photo captured:', imageData);
    return imageData;
}

function stopCamera() {
    const video = document.getElementById('video');
    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
}