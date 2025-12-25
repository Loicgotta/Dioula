# Chat Vocal Bambara avec Djelia et ElevenLabs

Application web de chat vocal en bambara utilisant l'IA de Djelia pour la reconnaissance vocale et ElevenLabs pour les réponses conversationnelles.

## 🌟 Fonctionnalités

- **Reconnaissance vocale en bambara** : Utilise l'API Djelia pour transcrire la parole en bambara
- **Conversation IA** : Agent conversationnel ElevenLabs pour des réponses naturelles
- **Interface intuitive** : Interface web simple et élégante
- **Audio en temps réel** : Réponses vocales de l'assistant

## 🚀 Comment utiliser

### Lancement de l'application

1. Ouvrez le fichier `index.html` dans votre navigateur web moderne (Chrome, Firefox, Edge, Safari)
2. Autorisez l'accès au microphone lorsque demandé
3. Cliquez sur "Appuyer pour parler" et commencez à parler en bambara
4. Cliquez à nouveau pour arrêter l'enregistrement
5. L'application va :
   - Transcrire votre parole avec Djelia
   - Envoyer la transcription à l'agent ElevenLabs
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

### ElevenLabs Conversational AI
- **Service** : Agent conversationnel vocal
- **Connexion** : WebSocket `wss://api.elevenlabs.io/v1/convai/conversation`
- **Agent ID** : `agent_7801k3yd7xb4fgfva2r76j2fk9dm`
- **Documentation** : [ElevenLabs Docs](https://elevenlabs.io/docs/agents-platform/overview)

## 📁 Structure du projet

```
.
├── index.html          # Interface utilisateur principale
├── style.css           # Styles de l'application
├── app.js              # Logique JavaScript
└── README.md           # Ce fichier
```

## 🔐 Configuration des API

Les clés API sont actuellement intégrées dans le code (`app.js`). Pour la production, il est recommandé de :

1. Utiliser des variables d'environnement
2. Créer un backend pour sécuriser les clés
3. Implémenter une authentification utilisateur

### Clés actuelles (à modifier pour la production)

```javascript
const DJELIA_API_KEY = '4cc23e20-129b-42a0-af09-ca814e9ac23b';
const ELEVENLABS_API_KEY = 'sk_e08a92815b5e911d119065275c82377c0396f3b0b2d80750';
const ELEVENLABS_AGENT_ID = 'agent_7801k3yd7xb4fgfva2r76j2fk9dm';
```

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
- [Documentation ElevenLabs Agents](https://elevenlabs.io/docs/agents-platform/overview)
- [WebSocket API ElevenLabs](https://elevenlabs.io/docs/agents-platform/libraries/web-sockets)

## 🤝 Contribution

Ce projet est ouvert aux contributions. N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités

## 📄 Licence

MIT License - Libre d'utilisation et de modification
