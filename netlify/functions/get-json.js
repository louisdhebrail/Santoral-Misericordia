import { getStore } from "@netlify/blobs";

export async function handler() {
    try {
        const data = await getJSON('donnees.json', {
            name: 'donnees',
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_API_TOKEN
        });

        if (!data) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Aucune donnée trouvée dans Netlify Blobs" }),
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}