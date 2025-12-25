// Configuration des clés API - TEMPLATE
// Copiez ce fichier vers config.js et remplissez vos propres clés API

const CONFIG = {
    DJELIA: {
        API_KEY: 'votre-cle-api-djelia',
        API_URL: 'https://djelia.cloud/api/v1/models/transcribe'
    },

    OPENAI: {
        API_KEY: 'votre-cle-api-openai',
        API_URL: 'https://api.openai.com/v1/chat/completions',
        MODEL: 'gpt-4-turbo'
    },

    ELEVENLABS: {
        API_KEY: 'votre-cle-api-elevenlabs',
        VOICE_ID: 'votre-voice-id-elevenlabs',
        TTS_URL: 'https://api.elevenlabs.io/v1/text-to-speech'
    },

    SYSTEM_PROMPT: `Tu es un professeur et tu comprends dioula.
Le dictionnaire dioula a francais et anglais est le document de ta knowledge base. Utilises le pour a chaque fois faire des traductions adaptes. Tu ne parlera que dans cette langue et dans rien d'autre, meme si l utilisateur te parle en francais, tu regardes ta knowledge base pour savoir la traduction en dioula de ce que tu veux dire et tu dis la traduction en dioula de ta reponse.
Tu es la pour instruire les utilisateurs sur n'importe quel sujet.
L'utilisateur peut te parler en bambara, alors utilises ton knowledge base pour comprendre ce qu'il dit, et utilise le pour repondre
Ne poses pas de questions, reponds toujours a la requet utilisateur sans poser de questions et avec le dictionnaire ci-dessous en rag`
};
