// routes/turnos.js
import express from 'express';
import db from '../db.js'; // Importa el pool de conexiones
import { checkApiKey } from '../middleware/auth.js';

const router = express.Router();

// ------------------------------------------------------------------
// ⭐ OPERACIONES CRUD para 'turnos'
// ------------------------------------------------------------------


// [R]ead - Obtener todos los turnos
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM turnos';
        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos' });
    }
});

// [R]ead - Obtener un turno por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'SELECT * FROM turnos WHERE id = ?';
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Turno no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el turno' });
    }
});


// [C]reate - Crear un nuevo turno
router.post('/', checkApiKey, async (req, res) => {
    const { medico_id, paciente_id, fecha, hora, estado } = req.body;
    
    // Validación básica
    if (!medico_id || !paciente_id || !fecha || !hora) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        const query = 'INSERT INTO turnos (medico_id, paciente_id, fecha, hora, estado) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [medico_id, paciente_id, fecha, hora, estado || 'pendiente']);
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Turno creado exitosamente' 
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') { // Maneja el CONSTRAINT turno_unico
            return res.status(409).json({ message: 'Ya existe un turno reservado para ese médico, fecha y hora.' });
        }
        res.status(500).json({ message: 'Error al crear el turno' });
    }
});

// [U]pdate - Actualizar un turno existente
router.put('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;
    const { medico_id, paciente_id, fecha, hora, estado } = req.body;

    // Validación básica para campos a actualizar
    if (!medico_id && !paciente_id && !fecha && !hora && !estado) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const query = `
            UPDATE turnos 
            SET medico_id = COALESCE(?, medico_id), 
                paciente_id = COALESCE(?, paciente_id), 
                fecha = COALESCE(?, fecha), 
                hora = COALESCE(?, hora), 
                estado = COALESCE(?, estado)
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [medico_id, paciente_id, fecha, hora, estado, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turno no encontrado para actualizar' });
        }
        
        res.status(200).json({ message: 'Turno actualizado exitosamente' });

    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La actualización viola la restricción de turno único.' });
        }
        res.status(500).json({ message: 'Error al actualizar el turno' });
    }
});

// [D]elete - Eliminar un turno
router.delete('/:id', checkApiKey, async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM turnos WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Turno no encontrado para eliminar' });
        }

        res.status(200).json({ message: 'Turno eliminado exitosamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el turno' });
    }
});


export default router;