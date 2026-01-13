// Application frontend
// Éléments du DOM
const recordBtn = document.getElementById('recordBtn');
const btnText = recordBtn.querySelector('.btn-text');
const statusDiv = document.getElementById('status');
const audioPlayer = document.getElementById('audioPlayer');
const audioPlayerContainer = document.getElementById('audioPlayerContainer');

// Variables d'état
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// API Backend URL
const API_BASE_URL = window.location.origin;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    recordBtn.addEventListener('click', toggleRecording);
});

async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        updateStatus('Demande d\'accès au microphone...');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType });
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            await processAudio(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;

        recordBtn.classList.add('recording');
        btnText.textContent = 'Arrêter l\'enregistrement';
        updateStatus('🔴 Enregistrement en cours... Parlez en dioula', 'active');

    } catch (error) {
        updateStatus('Erreur: Impossible d\'accéder au microphone', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecording = false;

        recordBtn.classList.remove('recording');
        recordBtn.classList.add('processing');
        btnText.textContent = 'Traitement...';
        updateStatus('⏳ Traitement...', 'active');
    }
}

async function processAudio(audioBlob) {
    try {
        updateStatus('📝 Traitement...', 'active');
        const transcript = await transcribeAudio(audioBlob);

        if (!transcript) {
            throw new Error('Échec du traitement');
        }

        updateStatus('🤖 Réflexion...', 'active');
        const aiResponse = await generateResponse(transcript);

        if (!aiResponse) {
            throw new Error('Aucune réponse');
        }

        updateStatus('🔊 Préparation...', 'active');
        await synthesizeSpeech(aiResponse);

    } catch (error) {
        updateStatus('Erreur: ' + error.message, 'error');
    } finally {
        recordBtn.classList.remove('processing');
        btnText.textContent = 'Appuyer pour parler';
        updateStatus('Prêt');
    }
}

async function transcribeAudio(audioBlob) {
    try {
        let filename = 'audio.webm';
        if (audioBlob.type.includes('ogg')) {
            filename = 'audio.ogg';
        } else if (audioBlob.type.includes('mp4')) {
            filename = 'audio.mp4';
        } else if (audioBlob.type.includes('wav')) {
            filename = 'audio.wav';
        }

        const formData = new FormData();
        formData.append('file', audioBlob, filename);

        const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        const data = await response.json();
        return data.transcription || data.text;

    } catch (error) {
        throw new Error('Échec: ' + error.message);
    }
}

async function generateResponse(transcript) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: transcript
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        throw new Error('Échec: ' + error.message);
    }
}

async function synthesizeSpeech(text) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        const audioBlob = await response.blob();
        playAudio(audioBlob);

    } catch (error) {
        throw new Error('Échec: ' + error.message);
    }
}

function playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayerContainer.style.display = 'block';
    audioPlayer.play();

    audioPlayer.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };
}

function updateStatus(text, type = '') {
    statusDiv.textContent = text;
    statusDiv.className = 'status ' + type;
}
