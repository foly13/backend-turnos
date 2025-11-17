import express from 'express';
import db from '../db.js';
import { checkApiKey } from '../middleware/auth.js';

const router = express.Router();

// ------------------------------------------------------------------
// ⭐ OPERACIONES CRUD para 'excepciones_disponibilidad'
// ------------------------------------------------------------------

// [C]reate - Crear una nueva excepción
router.post('/', checkApiKey, async (req, res) => {
    // dni y hora_inicio/fin son opcionales si disponible es 0
    const { medico_id, fecha, disponible, hora_inicio, hora_fin } = req.body;

    if (!medico_id || !fecha || typeof disponible === 'undefined') {
        return res.status(400).json({ message: 'Faltan campos obligatorios: medico_id, fecha, y disponible' });
    }

    if (disponible === 1 && (!hora_inicio || !hora_fin)) {
        return res.status(400).json({ message: 'Si disponible es 1, debe especificar hora_inicio y hora_fin.' });
    }

    try {
        const query = `
            INSERT INTO excepciones_disponibilidad (medico_id, fecha, disponible, hora_inicio, hora_fin) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [medico_id, fecha, disponible, hora_inicio || null, hora_fin || null]);

        res.status(201).json({
            id: result.insertId,
            message: 'Excepción de disponibilidad creada exitosamente'
        });

    } catch (error) {
        console.error("Error al crear excepción:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe una excepción para este médico y fecha.' });
        }
        res.status(500).json({ message: 'Error al crear la excepción' });
    }
});

// [D]elete - Eliminar una excepción
router.delete('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM excepciones_disponibilidad WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Excepción no encontrada para eliminar' });
        }

        res.status(200).json({ message: 'Excepción eliminada exitosamente. El horario regular del médico se reactiva para esa fecha.' });

    } catch (error) {
        console.error("Error al eliminar excepción:", error);
        res.status(500).json({ message: 'Error al eliminar la excepción' });
    }
});

export default router;