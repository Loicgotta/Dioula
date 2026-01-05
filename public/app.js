// Application frontend - appelle le backend Express au lieu des APIs externes
// Les clés API sont sécurisées côté serveur

// Éléments du DOM
const recordBtn = document.getElementById('recordBtn');
const btnText = recordBtn.querySelector('.btn-text');
const statusDiv = document.getElementById('status');
const messagesDiv = document.getElementById('messages');
const audioPlayer = document.getElementById('audioPlayer');
const audioPlayerContainer = document.getElementById('audioPlayerContainer');

// Variables d'état
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// API Backend URL (automatiquement la bonne URL en production)
const API_BASE_URL = window.location.origin;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialisée');
    console.log('API Backend:', API_BASE_URL);
    recordBtn.addEventListener('click', toggleRecording);
});

/**
 * Toggle entre démarrer et arrêter l'enregistrement
 */
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

/**
 * Démarre l'enregistrement audio
 */
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

        // Essayer différents formats audio supportés
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        console.log('Format audio utilisé:', mimeType);

        mediaRecorder = new MediaRecorder(stream, { mimeType });

        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            console.log('Audio capturé - Taille:', audioBlob.size, 'bytes, Type:', audioBlob.type);
            await processAudio(audioBlob);

            // Arrêter le stream pour libérer le micro
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;

        recordBtn.classList.add('recording');
        btnText.textContent = 'Arrêter l\'enregistrement';
        updateStatus('🔴 Enregistrement en cours... Parlez en bambara', 'active');

    } catch (error) {
        console.error('Erreur d\'accès au microphone:', error);
        updateStatus('Erreur: Impossible d\'accéder au microphone', 'error');
        addMessage('system', 'Erreur: Veuillez autoriser l\'accès au microphone');
    }
}

/**
 * Arrête l'enregistrement audio
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecording = false;

        recordBtn.classList.remove('recording');
        recordBtn.classList.add('processing');
        btnText.textContent = 'Traitement...';
        updateStatus('⏳ Traitement de l\'audio...', 'active');
    }
}

/**
 * Traite l'audio enregistré via le backend
 */
async function processAudio(audioBlob) {
    try {
        // Étape 1: Transcription avec Djelia via le backend
        updateStatus('📝 Transcription en cours...', 'active');
        const transcript = await transcribeAudio(audioBlob);

        if (!transcript) {
            throw new Error('Transcription vide');
        }

        console.log('Transcription:', transcript);

        // Afficher le message de l'utilisateur
        addMessage('user', transcript);

        // Étape 2: Générer la réponse via le backend (webhook n8n)
        updateStatus('🤖 Génération de la réponse...', 'active');
        const aiResponse = await generateResponse(transcript);

        if (!aiResponse) {
            throw new Error('Aucune réponse reçue');
        }

        // Afficher la réponse de l'assistant
        addMessage('assistant', aiResponse);

        // Étape 3: Synthèse vocale via le backend (ElevenLabs)
        updateStatus('🔊 Synthèse vocale...', 'active');
        await synthesizeSpeech(aiResponse);

    } catch (error) {
        console.error('Erreur de traitement:', error);
        updateStatus('Erreur: ' + error.message, 'error');
        addMessage('error', 'Erreur: ' + error.message);
    } finally {
        recordBtn.classList.remove('processing');
        btnText.textContent = 'Appuyer pour parler';
        updateStatus('Prêt');
    }
}

/**
 * Transcrit l'audio via le backend
 */
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

        console.log('Envoi au backend - Fichier:', filename);

        const formData = new FormData();
        formData.append('file', audioBlob, filename);

        const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur de transcription');
        }

        const data = await response.json();
        return data.transcription || data.text;

    } catch (error) {
        console.error('Erreur transcription:', error);
        throw new Error('Échec de la transcription: ' + error.message);
    }
}

/**
 * Génère une réponse via le backend (webhook n8n)
 */
async function generateResponse(transcript) {
    try {
        console.log('Génération de réponse pour:', transcript);

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur de génération');
        }

        const data = await response.json();
        return data.response;

    } catch (error) {
        console.error('Erreur génération:', error);
        throw new Error('Échec de la génération: ' + error.message);
    }
}

/**
 * Synthétise la parole via le backend (ElevenLabs)
 */
async function synthesizeSpeech(text) {
    try {
        console.log('Synthèse vocale pour:', text);

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur de synthèse');
        }

        // Récupérer l'audio
        const audioBlob = await response.blob();
        console.log('Audio reçu:', audioBlob.size, 'bytes');

        // Jouer l'audio
        playAudio(audioBlob);

    } catch (error) {
        console.error('Erreur synthèse:', error);
        throw new Error('Échec de la synthèse: ' + error.message);
    }
}

/**
 * Joue l'audio reçu
 */
function playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayerContainer.style.display = 'block';
    audioPlayer.play();

    audioPlayer.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };
}

/**
 * Ajoute un message dans le chat
 */
function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const p = document.createElement('p');
    p.textContent = text;
    messageDiv.appendChild(p);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Met à jour le statut affiché
 */
function updateStatus(text, type = '') {
    statusDiv.textContent = text;
    statusDiv.className = 'status ' + type;
}
