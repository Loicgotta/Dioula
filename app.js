// Configuration des API
const DJELIA_API_KEY = '4cc23e20-129b-42a0-af09-ca814e9ac23b';
const DJELIA_API_URL = 'https://djelia.cloud/api/v1/models/transcribe';

const ELEVENLABS_API_KEY = 'sk_e08a92815b5e911d119065275c82377c0396f3b0b2d80750';
const ELEVENLABS_AGENT_ID = 'agent_7801k3yd7xb4fgfva2r76j2fk9dm';

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
let elevenLabsWs = null;

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

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
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
 * Traite l'audio enregistré: transcription puis envoi à ElevenLabs
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

        // Étape 2: Envoyer à ElevenLabs et recevoir la réponse
        updateStatus('🤖 Génération de la réponse...', 'active');
        await conversationWithElevenLabs(transcript);

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
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');

        const response = await fetch(DJELIA_API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': DJELIA_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur Djelia (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log('Réponse Djelia:', data);

        // La réponse peut varier, adapter selon la structure réelle de l'API
        const transcript = data.text || data.transcription || data.transcript || '';

        if (!transcript) {
            throw new Error('Transcription vide');
        }

        return transcript;

    } catch (error) {
        console.error('Erreur Djelia:', error);
        throw new Error('Échec de la transcription: ' + error.message);
    }
}

/**
 * Conversation avec ElevenLabs via WebSocket
 */
async function conversationWithElevenLabs(text) {
    return new Promise((resolve, reject) => {
        try {
            // Créer la connexion WebSocket
            const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`;
            elevenLabsWs = new WebSocket(wsUrl);

            const audioChunksResponse = [];
            let conversationEnded = false;

            elevenLabsWs.onopen = () => {
                console.log('WebSocket ElevenLabs connecté');

                // Envoyer la configuration initiale
                const initMessage = {
                    type: 'conversation_initiation_client_data',
                    conversation_config_override: {
                        agent: {
                            prompt: {
                                prompt: 'Tu es un assistant qui parle bambara.'
                            }
                        }
                    }
                };
                elevenLabsWs.send(JSON.stringify(initMessage));

                // Envoyer le message texte de l'utilisateur
                const userMessage = {
                    type: 'user_input',
                    user_input: text
                };

                setTimeout(() => {
                    elevenLabsWs.send(JSON.stringify(userMessage));
                    console.log('Message envoyé à ElevenLabs:', text);
                }, 100);
            };

            elevenLabsWs.onmessage = async (event) => {
                try {
                    // Si c'est un message binaire (audio)
                    if (event.data instanceof Blob) {
                        audioChunksResponse.push(event.data);
                        console.log('Chunk audio reçu');
                        return;
                    }

                    // Si c'est un message JSON
                    const message = JSON.parse(event.data);
                    console.log('Message ElevenLabs:', message);

                    switch (message.type) {
                        case 'conversation_initiation_metadata':
                            console.log('Conversation initialisée');
                            break;

                        case 'audio':
                            // Audio encodé en base64 dans certains cas
                            if (message.audio_event && message.audio_event.audio) {
                                const audioData = base64ToBlob(message.audio_event.audio);
                                audioChunksResponse.push(audioData);
                            }
                            break;

                        case 'agent_response':
                            // Réponse textuelle de l'agent
                            if (message.agent_response) {
                                addMessage('assistant', message.agent_response);
                            }
                            break;

                        case 'interruption':
                            console.log('Interruption détectée');
                            break;

                        case 'ping':
                            // Répondre au ping avec un pong
                            elevenLabsWs.send(JSON.stringify({ type: 'pong', event_id: message.event_id }));
                            break;

                        case 'conversation_ended':
                            conversationEnded = true;
                            console.log('Conversation terminée');

                            // Traiter l'audio reçu
                            if (audioChunksResponse.length > 0) {
                                const audioBlob = new Blob(audioChunksResponse, { type: 'audio/mpeg' });
                                playAudio(audioBlob);
                            }

                            elevenLabsWs.close();
                            resolve();
                            break;

                        case 'error':
                            throw new Error(message.message || 'Erreur ElevenLabs');
                    }

                } catch (error) {
                    console.error('Erreur traitement message:', error);
                }
            };

            elevenLabsWs.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
                reject(new Error('Erreur de connexion à ElevenLabs'));
            };

            elevenLabsWs.onclose = () => {
                console.log('WebSocket fermé');
                if (!conversationEnded) {
                    resolve(); // Résoudre même si pas de message de fin explicite
                }
            };

            // Timeout de sécurité
            setTimeout(() => {
                if (elevenLabsWs.readyState !== WebSocket.CLOSED) {
                    elevenLabsWs.close();
                    reject(new Error('Timeout de la conversation'));
                }
            }, 30000); // 30 secondes

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Convertit une chaîne base64 en Blob
 */
function base64ToBlob(base64, contentType = 'audio/mpeg') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
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
