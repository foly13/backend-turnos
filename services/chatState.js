import pool from '../db.js';

// Obtiene el estado de la conversación para un chat_id
export async function getChatState(chatId) {
    try {
        const [rows] = await pool.query(
            'SELECT paso_actual, data FROM conversaciones WHERE chat_id = ?',
            [chatId]
        );

        if (rows.length > 0) {
            let data = {};
            const dbData = rows[0].data;
            
            // ⬅️ CRÍTICO: SOLO parsear si hay datos y no es el string literal de error.
            if (dbData && dbData !== '[object Object]') { 
                 // Asumiendo que el campo 'data' en tu DB devuelve un STRING JSON
                 data = JSON.parse(dbData);
            }

            return {
                paso_actual: rows[0].paso_actual,
                data: data 
            };
        }
        return { paso_actual: 0, data: {} };
    } catch (error) {
        console.error('❌ ERROR en getChatState:', error.message);
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