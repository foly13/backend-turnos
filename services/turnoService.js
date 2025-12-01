// services/turnoService.js
import pool from '../db.js';

export async function createTurno(medicoId, pacienteId, fecha, hora) {
    const estado = 'confirmado'; 
    
    // Consulta SQL copiada del router.post('/') en routes/turnos.js
    const query = 'INSERT INTO turnos (medico_id, paciente_id, fecha, hora, estado) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [medicoId, pacienteId, fecha, hora, estado]);
    return result;
}

/**
 * Obtiene los turnos futuros confirmados o pendientes de un paciente.
 */
export async function getTurnosActivosByPaciente(pacienteId) {
    const query = `
        SELECT 
            t.id AS turno_id, 
            DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha_formateada,  -- ⬅️ CLAVE: Formatear la fecha
            TIME_FORMAT(t.hora, '%H:%i') AS hora_formateada,    -- ⬅️ CLAVE: Formatear la hora
            t.medico_id,
            m.nombre AS medico_nombre, 
            m.especialidad
        FROM 
            turnos t
        JOIN 
            medicos m ON t.medico_id = m.id
        WHERE 
            t.paciente_id = ? 
            AND t.estado IN ('confirmado', 'pendiente')
            AND t.fecha >= CURDATE()
        ORDER BY 
            t.fecha ASC, t.hora ASC
    `;
    const [turnos] = await pool.query(query, [pacienteId]);
    return turnos;
}


/**
 * Cambia el estado de un turno a 'cancelado' (usado para Cancelar Turno).
 */
export async function cancelTurno(turnoId) {
    // La consulta es similar a la de update, pero solo cambiamos el estado
    const query = `
        UPDATE turnos 
        SET estado = 'cancelado'
        WHERE id = ? AND estado <> 'cancelado'
    `;
    const [result] = await pool.query(query, [turnoId]);
    return result;
}