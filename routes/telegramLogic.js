// routes/telegramLogic.js
// Lógica que se registra en el bot (importado indirectamente a través de server.js)

// ⬅️ ¡CORRECCIÓN CLAVE: Importar la instancia activa del bot!
import { bot } from '../server.js'; 

import { getChatState, updateChatState } from '../services/chatState.js';
// Asegúrate de tener estas funciones importadas
import { findPacienteByDni, createPaciente } from '../services/pacienteService.js'; 
import { getTodasEspecialidades, getMedicosByEspecialidad } from '../services/medicoService.js';
// ⬅️ Importar las nuevas funciones de turno (se quita updateTurno)
import { createTurno, getTurnosActivosByPaciente, cancelTurno } from '../services/turnoService.js'; 
// 🚨 CORRECCIÓN CLAVE: Se añade la importación de la función para obtener horarios por día
import { getDisponibilidadProximosDias, getDiasDisponiblesByMedico } from '../services/disponibilidadService.js';

// Se mantiene esta función, pero cambiará su uso
const mainMenu = () => {
    // 🚨 Menú Modificado: Se quita 'Modificar Turno' y se cambia 'Cancelar' por 'Eliminar'
    return '¿Qué desea hacer?\n1. Solicitar Turno\n2. Ver Turnos Activos\n3. Eliminar Turno';
};

