// utils.js — common functions

// Wait until Firebase is initialized
function onFirebaseReady(cb) {
    if (window.auth && window.db) return cb();
    window.addEventListener("firebaseReady", () => cb());
}

// Voice to text converter
export async function startSpeechToText(targetInputId) {
    try {
        const recognition = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition)();

        recognition.lang = "en-IN"; 
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            document.getElementById(targetInputId).value =
                event.results[0][0].transcript;
        };

        recognition.start();
    } catch (err) {
        alert("Voice input is not supported on this device.");
        console.error(err);
    }
}

// Camera Capture
export function captureImage(videoId, canvasId) {
    const video = document.getElementById(videoId);
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
}

// Convert Base64 → Blob for Firebase Upload
export function base64ToBlob(base64, type = "image/jpeg") {
    const byteString = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
}
