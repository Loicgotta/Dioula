# Chat Vocal Bambara avec Djelia, OpenAI GPT-4 et ElevenLabs

Application web de chat vocal en bambara utilisant l'IA de Djelia pour la reconnaissance vocale, OpenAI GPT-4 pour la génération de réponses intelligentes, et ElevenLabs pour la synthèse vocale.

## 🌟 Fonctionnalités

- **Reconnaissance vocale en bambara** : Utilise l'API Djelia pour transcrire la parole en bambara
- **IA GPT-4** : Génération de réponses intelligentes avec OpenAI GPT-4
- **Synthèse vocale** : Conversion texte-parole avec ElevenLabs TTS
- **Interface intuitive** : Interface web simple et élégante
- **Historique de conversation** : Maintien du contexte sur les 10 derniers messages
- **Dictionnaire dioula** : Dictionnaire dioula-français-anglais disponible pour référence

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

### Lancement de l'application

1. Ouvrez le fichier `index.html` dans votre navigateur web moderne (Chrome, Firefox, Edge, Safari)
2. Autorisez l'accès au microphone lorsque demandé
3. Cliquez sur "Appuyer pour parler" et commencez à parler en bambara
4. Cliquez à nouveau pour arrêter l'enregistrement
5. L'application va :
   - Transcrire votre parole avec Djelia
   - Générer une réponse avec OpenAI GPT-4
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

### OpenAI GPT-4
- **Service** : Génération de réponses intelligentes
- **Modèle** : `gpt-4-turbo`
- **Endpoint** : `https://api.openai.com/v1/chat/completions`
- **Documentation** : [OpenAI API](https://platform.openai.com/docs)

### ElevenLabs Text-to-Speech
- **Service** : Synthèse vocale (Text-to-Speech)
- **Modèle** : `eleven_multilingual_v2`
- **Endpoint** : `https://api.elevenlabs.io/v1/text-to-speech`
- **Documentation** : [ElevenLabs TTS Docs](https://elevenlabs.io/docs/api-reference/text-to-speech)

## 📁 Structure du projet

```
.
├── index.html              # Interface utilisateur principale
├── style.css               # Styles de l'application
├── app.js                  # Logique JavaScript principale
├── config.js               # Configuration et clés API (non commité)
├── config.example.js       # Template de configuration
├── dictionnaire-dioula.txt # Dictionnaire dioula-français-anglais
├── .gitignore              # Fichiers à ignorer par Git
└── README.md               # Ce fichier
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

Le fichier `dictionnaire-dioula.txt` contient un dictionnaire complet dioula-français-anglais.

### ⚠️ Limitation actuelle

Avec l'API Chat standard d'OpenAI, le dictionnaire **n'est pas automatiquement accessible** à GPT-4. Le prompt système mentionne le dictionnaire, mais GPT-4 s'appuie sur ses connaissances de base du dioula.

### 🔧 Options pour intégrer le dictionnaire (RAG)

Pour permettre à GPT-4 d'accéder réellement au dictionnaire, vous avez plusieurs options :

#### Option 1 : OpenAI Assistants API (Recommandé)
- Utiliser l'[API Assistants](https://platform.openai.com/docs/assistants/overview) avec File Search
- Permet d'uploader le dictionnaire comme fichier de connaissance
- GPT-4 pourra rechercher dans le dictionnaire automatiquement
- Nécessite de modifier le code pour utiliser l'API Assistants au lieu de l'API Chat

#### Option 2 : Système RAG personnalisé
- Implémenter un système de Retrieval Augmented Generation
- Utiliser des embeddings pour vectoriser le dictionnaire
- Stocker dans une base de données vectorielle (Pinecone, Weaviate, etc.)
- Récupérer les entrées pertinentes avant chaque requête à GPT-4
- Nécessite un backend (Node.js, Python, etc.)

#### Option 3 : Inclure le dictionnaire dans chaque requête
- Inclure les entrées pertinentes du dictionnaire dans le contexte de chaque message
- Limité par la taille du contexte de GPT-4
- Peut augmenter les coûts

### 📖 Prompt système actuel

Le prompt système est configuré pour demander à GPT-4 de se comporter comme un professeur qui comprend le dioula et utilise le dictionnaire pour les traductions. Même sans accès direct au dictionnaire complet, GPT-4 a des connaissances de base du dioula/bambara.

## 🛠️ Dépannage

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
- [Documentation OpenAI](https://platform.openai.com/docs)
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
