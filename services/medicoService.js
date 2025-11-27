// services/medicoService.js
import pool from '../db.js';

// Función para obtener los médicos por una especialidad
export async function getMedicosByEspecialidad(especialidad) {
    // NOTA: Asumimos que la tabla 'medicos' tiene una columna 'especialidad'
    const [rows] = await pool.query(
        'SELECT id, nombre, especialidad FROM medicos WHERE especialidad LIKE ?',
        [`%${especialidad}%`] // Usamos LIKE para búsquedas parciales (más flexibles)
    );
    return rows;
}