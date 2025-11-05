// services/disponibilidadService.js
import db from '../db.js';

// Duración de cada turno en minutos
const DURACION_TURNO_MINUTOS = 30; 

/**
 * Convierte un número de día (0=Domingo a 6=Sábado) a la cadena ENUM de MySQL.
 * @param {number} day - Número del día de la semana.
 * @returns {string} - Nombre del día en español.
 */
function getDiaSemanaNombre(day) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[day];
}

/**
 * Genera la lista de slots de 30 minutos dentro de un rango de tiempo.
 * @param {string} horaInicio - 'HH:MM:SS'
 * @param {string} horaFin - 'HH:MM:SS'
 * @param {string[]} turnosReservados - Array de horas 'HH:MM:SS' ya ocupadas.
 * @returns {string[]} - Array de slots disponibles 'HH:MM:SS'.
 */
function generarSlots(horaInicio, horaFin, turnosReservados) {
    const slotsDisponibles = [];
    const inicio = new Date(`2000/01/01 ${horaInicio}`);
    const fin = new Date(`2000/01/01 ${horaFin}`);
    let actual = inicio;

    while (actual < fin) {
        // Formato HH:MM:SS
        const slotHora = actual.toTimeString().split(' ')[0]; 

        // Si la hora actual NO está en los turnos reservados, es disponible
        if (!turnosReservados.includes(slotHora)) {
            slotsDisponibles.push(slotHora.substring(0, 5)); // Solo HH:MM
        }

        // Avanzar al siguiente slot
        actual.setMinutes(actual.getMinutes() + DURACION_TURNO_MINUTOS);
    }

    return slotsDisponibles;
}

/**
 * Obtiene los slots de disponibilidad para un médico y una fecha dados.
 */
export async function getDisponibilidad(medicoId, fecha) {
    const date = new Date(fecha + 'T00:00:00'); // Asegura la zona horaria correcta
    const diaSemana = getDiaSemanaNombre(date.getDay());
    
    // 1. Obtener turnos ya reservados para esa fecha
    const [turnos] = await db.query(
        'SELECT hora FROM turnos WHERE medico_id = ? AND fecha = ? AND estado <> "cancelado"', 
        [medicoId, fecha]
    );
    const turnosReservados = turnos.map(t => t.hora.toString());

    // 2. Revisar si hay excepción (anula el horario regular)
    const [excepciones] = await db.query(
        'SELECT disponible, hora_inicio, hora_fin FROM excepciones_disponibilidad WHERE medico_id = ? AND fecha = ?',
        [medicoId, fecha]
    );

    let rangoHorario = null;
    
    if (excepciones.length > 0) {
        const excepcion = excepciones[0];
        
        if (excepcion.disponible === 0) {
            // Caso 1: No atiende ese día (FALSE)
            return []; 
        } else {
            // Caso 2: Atiende en un horario especial (TRUE)
            rangoHorario = { inicio: excepcion.hora_inicio, fin: excepcion.hora_fin };
        }

    } else {
        // 3. Si no hay excepción, buscar horario regular
        const [disponibilidadRegular] = await db.query(
            'SELECT hora_inicio, hora_fin FROM disponibilidades WHERE medico_id = ? AND dia_semana = ?',
            [medicoId, diaSemana]
        );

        if (disponibilidadRegular.length === 0) {
            // Caso 3: No tiene horario regular para ese día
            return [];
        }

        // Caso 4: Usa el horario regular
        rangoHorario = { 
            inicio: disponibilidadRegular[0].hora_inicio, 
            fin: disponibilidadRegular[0].hora_fin 
        };
    }

    // 4. Generar slots disponibles a partir del rango horario
    if (rangoHorario && rangoHorario.inicio && rangoHorario.fin) {
        return generarSlots(rangoHorario.inicio, rangoHorario.fin, turnosReservados);
    }

    return [];
}