// routes/medicos.js
import express from 'express';
import db from '../db.js';
import { checkApiKey } from '../middleware/auth.js';

const router = express.Router();

// ------------------------------------------------------------------
// ⭐ OPERACIONES CRUD para 'medicos'
// ------------------------------------------------------------------

// [R]ead - Obtener todos los médicos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM medicos');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener médicos:", error);
        res.status(500).json({ message: 'Error al obtener la lista de médicos' });
    }
});
// [R]ead - Obtener un médico por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM medicos WHERE id = ?';
        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Médico no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener médico por ID:", error);
        res.status(500).json({ message: 'Error al obtener el médico' });
    }
});

// [C]reate - Crear un nuevo médico
router.post('/', checkApiKey, async (req, res) => {
    const { nombre, especialidad } = req.body;
    if (!nombre || !especialidad) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: nombre y especialidad' });
    }

    try {
        const query = 'INSERT INTO medicos (nombre, especialidad) VALUES (?, ?)';
        const [result] = await db.query(query, [nombre, especialidad]);
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Médico creado exitosamente' 
        });
    } catch (error) {
        console.error("Error al crear médico:", error);
        res.status(500).json({ message: 'Error al crear el médico' });
    }
});

// [U]pdate - Actualizar un médico por ID
router.put('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;
    const { nombre, especialidad } = req.body;

    if (!nombre && !especialidad) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const query = `
            UPDATE medicos 
            SET nombre = COALESCE(?, nombre), 
                especialidad = COALESCE(?, especialidad)
            WHERE id = ?
        `;
        const [result] = await db.query(query, [nombre, especialidad, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado para actualizar' });
        }
        
        res.status(200).json({ message: 'Médico actualizado exitosamente' });

    } catch (error) {
        console.error("Error al actualizar médico:", error);
        res.status(500).json({ message: 'Error al actualizar el médico' });
    }
});

// [D]elete - Eliminar un médico por ID
router.delete('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;

    try {
        // Nota: La restricción ON DELETE CASCADE en la tabla 'turnos' y 'disponibilidades'
        // se encargará de eliminar los registros relacionados.
        const query = 'DELETE FROM medicos WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Médico no encontrado para eliminar' });
        }

        res.status(200).json({ message: 'Médico eliminado exitosamente' });

    } catch (error) {
        console.error("Error al eliminar médico:", error);
        res.status(500).json({ message: 'Error al eliminar el médico' });
    }
});


export default router;