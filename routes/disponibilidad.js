// routes/disponibilidad.js
import express from 'express';
import { getDisponibilidad } from '../services/disponibilidadService.js';

const router = express.Router();

/**
 * Endpoint para obtener la disponibilidad de un médico en una fecha específica.
 * URL: /api/disponibilidad/:medicoId/:fecha
 * Ejemplo: /api/disponibilidad/1/2025-11-10
 */
router.get('/:medicoId/:fecha', async (req, res) => {
    const { medicoId, fecha } = req.params;

    if (isNaN(parseInt(medicoId))) {
        return res.status(400).json({ message: 'El ID del médico debe ser un número válido.' });
    }
    // Simple validación de formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ message: 'El formato de la fecha debe ser YYYY-MM-DD.' });
    }

    try {
        const slotsDisponibles = await getDisponibilidad(medicoId, fecha);
        
        res.status(200).json({
            medico_id: parseInt(medicoId),
            fecha: fecha,
            slots_disponibles: slotsDisponibles
        });
    } catch (error) {
        console.error("Error en la ruta de disponibilidad:", error);
        res.status(500).json({ message: 'Error interno al calcular la disponibilidad.' });
    }
});

export default router;