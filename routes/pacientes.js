// routes/pacientes.js
import express from 'express';
import db from '../db.js';
import { checkApiKey } from '../middleware/auth.js';
const router = express.Router();

// ------------------------------------------------------------------
// ⭐ OPERACIONES CRUD para 'pacientes'
// ------------------------------------------------------------------

// [R]ead - Obtener todos los pacientes
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pacientes');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ message: 'Error al obtener la lista de pacientes' });
    }
});

// [R]ead - Obtener un paciente por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM pacientes WHERE id = ?';
        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener paciente por ID:", error);
        res.status(500).json({ message: 'Error al obtener el paciente' });
    }
});

// [C]reate - Crear un nuevo paciente
router.post('/', checkApiKey, async (req, res) => {
    const { nombre, dni, email } = req.body;
    if (!nombre || !dni) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: nombre y dni' });
    }

    try {
        const query = 'INSERT INTO pacientes (nombre, dni, email) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [nombre, dni, email]);
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Paciente creado exitosamente' 
        });
    } catch (error) {
        console.error("Error al crear paciente:", error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El DNI ingresado ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el paciente' });
    }
});

// [U]pdate - Actualizar un paciente por ID
router.put('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;
    const { nombre, dni, email } = req.body;

    if (!nombre && !dni && !email) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const query = `
            UPDATE pacientes 
            SET nombre = COALESCE(?, nombre), 
                dni = COALESCE(?, dni), 
                email = COALESCE(?, email)
            WHERE id = ?
        `;
        const [result] = await db.query(query, [nombre, dni, email, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado para actualizar' });
        }
        
        res.status(200).json({ message: 'Paciente actualizado exitosamente' });

    } catch (error) {
        console.error("Error al actualizar paciente:", error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'El DNI ingresado para actualizar ya existe en otro paciente.' });
        }
        res.status(500).json({ message: 'Error al actualizar el paciente' });
    }
});

// [D]elete - Eliminar un paciente por ID
router.delete('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;

    try {
        // La restricción ON DELETE CASCADE debería manejar la eliminación de los turnos asociados.
        const query = 'DELETE FROM pacientes WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado para eliminar' });
        }

        res.status(200).json({ message: 'Paciente eliminado exitosamente' });

    } catch (error) {
        console.error("Error al eliminar paciente:", error);
        res.status(500).json({ message: 'Error al eliminar el paciente' });
    }
});


export default router;