// services/medicoService.js
import pool from '../db.js';
export async function getTodasEspecialidades() {
    // Usamos DISTINCT para asegurar que cada especialidad aparezca solo una vez.
    const [rows] = await pool.query(
        'SELECT DISTINCT especialidad FROM medicos WHERE especialidad IS NOT NULL AND especialidad != ""'
    );
    // Mapeamos el resultado para obtener un array de strings (ej: ['Cardiología', 'Clínica Médica'])
    return rows.map(row => row.especialidad);
}
// Función para obtener los médicos por una especialidad
export async function getMedicosByEspecialidad(especialidad) {
    // NOTA: Asumimos que la tabla 'medicos' tiene una columna 'especialidad'
    const [rows] = await pool.query(
        'SELECT id, nombre, especialidad FROM medicos WHERE especialidad LIKE ?',
        [`%${especialidad}%`] // Usamos LIKE para búsquedas parciales (más flexibles)
    );
    return rows;
}