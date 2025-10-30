exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body);
    const newData = body.jsonData; // JSON envoyé depuis le frontend
    const githubToken = process.env.GITHUB_TOKEN; // À définir dans Netlify
    const owner = 'louisdhebrail';
    const repo = 'Santoral-Misericordia';
    const path = 'data/donnees.json';
    const branch = process.env.BRANCH;

    try {    // Récupérer le SHA du fichier existant
        const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
            headers: { Authorization: `token ${githubToken}` }
        });
        const getData = await getResponse.json();
        const sha = getData.sha;

        // Mettre à jour le fichier
        const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: { Authorization: `token ${githubToken}` },
            body: JSON.stringify({
                message: 'Mise à jour via Netlify Function',
                content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
                branch,
                sha
            })
        });

        const putData = await putResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, result: putData })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
