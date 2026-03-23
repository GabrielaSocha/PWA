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

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            console.log('Photo captured:', blob);
            resolve(blob);
        }, 'image/png');
    });
}

function stopCamera() {
    const video = document.getElementById('video');
    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
}


document.getElementById('share-button').addEventListener('click', async () => {
    const blob = await capturePhoto();
    await share('My Photo', 'Check out this photo!', blob);
});


const share = async (title, text, blob) => {
  const data = {
    files: [
      new File([blob], 'file.png', {
        type: blob.type,
      }),
    ],
    title: title,
    text: text,
  };
  try {
    if (!(navigator.canShare(data))) {
      throw new Error("Can't share data.", data);
    }
    await navigator.share(data);
  } catch (err) {
    console.error(err.name, err.message);
  }
};