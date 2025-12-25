# Chat Vocal Bambara avec Djelia, OpenAI GPT-4 et ElevenLabs

Application web de chat vocal en bambara utilisant l'IA de Djelia pour la reconnaissance vocale, OpenAI GPT-4 Assistants API avec RAG pour la génération de réponses intelligentes, et ElevenLabs pour la synthèse vocale.

## 🌟 Fonctionnalités

- **Reconnaissance vocale en bambara** : Utilise l'API Djelia pour transcrire la parole en bambara
- **IA GPT-4 avec RAG** : Génération de réponses intelligentes avec OpenAI Assistants API et accès au dictionnaire dioula
- **Dictionnaire intégré** : Le dictionnaire dioula-français-anglais est accessible par l'IA via File Search
- **Synthèse vocale** : Conversion texte-parole avec ElevenLabs TTS
- **Interface intuitive** : Interface web simple et élégante
- **Contexte conversationnel** : Maintien de la conversation via Threads API

## 🚀 Comment utiliser

### Configuration initiale

1. **Copiez le fichier de configuration** :
   ```bash
   cp config.example.js config.js
   ```

2. **Remplissez vos clés API** dans `config.js` :
   - Clé API Djelia
   - Clé API OpenAI
   - Clé API ElevenLabs
   - ID de voix ElevenLabs

3. **Créez l'Assistant OpenAI avec le dictionnaire** :
   ```bash
   node setup-assistant.js
   ```

   Ce script va :
   - Uploader le dictionnaire dioula vers OpenAI
   - Créer un Vector Store pour le RAG
   - Créer un Assistant avec File Search activé
   - Sauvegarder l'ID de l'assistant dans `assistant-id.js`

   ⏳ **Important** : Cette étape peut prendre quelques secondes. Ne l'exécutez qu'**une seule fois**.

### Lancement de l'application

1. Ouvrez le fichier `index.html` dans votre navigateur web moderne (Chrome, Firefox, Edge, Safari)
2. Autorisez l'accès au microphone lorsque demandé
3. Cliquez sur "Appuyer pour parler" et commencez à parler en bambara
4. Cliquez à nouveau pour arrêter l'enregistrement
5. L'application va :
   - Transcrire votre parole avec Djelia
   - Envoyer le message à l'Assistant GPT-4 qui consulte le dictionnaire (RAG)
   - Générer une réponse contextuelle en dioula
   - Synthétiser la réponse en audio avec ElevenLabs TTS
   - Afficher et jouer la réponse

### Serveur local (recommandé)

Pour éviter les problèmes CORS et de permissions, lancez un serveur HTTP local :

#### Avec Python 3
```bash
python3 -m http.server 8000
```

#### Avec Node.js (npx)
```bash
npx http-server -p 8000
```

#### Avec PHP
```bash
php -S localhost:8000
```

Puis ouvrez http://localhost:8000 dans votre navigateur.

## 🔧 Technologies utilisées

