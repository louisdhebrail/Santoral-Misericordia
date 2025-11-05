import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

export async function handler() {
    try {
        // Ouvre ton fichier JSON local
        const filePath = path.resolve('data/donnees.json');
        const rawData = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawData);

        // Initialise le “store” de données Netlify Blobs
        const store = getStore('donnees');

        // Enregistre ton fichier JSON dans le store
        await store.setJSON('donnees.json', jsonData);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Données importées dans Netlify Blobs !' })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
}