// ⬅️ ¡CORRECCIÓN CLAVE: Exportar una función que recibe el bot!
export function registerBotHandlers(bot) { 
    
    // --- HANDLERS DE COMANDOS ---
    bot.start(async (ctx) => {
        const chatID = ctx.chat.id;
        await updateChatState(chatID, { paso_actual: 1, data: {} }); 
        await ctx.reply('¡Hola! Bienvenido al Sistema de Turnos. Por favor, ingrese su DNI para empezar.');
    });

    // --- LÓGICA CENTRAL DE TEXTO ---
    bot.on('text', async (ctx) => {
        const chatID = ctx.chat.id;
        const mensaje = ctx.message.text.trim();
        
        try {
            const estado = await getChatState(chatID);
            let paso = estado.paso_actual;
            let data = estado.data;

            // --- PASO 1: ESPERANDO DNI ---
            if (paso === 1) {
                const dni = mensaje;
                const paciente = await findPacienteByDni(dni);

                if (paciente) {
                    await updateChatState(chatID, { paso_actual: 2, data: { ...data, paciente_id: paciente.id, nombre: paciente.nombre } });
                    await ctx.reply(`¡Hola, *${paciente.nombre}*! ${mainMenu()}`);
                } else {
                    await updateChatState(chatID, { paso_actual: 99, data: { ...data, dni_nuevo: dni } });
                    await ctx.reply(`❌ DNI ${dni} no encontrado. Ingrese su *Nombre y Apellido* para registrarse.`);
                }
            }
            
            // --- PASO 99: REGISTRO ---
            else if (paso === 99) {
                const nombreCompleto = mensaje;
                const dniNuevo = data.dni_nuevo;
                const nuevoPacienteId = await createPaciente(nombreCompleto, dniNuevo);

                await updateChatState(chatID, { paso_actual: 2, data: { paciente_id: nuevoPacienteId, nombre: nombreCompleto } });
                await ctx.reply(`✅ ¡Registro exitoso, ${nombreCompleto}! ${mainMenu()}`);
            }

           // --- PASO 2: ESPERANDO OPCIÓN DEL MENÚ ---
else if (paso === 2) {
    
    if (mensaje === '1') {
        // Lógica de listado de especialidades para SOLICITAR TURNO
        const especialidades = await getTodasEspecialidades(); 

        if (especialidades && especialidades.length > 0) {
            let listaEspecialidades = 'Por favor, elija la **especialidad** ingresando el **número** correspondiente:\n';
            const especialidadesMap = {};

            especialidades.forEach((esp, index) => {
                const num = index + 1;
                listaEspecialidades += `${num}. ${esp}\n`;
                especialidadesMap[num] = esp;
            });

            await updateChatState(chatID, { 
                paso_actual: 3, 
                data: { ...data, especialidades_map: especialidadesMap, accion_a_ejecutar: 'SOLICITAR' } // Se agrega SOLICITAR
            });
            await ctx.reply(listaEspecialidades);
            
        } else {
            await ctx.reply('❌ Lo sentimos, no hay especialidades disponibles en este momento. Intente más tarde o escriba /start.');
        }

    } 
    // 🚨 Opción 2 y 3: Ver Turnos Activos y Eliminar Turno
    else if (mensaje === '2' || mensaje === '3') {
        // Si es '2' -> VER (no cambia estado), si es '3' -> ELIMINAR (cambia a paso 6)
        const accion = mensaje === '2' ? 'VER' : 'ELIMINAR'; 
        const pacienteId = data.paciente_id;
        const turnosActivos = await getTurnosActivosByPaciente(pacienteId);

        if (turnosActivos.length === 0) {
            await ctx.reply('❌ No tiene turnos activos. Elija otra opción o /start.');
            return; 
        }

        let listaTurnos = `**Sus Turnos Activos:**\n\n`;
        const turnosActivosMap = {};
        
        turnosActivos.forEach((turno, index) => {
            const num = index + 1;
            const fechaHoraDisplay = `${turno.fecha_formateada} ${turno.hora_formateada}`;
            
            // Formato: 1. *Dra. López* (Clínica Médica) - 2025-12-03 15:00
            listaTurnos += `${num}. *${turno.medico_nombre}* (${turno.especialidad}) - ${fechaHoraDisplay}\n`;
            
            turnosActivosMap[num] = {
                id: turno.turno_id,
                medico_id: turno.medico_id,
                medico_nombre: turno.medico_nombre,
                fecha: turno.fecha_formateada, 
                hora: turno.hora_formateada
            };
        });
        
        // 🚨 Lógica de Ver vs. Eliminar
        if (accion === 'VER') {
            // Opción 2: Solo Muestra la lista y vuelve al menú
            await ctx.reply(listaTurnos);
            await updateChatState(chatID, { paso_actual: 2, data: data });
            await ctx.reply(`\n${mainMenu()}`); // Vuelve al menú principal
            return;
        } else {
            // Opción 3: Continúa para ELIMINAR/Cancelar
            listaTurnos += `\nPara ELIMINAR un turno, ingrese su número.`;
            
            await updateChatState(chatID, { 
                paso_actual: 6, // Paso Único para Seleccionar Turno para Eliminación
                data: { 
                    ...data, 
                    turnos_activos_map: turnosActivosMap, 
                    accion_a_ejecutar: 'ELIMINAR' // Solo se permite ELIMINAR (antes CANCELAR)
                } 
            });
            await ctx.reply(listaTurnos);
        }
        
    } else {
        await ctx.reply(`Opción inválida. ${mainMenu()}`);
    }
}
// --- PASO 3: ESPERANDO SELECCIÓN DE ESPECIALIDAD POR NÚMERO ---
// Se mantiene la lógica de solicitud
else if (paso === 3) {
    const numEspecialidad = parseInt(mensaje);
    const especialidadesMap = data.especialidades_map;

    // 1. Validar que el mensaje es un número y que está en el mapa
    if (isNaN(numEspecialidad) || !especialidadesMap || !especialidadesMap[numEspecialidad]) {
        await ctx.reply('❌ Opción inválida. Por favor, ingrese solo el número de la especialidad.');
        return;
    }
    
    const especialidadSeleccionada = especialidadesMap[numEspecialidad];

    // 2. Buscar médicos disponibles para esa especialidad
    const medicos = await getMedicosByEspecialidad(especialidadSeleccionada); 

    if (medicos && medicos.length > 0) {
        
        // 3. Construir la lista de médicos para el usuario
        let listaMedicos = `Médicos disponibles para **${especialidadSeleccionada}**:\n`;
        const medicosMap = {};
        
        medicos.forEach(medico => {
            listaMedicos += `${medico.id}. ${medico.nombre}\n`;
            medicosMap[medico.id] = { id: medico.id, nombre: medico.nombre }; // Guardamos el ID real de la DB y nombre
        });
        listaMedicos += `\nPor favor, ingrese el **número ID** del médico que desea elegir.`;

        // 4. Guarda la especialidad seleccionada, el mapa de médicos y avanza al paso 5
        await updateChatState(chatID, { 
            paso_actual: 5, // Avanzamos al Paso 5 (Selección de Médico)
            data: { 
                ...data, 
                especialidad: especialidadSeleccionada, 
                medicos_map: medicosMap // Guardamos el mapa de IDs de médicos
            }
        });

        await ctx.reply(listaMedicos);

    } else {
        // 5. Si no hay médicos disponibles
        await ctx.reply(`❌ Lo sentimos, no encontramos médicos para la especialidad "${especialidadSeleccionada}". Por favor, ingrese /start para volver al inicio.`);
    }
}
    
// --- PASO 5: ESPERANDO SELECCIÓN DE MÉDICO POR ID (¡NUEVO PROPÓSITO: antes era Paso 4!) ---
// La lógica para la selección de médico y listado de DÍAS (de solicitad turno) se mueve aquí.
else if (paso === 5) {
    const medicoId = parseInt(mensaje);
    const medicosMap = data.medicos_map;
    
    // 1. Validar la selección del médico
    if (isNaN(medicoId) || !medicosMap || !medicosMap[medicoId]) {
        await ctx.reply('❌ Por favor, ingrese un ID de médico válido de la lista anterior.');
        return;
    }

    const medicoSeleccionado = medicosMap[medicoId]; // { id: 1, nombre: 'Dr. Ejemplo' }
    const medicoNombre = medicoSeleccionado.nombre;

    // 2. Buscar DÍAS disponibles para el médico seleccionado
    const diasDisponibles = await getDiasDisponiblesByMedico(medicoId); 
    
    if (diasDisponibles.length > 0) {
        let listaDias = `Dr/a. *${medicoNombre}*. Elija el *número* del **DÍA** para su turno:\n\n`;
        const diasDispMap = {};
        
        diasDisponibles.forEach((dia, index) => {
            const num = index + 1;
            listaDias += `${num}. ${dia.fecha}\n`; // Solo se lista la fecha
            diasDispMap[num] = dia.fecha; 
        });

        // Guardamos los datos del médico y el mapa de DÍAS disponibles
        await updateChatState(chatID, { 
            paso_actual: 4, // ⬅️ CLAVE: Avanzamos al Paso 4 (Selección de DÍA, mantiene el nombre original)
            data: { 
                ...data, 
                medico_id: medicoId,
                medico_nombre: medicoNombre,
                dias_disp_map: diasDispMap // Guardamos el mapa de días
            }
        });
        
        await ctx.reply(listaDias);
        
    } else {
        await ctx.reply(`❌ El Dr/a. ${medicoNombre} no tiene días disponibles. Elija otra opción o escriba /start.`);
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
    }
}


// --- PASO 4: ESPERANDO SELECCIÓN DE DÍA PARA SOLICITAR TURNO (¡NUEVO PROPÓSITO: antes era Paso 5!)
else if (paso === 4) {
    const numDia = parseInt(mensaje);
    const diasDispMap = data.dias_disp_map;
    const medicoId = data.medico_id;
    
    if (isNaN(numDia) || !diasDispMap || !diasDispMap[numDia]) {
        await ctx.reply('❌ Por favor, ingrese un número de día válido de la lista.');
        return;
    }

    const fechaSeleccionada = diasDispMap[numDia];
    
    // 🚨 CORRECCIÓN CLAVE: Usamos la función de disponibilidad correcta importada
    const horarios = await getDisponibilidadProximosDias(medicoId, fechaSeleccionada);
    
    if (horarios && horarios.length > 0) {
        let listaHorarios = `Día ${fechaSeleccionada}. Elija el *número* del **horario**:\n`;
        const horariosMap = {};

        horarios.forEach((horario, index) => {
            const num = index + 1;
            listaHorarios += `${num}. ${horario.hora.substring(0, 5)}\n`;
            horariosMap[num] = horario.hora.substring(0, 5); // Almacena solo HH:MM
        });

        // Guardamos la fecha seleccionada y el mapa de horarios
        await updateChatState(chatID, { 
            paso_actual: 7, // ⬅️ CLAVE: Nuevo paso 7 para la selección final de hora y ejecución (antes era paso 4)
            data: { 
                ...data, 
                fecha_seleccionada: fechaSeleccionada, 
                horarios_map: horariosMap 
            } 
        });
        await ctx.reply(listaHorarios);
        
    } else {
        await ctx.reply('❌ No se encontraron horarios para ese día. Escriba /start.');
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
    }
}
// --- PASO 6: ESPERANDO SELECCIÓN DE TURNO PARA ELIMINAR/CANCELAR ---
else if (paso === 6) {
    const numTurno = parseInt(mensaje);
    const turnosActivosMap = data.turnos_activos_map;
    const accion = data.accion_a_ejecutar; // DEBE SER 'ELIMINAR'

    if (accion !== 'ELIMINAR' || isNaN(numTurno) || !turnosActivosMap || !turnosActivosMap[numTurno]) {
        await ctx.reply('❌ Por favor, ingrese un número de turno válido de la lista para ELIMINAR.');
        return;
    }

    const turnoSeleccionado = turnosActivosMap[numTurno];
    const turnoId = turnoSeleccionado.id;
    const medicoNombre = turnoSeleccionado.medico_nombre;

    // 1. PASO 8 (Confirmación de Eliminación)
    await updateChatState(chatID, { 
        paso_actual: 8, // Nuevo Paso: Ejecutar cancelación
        data: { 
            ...data, 
            turno_id_final: turnoId,
            turno_detalles_final: turnoSeleccionado // Guardamos los detalles para el mensaje final
        } 
    });
    await ctx.reply(`Confirmación: ¿Desea realmente **ELIMINAR** el turno con el Dr/a. ${medicoNombre} para el ${turnoSeleccionado.fecha} a las ${turnoSeleccionado.hora}? Responda SÍ para confirmar.`);
}

// --- PASO 7: ESPERANDO SELECCIÓN DE HORA PARA SOLICITAR TURNO (¡NUEVO!) ---
else if (paso === 7) {
    // Este paso maneja la selección final de hora para la SOLICITUD de turno.
    const numHora = parseInt(mensaje);
    const horariosMap = data.horarios_map;
    
    if (isNaN(numHora) || !horariosMap || !horariosMap[numHora]) {
        await ctx.reply('❌ Por favor, ingrese un número de horario válido de la lista.');
        return;
    }

    const horaSeleccionada = horariosMap[numHora];
    
    // Datos para crear el turno
    const turnoData = {
        paciente_id: data.paciente_id,
        medico_id: data.medico_id,
        fecha: data.fecha_seleccionada,
        hora: horaSeleccionada,
    };

    try {
        // ⬅️ Crear el Turno
        await createTurno(turnoData); 
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 

        await ctx.reply(`✅ ¡Turno confirmado con éxito!
*Dr/a. ${data.medico_nombre}* (${data.especialidad})
🗓 Fecha: ${data.fecha_seleccionada}
⌚️ Hora: ${horaSeleccionada}
Escriba /start para comenzar de nuevo.`);

    } catch (error) {
        console.error('❌ ERROR al crear el turno:', error);
        await ctx.reply('❌ Hubo un error al intentar reservar el turno. Por favor, intente de nuevo o escriba /start.');
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
    }
}


// --- PASO 8: ESPERANDO CONFIRMACIÓN DE ELIMINACIÓN (Mantiene la lógica de CANCELAR) ---
else if (paso === 8) {
    if (mensaje.toUpperCase() === 'SÍ' || mensaje.toUpperCase() === 'SI') {
        const turnoId = data.turno_id_final;
        const detalles = data.turno_detalles_final;

        try {
            await cancelTurno(turnoId); 
            await updateChatState(chatID, { paso_actual: 0, data: {} }); 
            
            await ctx.reply(`✅ El turno con el *Dr/a. ${detalles.medico_nombre}* para el ${detalles.fecha} a las ${detalles.hora} ha sido **ELIMINADO** con éxito. Escribe /start para comenzar de nuevo.`);

        } catch (error) {
            console.error('❌ ERROR al eliminar el turno:', error);
            await ctx.reply('❌ Hubo un error al intentar eliminar el turno. Por favor, intente de nuevo o escriba /start.');
            await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        }

    } else {
        // Si no dice SÍ, se cancela la acción.
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        await ctx.reply('🚫 Eliminación de turno abortada. Su turno no fue eliminado. Escriba /start para volver al menú.');
    }
}
            
            // ---Fin del flujo ---

        } catch (error) {
            console.error('Error general en bot.on(\'text\'):', error.message);
            await ctx.reply('⚠️ Lo siento, ocurrió un error interno en el sistema. Por favor, intenta /start de nuevo.');
        }
    });

    // Registrar el handler de mensajes no reconocidos (siempre al final)
    bot.on('message', async (ctx) => {
        try {
            const estado = await getChatState(ctx.chat.id);
            if (estado.paso_actual > 1 && estado.paso_actual !== 2) { // Permitir cualquier mensaje en el menú
                await ctx.reply(`Lo siento, no entendí tu respuesta. Por favor, ingresa el dato esperado o escribe /start para comenzar de nuevo.`);
            }
        } catch (error) {
            console.error('Error en bot.on(\'message\'):', error.message);
        }
    });
}