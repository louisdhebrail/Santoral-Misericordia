import { promises as fs } from 'fs';
import { blobs } from '@netlify/blobs';

export async function handler() {
    try {
        const store = blobs();

        // Lire ton fichier local data/donnees.json
        const raw = await fs.readFile('./data/donnees.json', 'utf-8');
        const jsonData = JSON.parse(raw);

        // Enregistrer le contenu dans les blobs
        await store.setJSON('donnees', jsonData);

        return {
            statusCode: 200,
            body: '✅ Données importées depuis data/donnees.json vers Netlify Blobs !'
        };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: 'Erreur : ' + error.message };
    }
}
