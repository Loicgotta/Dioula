/**
 * Serveur Express pour déploiement sur Render
 * Sécurise les clés API côté serveur
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration multer pour upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir les fichiers statiques

// Variables d'environnement (à configurer sur Render)
const DJELIA_API_KEY = process.env.DJELIA_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

/**
 * Endpoint: Transcription audio avec Djelia
 */
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
    try {
        console.log('📝 Transcription Djelia demandée');

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier audio fourni' });
        }

        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await fetch('https://djelia.cloud/api/v1/models/transcribe', {
            method: 'POST',
            headers: {
                'x-api-key': DJELIA_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Djelia API error: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Transcription réussie:', data.transcription);
        res.json(data);

    } catch (error) {
        console.error('❌ Erreur transcription:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint: Génération de réponse via webhook n8n
 */
app.post('/api/generate', async (req, res) => {
    try {
        console.log('🤖 Génération de réponse via n8n');

        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query manquante' });
        }

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n webhook error: ${errorText}`);
        }

        const responseText = await response.text();
        console.log('📝 Réponse brute n8n:', responseText);

        // Essayer de parser en JSON
        let result;
        try {
            const data = JSON.parse(responseText);
            result = {
                response: data.response || data.message || data.text || data.query || data.output || data.result || JSON.stringify(data)
            };
        } catch (jsonError) {
            // Si pas du JSON, utiliser le texte brut
            result = { response: responseText };
        }

        console.log('✅ Réponse extraite:', result.response);
        res.json(result);

    } catch (error) {
        console.error('❌ Erreur génération:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint: Synthèse vocale avec ElevenLabs
 */
app.post('/api/synthesize', async (req, res) => {
    try {
        console.log('🔊 Synthèse vocale ElevenLabs');

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Texte manquant' });
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
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
            throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        // Récupérer l'audio et le renvoyer
        const audioBuffer = await response.buffer();
        console.log('✅ Audio généré:', audioBuffer.length, 'bytes');

        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);

    } catch (error) {
        console.error('❌ Erreur synthèse:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check pour Render
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Route par défaut - servir index.html
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
