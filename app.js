// Configuration chargée depuis config.js
// IMPORTANT: Assurez-vous que config.js existe (copiez config.example.js et remplissez vos clés API)
// Les clés API sont dans config.js qui n'est pas commité sur Git pour des raisons de sécurité

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

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialisée');
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
 * Traite l'audio enregistré: transcription, génération de réponse avec OpenAI, puis synthèse vocale
 */
async function processAudio(audioBlob) {
    try {
        // Étape 1: Transcription avec Djelia
        updateStatus('📝 Transcription avec Djelia...', 'active');
        const transcript = await transcribeWithDjelia(audioBlob);

        if (!transcript) {
            throw new Error('Aucune transcription reçue');
        }

        // Afficher le message de l'utilisateur
        addMessage('user', transcript);

        // Étape 2: Générer la réponse avec le webhook n8n
        updateStatus('🤖 Génération de la réponse...', 'active');
        const aiResponse = await generateResponseWithWebhook(transcript);

        if (!aiResponse) {
            throw new Error('Aucune réponse reçue du webhook');
        }

        // Afficher la réponse de l'assistant
        addMessage('assistant', aiResponse);

        // Étape 3: Synthèse vocale avec ElevenLabs
        updateStatus('🔊 Synthèse vocale...', 'active');
        await synthesizeSpeechWithElevenLabs(aiResponse);

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
 * Transcrit l'audio avec l'API Djelia
 */
async function transcribeWithDjelia(audioBlob) {
    try {
        // Déterminer l'extension de fichier en fonction du type MIME
        let filename = 'audio.webm';
        if (audioBlob.type.includes('ogg')) {
            filename = 'audio.ogg';
        } else if (audioBlob.type.includes('mp4')) {
            filename = 'audio.mp4';
        } else if (audioBlob.type.includes('wav')) {
            filename = 'audio.wav';
        }

        console.log('Envoi à Djelia - Fichier:', filename, 'Type:', audioBlob.type, 'Taille:', audioBlob.size);

        const formData = new FormData();
        formData.append('file', audioBlob, filename);

        const response = await fetch(CONFIG.DJELIA.API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': CONFIG.DJELIA.API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur Djelia (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('Réponse Djelia complète:', JSON.stringify(data, null, 2));

        // Chercher la transcription dans différentes structures possibles
        let transcript = '';

        // Djelia renvoie un tableau d'objets avec {text, start, end}
        if (Array.isArray(data) && data.length > 0) {
            // Combiner tous les segments de texte
            transcript = data.map(segment => segment.text).join(' ');
        } else if (data.text) {
            transcript = data.text;
        } else if (data.transcription) {
            transcript = data.transcription;
        } else if (data.transcript) {
            transcript = data.transcript;
        } else if (data.results && data.results.length > 0) {
            transcript = data.results[0].text || data.results[0].transcript || '';
        } else if (data.data && data.data.text) {
            transcript = data.data.text;
        } else if (typeof data === 'string') {
            transcript = data;
        }

        // Nettoyer la transcription
        transcript = transcript.trim();

        if (!transcript) {
            console.error('Structure de réponse inattendue:', data);
            throw new Error('Transcription vide. Structure de réponse: ' + JSON.stringify(data));
        }

        console.log('Transcription extraite:', transcript);
        return transcript;

    } catch (error) {
        console.error('Erreur Djelia:', error);
        throw new Error('Échec de la transcription: ' + error.message);
    }
}

/**
 * Génère une réponse via le webhook n8n
 */
async function generateResponseWithWebhook(userMessage) {
    try {
        console.log('Envoi du message au webhook n8n:', userMessage);

        const response = await fetch('https://n8n.srv793731.hstgr.cloud/webhook/dioula', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur webhook (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('Réponse du webhook:', data);

        // Extraire la réponse du webhook
        // Adapter selon le format de réponse de votre webhook n8n
        const assistantMessage = data.response || data.message || data.text || JSON.stringify(data);

        return assistantMessage;

    } catch (error) {
        console.error('Erreur webhook n8n:', error);
        throw new Error('Échec de la génération de réponse: ' + error.message);
    }
}

/**
 * Synthèse vocale avec ElevenLabs Text-to-Speech
 */
async function synthesizeSpeechWithElevenLabs(text) {
    try {
        console.log('Envoi à ElevenLabs TTS:', text);

        const response = await fetch(`${CONFIG.ELEVENLABS.TTS_URL}/${CONFIG.ELEVENLABS.VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': CONFIG.ELEVENLABS.API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ElevenLabs TTS (${response.status}): ${errorText}`);
        }

        // La réponse est directement l'audio en format MP3
        const audioBlob = await response.blob();
        console.log('Audio reçu de ElevenLabs:', audioBlob.size, 'bytes');

        // Jouer l'audio
        playAudio(audioBlob);

    } catch (error) {
        console.error('Erreur ElevenLabs TTS:', error);
        throw new Error('Échec de la synthèse vocale: ' + error.message);
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
        updateStatus('Prêt');
    };
}

/**
 * Ajoute un message dans l'interface
 */
function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const p = document.createElement('p');
    p.textContent = text;

    messageDiv.appendChild(p);
    messagesDiv.appendChild(messageDiv);

    // Scroll vers le bas
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Met à jour le statut affiché
 */
function updateStatus(text, className = '') {
    statusDiv.textContent = text;
    statusDiv.className = 'status ' + className;
}
