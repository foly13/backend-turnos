import express from 'express';
import db from '../db.js';
import { checkApiKey } from '../middleware/auth.js';

const router = express.Router();

// ------------------------------------------------------------------
// ⭐ OPERACIONES CRUD para 'disponibilidades'
// ------------------------------------------------------------------

// [R]ead - Obtener todas las disponibilidades
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM disponibilidades');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener disponibilidades:", error);
        res.status(500).json({ message: 'Error al obtener la lista de disponibilidades' });
    }
});

// [C]reate - Crear una nueva disponibilidad regular
router.post('/', checkApiKey, async (req, res) => {
    const { medico_id, dia_semana, hora_inicio, hora_fin } = req.body;

    if (!medico_id || !dia_semana || !hora_inicio || !hora_fin) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: medico_id, dia_semana, hora_inicio, hora_fin' });
    }

    try {
        const query = `
            INSERT INTO disponibilidades (medico_id, dia_semana, hora_inicio, hora_fin) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [medico_id, dia_semana, hora_inicio, hora_fin]);

        res.status(201).json({
            id: result.insertId,
            message: 'Disponibilidad regular creada exitosamente'
        });

    } catch (error) {
        console.error("Error al crear disponibilidad:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe una disponibilidad para este médico en ese día de la semana.' });
        }
        res.status(500).json({ message: 'Error al crear la disponibilidad' });
    }
});

// [U]pdate - Actualizar una disponibilidad por ID
router.put('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;
    const { dia_semana, hora_inicio, hora_fin } = req.body;

    if (!dia_semana && !hora_inicio && !hora_fin) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const query = `
            UPDATE disponibilidades 
            SET dia_semana = COALESCE(?, dia_semana), 
                hora_inicio = COALESCE(?, hora_inicio), 
                hora_fin = COALESCE(?, hora_fin)
            WHERE id = ?
        `;
        const [result] = await db.query(query, [dia_semana, hora_inicio, hora_fin, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Disponibilidad no encontrada para actualizar' });
        }
        
        res.status(200).json({ message: 'Disponibilidad actualizada exitosamente' });

    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error);
         if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La actualización viola la restricción de disponibilidad única (mismo médico/día).' });
        }
        res.status(500).json({ message: 'Error al actualizar la disponibilidad' });
    }
});

// [D]elete - Eliminar una disponibilidad por ID
router.delete('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM disponibilidades WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Disponibilidad no encontrada para eliminar' });
        }

        res.status(200).json({ message: 'Disponibilidad eliminada exitosamente. El médico ya no tendrá ese horario semanal.' });

    } catch (error) {
        console.error("Error al eliminar disponibilidad:", error);
        res.status(500).json({ message: 'Error al eliminar la disponibilidad' });
    }
});

export default router;