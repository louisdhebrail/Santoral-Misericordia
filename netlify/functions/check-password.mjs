exports.handler = async function (event) {
    const body = JSON.parse(event.body || "{}");
    const password = body.password;

    if (password === process.env.EDIT_PASSWORD) {
        return { statusCode: 200, body: JSON.stringify({ valid: true }) };
    } else {
        return { statusCode: 403, body: JSON.stringify({ valid: false }) };
    }
};
