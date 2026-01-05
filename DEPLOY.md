# 🚀 Guide de Déploiement sur Render

## 📋 Prérequis

- Compte sur [Render.com](https://render.com) (gratuit)
- Dépôt Git avec le code

## 🔧 Étape 1 : Préparer le dépôt

1. **Committez tous les changements** :
```bash
git add .
git commit -m "Préparation pour déploiement Render"
git push origin main
```

## 🌐 Étape 2 : Créer le service sur Render

### Via le fichier render.yaml (Recommandé)

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur **"New +"** → **"Blueprint"**
3. Connectez votre dépôt GitHub/GitLab
4. Render détectera automatiquement le fichier `render.yaml`
5. Cliquez sur **"Apply"**

### Manuellement

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre dépôt GitHub/GitLab
4. Configurez :
   - **Name** : `chat-vocal-bambara`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free`

## 🔐 Étape 3 : Configurer les variables d'environnement

Dans les **Environment Variables** de votre service Render, ajoutez :

```
DJELIA_API_KEY=4cc23e20-129b-42a0-af09-ca814e9ac23b
ELEVENLABS_API_KEY=sk_e08a92815b5e911d119065275c82377c0396f3b0b2d80750
ELEVENLABS_VOICE_ID=KhPUeP4rOcLu6xgfJ9Av
N8N_WEBHOOK_URL=https://n8n.srv793731.hstgr.cloud/webhook/dioula
NODE_ENV=production
```

### Comment ajouter les variables :

1. Dans votre service, allez dans l'onglet **"Environment"**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez chaque variable (Key/Value)
4. Cliquez sur **"Save Changes"**

## ✅ Étape 4 : Déployer

1. Render va automatiquement déployer votre application
2. Attendez que le build se termine (5-10 minutes)
3. Votre app sera disponible sur : `https://chat-vocal-bambara.onrender.com`

## 🔍 Vérification

### Health Check

Testez que le serveur fonctionne :
```
https://votre-app.onrender.com/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T..."
}
```

### Test complet

1. Ouvrez l'URL de votre app
2. Autorisez l'accès au microphone
3. Cliquez sur "Appuyer pour parler"
4. Parlez en bambara
5. Vérifiez que vous recevez une réponse audio

## 📊 Logs et Monitoring

### Voir les logs en temps réel

1. Dans votre service Render, allez dans l'onglet **"Logs"**
2. Les logs afficheront :
   - ✅ Requêtes réussies
   - ❌ Erreurs éventuelles
   - 📝 Transcriptions
   - 🔊 Synthèses vocales

### Exemples de logs attendus :

```
🚀 Serveur démarré sur le port 10000
📍 URL: http://localhost:10000
📝 Transcription Djelia demandée
✅ Transcription réussie: I ni ce
🤖 Génération de réponse via n8n
✅ Réponse extraite: N be yen
🔊 Synthèse vocale ElevenLabs
✅ Audio généré: 46856 bytes
```

## ⚠️ Limitations du plan gratuit Render

- **Inactivité** : Le service s'endort après 15 min d'inactivité
- **Démarrage** : Première requête après sommeil = 30-60 secondes
- **CPU/RAM** : Limité, mais suffisant pour cette application
- **Heures** : 750 heures gratuites/mois

## 🔄 Mises à jour

Pour mettre à jour l'application :

```bash
# Faire vos modifications
git add .
git commit -m "Mise à jour"
git push origin main
```

Render redéploiera automatiquement !

## 🐛 Dépannage

### Erreur 503

- Le service est en train de démarrer
- Attendez 1-2 minutes et rechargez

### Erreur API

Vérifiez dans les logs :
- ❌ Si "API key invalid" → Vérifiez vos variables d'environnement
- ❌ Si "Timeout" → Le plan gratuit peut être lent, réessayez

### Pas d'audio

- Vérifiez que ElevenLabs API key est valide
- Consultez les logs pour voir si la synthèse fonctionne
- Testez en local d'abord : `npm start`

## 💰 Coûts

- **Render** : Gratuit (plan Free)
- **Djelia** : Selon votre usage
- **ElevenLabs** : Selon votre plan
- **n8n** : Selon votre hébergement

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Render Free Plan](https://render.com/docs/free)
- [Dashboard Render](https://dashboard.render.com)
