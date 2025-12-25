/**
 * Script de configuration pour créer l'Assistant OpenAI avec le dictionnaire Dioula en RAG
 * À exécuter UNE SEULE FOIS pour configurer l'assistant
 *
 * Usage: node setup-assistant.js
 */

const fs = require('fs');
const path = require('path');

// Charger la configuration
require('./config.js');

const OPENAI_API_KEY = CONFIG.OPENAI.API_KEY;
const DICTIONARY_PATH = path.join(__dirname, 'dictionnaire-dioula.txt');

async function setupAssistant() {
    console.log('🚀 Configuration de l\'Assistant OpenAI avec RAG...\n');

    try {
        // Étape 1: Upload du fichier dictionnaire
        console.log('📤 Étape 1: Upload du dictionnaire...');

        const fileContent = fs.readFileSync(DICTIONARY_PATH);
        const fileBlob = new Blob([fileContent], { type: 'text/plain' });

        const fileFormData = new FormData();
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', fileBlob, 'dictionnaire-dioula.txt');

        const fileResponse = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: fileFormData
        });

        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            throw new Error(`Erreur upload fichier: ${errorText}`);
        }

        const fileData = await fileResponse.json();
        console.log('✅ Fichier uploadé:', fileData.id);

        // Étape 2: Créer un Vector Store
        console.log('\n📚 Étape 2: Création du Vector Store...');

        const vectorStoreResponse = await fetch('https://api.openai.com/v1/vector_stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                name: 'Dictionnaire Dioula',
                file_ids: [fileData.id]
            })
        });

        if (!vectorStoreResponse.ok) {
            const errorText = await vectorStoreResponse.text();
            throw new Error(`Erreur création vector store: ${errorText}`);
        }

        const vectorStoreData = await vectorStoreResponse.json();
        console.log('✅ Vector Store créé:', vectorStoreData.id);

        // Attendre que le fichier soit traité
        console.log('\n⏳ Attente du traitement du fichier...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Étape 3: Créer l'Assistant avec file_search
        console.log('\n🤖 Étape 3: Création de l\'Assistant...');

        const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                name: 'Professeur Dioula',
                instructions: CONFIG.SYSTEM_PROMPT,
                model: CONFIG.OPENAI.MODEL,
                tools: [{ type: 'file_search' }],
                tool_resources: {
                    file_search: {
                        vector_store_ids: [vectorStoreData.id]
                    }
                }
            })
        });

        if (!assistantResponse.ok) {
            const errorText = await assistantResponse.text();
            throw new Error(`Erreur création assistant: ${errorText}`);
        }

        const assistantData = await assistantResponse.json();
        console.log('✅ Assistant créé:', assistantData.id);

        // Sauvegarder l'ID de l'assistant dans un fichier
        const configUpdate = `
// ID de l'Assistant OpenAI (généré par setup-assistant.js)
// NE PAS MODIFIER MANUELLEMENT
const ASSISTANT_ID = '${assistantData.id}';
`;

        fs.writeFileSync(
            path.join(__dirname, 'assistant-id.js'),
            configUpdate
        );

        console.log('\n✅ Configuration terminée avec succès !');
        console.log('\n📋 Résumé:');
        console.log(`   - Fichier ID: ${fileData.id}`);
        console.log(`   - Vector Store ID: ${vectorStoreData.id}`);
        console.log(`   - Assistant ID: ${assistantData.id}`);
        console.log('\n💾 L\'ID de l\'assistant a été sauvegardé dans assistant-id.js');
        console.log('\n🎯 Vous pouvez maintenant utiliser l\'application avec le RAG activé !');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    }
}

setupAssistant();
