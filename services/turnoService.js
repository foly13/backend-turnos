// services/turnoService.js
import pool from '../db.js';

export async function createTurno(medicoId, pacienteId, fecha, hora) {
    const estado = 'confirmado'; 
    
    const query = `
        INSERT INTO turnos (medico_id, paciente_id, fecha, hora, estado) 
        VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [medicoId, pacienteId, fecha, hora, estado]);
    return result;
}