import pool from '../db.js';

// Buscar Paciente por DNI (necesario en el Paso 1)
export async function findPacienteByDni(dni) {
    const [rows] = await pool.query(
        'SELECT id, nombre, email FROM pacientes WHERE dni = ?',
        [dni]
    );
    return rows[0];
}

// Crear Nuevo Paciente (necesario en el Paso 99 de registro)
export async function createPaciente(nombre, dni, email = 'PENDIENTE@mail.com') {
    const [result] = await pool.query(
        'INSERT INTO pacientes (nombre, dni, email) VALUES (?, ?, ?)',
        [nombre, dni, email]
    );
    return result.insertId;
}