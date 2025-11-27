import pool from '../db.js';

// Obtiene el estado de la conversación para un chat_id
export async function getChatState(chatId) {
    const [rows] = await pool.query(
        'SELECT * FROM conversaciones WHERE chat_id = ?',
        [chatId]
    );
    if (rows.length === 0) {
        // Devuelve el estado inicial si el usuario es nuevo
        return { chat_id: chatId, paso_actual: 0, data: {} };
    }
    // Asegúrate de parsear el JSON de la columna 'data'
    return {
        ...rows[0],
        data: rows[0].data ? JSON.parse(rows[0].data) : {}
    };
}

// Actualiza el estado de la conversación
export async function updateChatState(chatId, { paso_actual, data }) {
    const [checkRows] = await pool.query(
        'SELECT chat_id FROM conversaciones WHERE chat_id = ?',
        [chatId]
    );

    const dataJson = JSON.stringify(data || {});

    if (checkRows.length > 0) {
        // UPDATE
        await pool.query(
            'UPDATE conversaciones SET paso_actual = ?, data = ? WHERE chat_id = ?',
            [paso_actual, dataJson, chatId]
        );
    } else {
        // INSERT (si el usuario es nuevo)
        await pool.query(
            'INSERT INTO conversaciones (chat_id, paso_actual, data) VALUES (?, ?, ?)',
            [chatId, paso_actual, dataJson]
        );
    }
}