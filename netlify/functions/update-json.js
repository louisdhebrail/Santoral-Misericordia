import { getStore } from '@netlify/blobs';

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Méthode non autorisée' };
    }

    try {
        const body = JSON.parse(event.body);
        const newData = body.jsonData;

        const store = getStore('donnees');
        await store.setJSON('donnees.json', newData);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Données mises à jour dans Netlify Blobs !' })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
}
