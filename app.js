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
let conversationHistory = [];
let threadId = null; // Thread ID pour l'Assistants API

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Application initialisée');
    recordBtn.addEventListener('click', toggleRecording);

    // Créer un thread pour la conversation
    await createThread();
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

        // Étape 2: Générer la réponse avec OpenAI GPT-4
        updateStatus('🤖 Génération de la réponse avec GPT-4...', 'active');
        const aiResponse = await generateResponseWithOpenAI(transcript);

        if (!aiResponse) {
            throw new Error('Aucune réponse reçue de OpenAI');
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
 * Crée un nouveau thread pour la conversation
 */
async function createThread() {
    try {
        console.log('Création d\'un nouveau thread...');

        const response = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur création thread: ${errorText}`);
        }

        const data = await response.json();
        threadId = data.id;
        console.log('Thread créé:', threadId);

    } catch (error) {
        console.error('Erreur création thread:', error);
        updateStatus('Erreur: Impossible de créer la conversation', 'error');
    }
}

/**
 * Génère une réponse avec OpenAI Assistants API et RAG
 */
async function generateResponseWithOpenAI(userMessage) {
    try {
        // Vérifier qu'on a un thread
        if (!threadId) {
            await createThread();
        }

        // Vérifier qu'on a un assistant ID
        if (typeof ASSISTANT_ID === 'undefined') {
            throw new Error('Assistant ID non configuré. Exécutez d\'abord setup-assistant.js');
        }

        console.log('Envoi du message au thread:', userMessage);

        // Étape 1: Ajouter le message au thread
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: userMessage
            })
        });

        if (!messageResponse.ok) {
            const errorText = await messageResponse.text();
            throw new Error(`Erreur ajout message: ${errorText}`);
        }

        // Étape 2: Créer un run avec l'assistant
        console.log('Création du run avec l\'assistant...');

        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: ASSISTANT_ID
            })
        });

        if (!runResponse.ok) {
            const errorText = await runResponse.text();
            throw new Error(`Erreur création run: ${errorText}`);
        }

        const runData = await runResponse.json();
        const runId = runData.id;

        console.log('Run créé:', runId);

        // Étape 3: Attendre la complétion du run
        let runStatus = 'queued';
        let attempts = 0;
        const maxAttempts = 30; // 30 secondes max

        while (runStatus !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde

            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            const statusData = await statusResponse.json();
            runStatus = statusData.status;

            console.log('Status du run:', runStatus);

            if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
                throw new Error(`Run ${runStatus}: ${statusData.last_error?.message || 'Erreur inconnue'}`);
            }

            attempts++;
        }

        if (runStatus !== 'completed') {
            throw new Error('Timeout: Le run n\'a pas terminé à temps');
        }

        // Étape 4: Récupérer les messages du thread
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        if (!messagesResponse.ok) {
            const errorText = await messagesResponse.text();
            throw new Error(`Erreur récupération messages: ${errorText}`);
        }

        const messagesData = await messagesResponse.json();
        console.log('Messages reçus:', messagesData);

        // Le premier message est la réponse de l'assistant (les messages sont triés du plus récent au plus ancien)
        const assistantMessage = messagesData.data[0].content[0].text.value;

        return assistantMessage;

    } catch (error) {
        console.error('Erreur OpenAI Assistants API:', error);
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
