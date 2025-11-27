import pool from '../db.js';

// Obtiene el estado de la conversación para un chat_id
export async function getChatState(chatId) {
    try {
        const [rows] = await pool.query(
            'SELECT paso_actual, data FROM conversaciones WHERE chat_id = ?',
            [chatId]
        );

        if (rows.length > 0) {
            const dbRow = rows[0];
            const dbData = dbRow.data;
            let data = {};
            
            // 1. Caso A: Si el driver ya devolvió un objeto (columna MySQL JSON)
            if (typeof dbData === 'object' && dbData !== null) {
                data = dbData; 
            } 
            // 2. Caso B: Si el driver devolvió una cadena JSON (columna TEXT/VARCHAR o diferente configuración)
            else if (typeof dbData === 'string' && dbData.length > 0) {
                 try {
                     data = JSON.parse(dbData);
                 } catch (parseError) {
                     // Solo para seguridad si el string está corrupto
                     console.error(`⚠️ ALERTA: Datos JSON corruptos para el chat ${chatId}. Se está recuperando.`, parseError.message);
                     data = {};
                 }
            }

            return {
                paso_actual: dbRow.paso_actual,
                data: data 
            };
        }
        return { paso_actual: 0, data: {} }; 
    } catch (error) {
        // Este catch es para errores de conexión/SQL.
        console.error('❌ FATAL ERROR en getChatState (Conexión/SQL):', error.message);
        throw error; 
    }
}
export async function updateChatState(chatId, newState) {
    // Serializa el objeto de datos a una cadena JSON antes de guardarlo
    const dataString = JSON.stringify(newState.data); // ⬅️ ¡CORRECCIÓN CLAVE!

    const [result] = await pool.query(
        `INSERT INTO conversaciones (chat_id, paso_actual, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE paso_actual = VALUES(paso_actual), data = VALUES(data)`,
        [chatId, newState.paso_actual, dataString] // Usa la cadena serializada
    );
    return result;
}