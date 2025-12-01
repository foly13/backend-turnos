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
            t.id AS turno_id, t.fecha, t.hora, t.medico_id,
            m.nombre AS medico_nombre, m.especialidad
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
 * Actualiza la fecha y hora de un turno existente (usado para Modificar Turno).
 */
export async function updateTurno(turnoId, nuevaFecha, nuevaHora) {
    // Solo actualiza fecha y hora, ya que Modificar Turno mantiene el paciente/médico.
    const query = `
        UPDATE turnos 
        SET fecha = ?, hora = ?
        WHERE id = ? AND estado <> 'cancelado'
    `;
    const [result] = await pool.query(query, [nuevaFecha, nuevaHora, turnoId]);
    return result;
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