### Djelia API
- **Service** : Reconnaissance vocale bambara
- **Endpoint** : `https://djelia.cloud/api/v1/models/transcribe`
- **Authentification** : Header `x-api-key`
- **Documentation** : [djelia.cloud](https://www.djelia.cloud/)

### OpenAI Assistants API avec GPT-4
- **Service** : Génération de réponses intelligentes avec RAG
- **Modèle** : `gpt-4-turbo`
- **API** : Assistants API v2 avec File Search
- **Endpoints** :
  - Threads: `https://api.openai.com/v1/threads`
  - Messages: `https://api.openai.com/v1/threads/{thread_id}/messages`
  - Runs: `https://api.openai.com/v1/threads/{thread_id}/runs`
- **Documentation** : [OpenAI Assistants API](https://platform.openai.com/docs/assistants)

### ElevenLabs Text-to-Speech
- **Service** : Synthèse vocale (Text-to-Speech)
- **Modèle** : `eleven_multilingual_v2`
- **Endpoint** : `https://api.elevenlabs.io/v1/text-to-speech`
- **Documentation** : [ElevenLabs TTS Docs](https://elevenlabs.io/docs/api-reference/text-to-speech)

## 📁 Structure du projet

```
.
├── index.html                  # Interface utilisateur principale
├── style.css                   # Styles de l'application
├── app.js                      # Logique JavaScript principale
├── config.js                   # Configuration et clés API (non commité)
├── config.example.js           # Template de configuration
├── assistant-id.js             # ID de l'assistant OpenAI (généré, non commité)
├── assistant-id.example.js     # Template pour l'ID assistant
├── setup-assistant.js          # Script de configuration de l'Assistant
├── dictionnaire-dioula.txt     # Dictionnaire dioula-français-anglais
├── .gitignore                  # Fichiers à ignorer par Git
└── README.md                   # Ce fichier
```

## 🔐 Configuration des API

**IMPORTANT** : Les clés API sont stockées dans `config.js` qui n'est **pas commité** sur Git pour des raisons de sécurité.

### Configuration locale

1. Copiez `config.example.js` vers `config.js`
2. Remplissez vos propres clés API dans `config.js`
3. Ne partagez jamais votre fichier `config.js`

### Sécurité

- ✅ Les clés API sont dans `config.js` (ignoré par Git)
- ✅ Seul le template `config.example.js` est commité
- ⚠️ Pour une application en production, utilisez un backend pour sécuriser les clés API

## 📚 Dictionnaire Dioula et RAG

Le fichier `dictionnaire-dioula.txt` contient un dictionnaire complet dioula-français-anglais qui est **automatiquement accessible** à l'Assistant GPT-4 via le système RAG (Retrieval Augmented Generation).

### ✅ Comment fonctionne le RAG

1. **Upload du dictionnaire** : Le script `setup-assistant.js` upload le dictionnaire vers OpenAI
2. **Vector Store** : OpenAI crée automatiquement des embeddings et un index vectoriel
3. **File Search** : L'Assistant utilise File Search pour chercher dans le dictionnaire
4. **Contexte enrichi** : Les entrées pertinentes sont automatiquement ajoutées au contexte
5. **Réponses précises** : GPT-4 peut utiliser le dictionnaire pour des traductions exactes

### 🎯 Avantages du système implémenté

- ✅ **Accès direct au dictionnaire** : L'Assistant peut chercher n'importe quelle entrée
- ✅ **Recherche sémantique** : Trouve les mots même avec des variations orthographiques
- ✅ **Pas de limite de contexte** : Le dictionnaire entier est disponible
- ✅ **Coût optimisé** : File Search est inclus ($0.10/GB/jour, 1er GB gratuit)
- ✅ **Maintenance facile** : Mettez à jour le dictionnaire et relancez `setup-assistant.js`

### 📖 Prompt système

L'Assistant est configuré pour se comporter comme un professeur qui comprend le dioula. Il utilise le dictionnaire uploadé comme knowledge base pour :
- Traduire du français/anglais vers le dioula
- Comprendre les messages en bambara/dioula
- Fournir des réponses uniquement en dioula
- Enseigner sur n'importe quel sujet en dioula

## 🛠️ Dépannage

### Erreur "Assistant ID non configuré"
- Assurez-vous d'avoir exécuté `node setup-assistant.js` après avoir configuré vos clés API
- Vérifiez que le fichier `assistant-id.js` a été créé
- Si vous utilisez un serveur web, rechargez la page après avoir créé l'assistant

### Le setup-assistant.js échoue
- Vérifiez que Node.js est installé (`node --version`)
- Vérifiez que votre clé API OpenAI est valide
- Vérifiez votre connexion internet
- Consultez les logs pour voir l'erreur exacte

### Le microphone ne fonctionne pas
- Vérifiez que votre navigateur a l'autorisation d'accéder au microphone
- Utilisez HTTPS ou localhost (requis pour getUserMedia)
- Vérifiez que le microphone n'est pas utilisé par une autre application

### Erreur CORS
- Lancez l'application via un serveur HTTP local
- Ne l'ouvrez pas directement avec `file://`

### Pas de réponse de l'API
- Vérifiez votre connexion internet
- Vérifiez que les clés API sont valides
- Consultez la console du navigateur (F12) pour les erreurs détaillées

## 📱 Compatibilité

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ⚠️ Nécessite HTTPS ou localhost pour l'accès au microphone
- ⚠️ WebSocket doit être supporté

## 📚 Ressources

- [Documentation Djelia](https://www.djelia.cloud/)
- [Documentation OpenAI Assistants API](https://platform.openai.com/docs/assistants)
- [Documentation OpenAI File Search](https://platform.openai.com/docs/assistants/tools/file-search)
- [Documentation ElevenLabs TTS](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Obtenir une clé API OpenAI](https://platform.openai.com/api-keys)
- [Obtenir une clé API ElevenLabs](https://elevenlabs.io/app/settings/api-keys)

## 🤝 Contribution

Ce projet est ouvert aux contributions. N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités

## 📄 Licence

MIT License - Libre d'utilisation et de modification
