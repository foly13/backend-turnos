// middleware/auth.js
import 'dotenv/config'; 

// Este middleware verifica si el encabezado 'x-api-key' contiene el token secreto.
export const checkApiKey = (req, res, next) => {
    // 1. Obtener la clave del encabezado
    const apiKeyHeader = req.headers['x-api-key'];

    // 2. Obtener la clave secreta del entorno
    const secretKey = process.env.API_SECRET_KEY;

    if (!apiKeyHeader || apiKeyHeader !== secretKey) {
        // 3. Denegar acceso si la clave falta o es incorrecta
        return res.status(401).json({ 
            message: 'Acceso denegado. Se requiere una API Key válida.',
            error: 'Unauthorized'
        });
    }
    next();
};