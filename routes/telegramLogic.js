// routes/telegramLogic.js
// Lógica que se registra en el bot (importado indirectamente a través de server.js)

// ⬅️ ¡CORRECCIÓN CLAVE: Importar la instancia activa del bot!
import { bot } from '../server.js'; 

import { getChatState, updateChatState } from '../services/chatState.js';
// Asegúrate de tener estas funciones importadas
import { findPacienteByDni, createPaciente } from '../services/pacienteService.js'; 
import { getTodasEspecialidades, getMedicosByEspecialidad } from '../services/medicoService.js';
// import { getDisponibilidad } from '../services/disponibilidadService.js'; // Necesitarás este pronto
import { getDisponibilidadProximosDias } from '../services/disponibilidadService.js'; 
// ⬅️ Importar las nuevas funciones de turno
import { createTurno, getTurnosActivosByPaciente, updateTurno, cancelTurno } from '../services/turnoService.js';
const mainMenu = () => {
    return '¿Qué desea hacer?\n1. Solicitar Turno\n2. Modificar Turno\n3. Cancelar Turno';
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
// --- PASO 2: ESPERANDO OPCIÓN DEL MENÚ (CORREGIDO) ---
else if (paso === 2) {
    
    if (mensaje === '1') {
        // Lógica de listado de especialidades
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
                data: { ...data, especialidades_map: especialidadesMap } 
            });
            await ctx.reply(listaEspecialidades);
            
        } else {
            await ctx.reply('❌ Lo sentimos, no hay especialidades disponibles en este momento. Intente más tarde o escriba /start.');
        }

    } 
    
    // El bloque para las opciones 2 y 3 empieza aquí con 'else if'
    else if (mensaje === '2' || mensaje === '3') {
        const accion = mensaje === '2' ? 'MODIFICAR' : 'CANCELAR';
        const pacienteId = data.paciente_id;
        const turnosActivos = await getTurnosActivosByPaciente(pacienteId);

        if (turnosActivos.length === 0) {
            await ctx.reply('❌ No tiene turnos activos para modificar o cancelar. Elija otra opción o /start.');
            return; // Termina la función aquí si no hay turnos
        }

        // Se usa el mismo formato de listado para ambas acciones
        let listaTurnos = `Sus turnos activos. Elija el número del turno que desea ${accion}:\n\n`;
        const turnosActivosMap = {};
        
        turnosActivos.forEach((turno, index) => {
            const num = index + 1;
           // ⬅️ CORRECCIÓN CLAVE DE FECHA/HORA: Aseguramos que solo mostramos la fecha (turno.fecha) y 
            // ⬅️ CLAVE: Usar los campos formateados del servicio
            const fechaHoraDisplay = `${turno.fecha_formateada} ${turno.hora_formateada}`;
            
            // Formato: 1. *Dra. López* (Clínica Médica) - 2025-12-03 15:00
            listaTurnos += `${num}. *${turno.medico_nombre}* (${turno.especialidad}) - ${fechaHoraDisplay}\n`;
            
            // Guardamos todos los datos relevantes para el siguiente paso
            turnosActivosMap[num] = {
                id: turno.turno_id,
                medico_id: turno.medico_id,
                medico_nombre: turno.medico_nombre,
                fecha: turno.fecha_formateada, 
                hora: turno.hora_formateada
            };
        });

        await updateChatState(chatID, { 
            paso_actual: 6, // Paso Único para Seleccionar Turno
            data: { 
                ...data, 
                turnos_activos_map: turnosActivosMap, 
                accion_a_ejecutar: accion // Guardamos si es MODIFICAR o CANCELAR
            } 
        });

        // Corregir negrita de **número** y **ACCION** para Telegram
        // listaTurnos = listaTurnos.replace(/\*\*/g, '*'); // Descomentar si usas markdown simple
        
        await ctx.reply(listaTurnos);
        
    } else {
        await ctx.reply(`Opción inválida. ${mainMenu()}`);
    }
}
// --- PASO 3: ESPERANDO SELECCIÓN DE ESPECIALIDAD POR NÚMERO ---
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
            medicosMap[medico.id] = medico.nombre; // Guardamos el ID real de la DB
        });
        listaMedicos += `\nPor favor, ingrese el **número ID** del médico que desea elegir.`;

        // 4. Guarda la especialidad seleccionada, el mapa de médicos y avanza al paso 4
        await updateChatState(chatID, { 
            paso_actual: 4, // Avanzamos a la espera de Médico ID
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
    
// --- PASO 4: ESPERANDO ID DEL MÉDICO (¡IMPLEMENTACIÓN REAL DE DISPONIBILIDAD!) ---
else if (paso === 4) {
    const medicoId = parseInt(mensaje);
    const medicosMap = data.medicos_map;
    
    // 1. Validar que el mensaje es un número y que el médico existe en el mapa
    if (isNaN(medicoId) || !medicosMap || !medicosMap[medicoId]) {
        await ctx.reply('❌ Por favor, ingrese un número ID de médico válido de la lista anterior.');
        return;
    }

    const medicoNombre = medicosMap[medicoId];
    
    // 2. Obtener Disponibilidad REAL para los próximos 7 días
    const disponibilidadDias = await getDisponibilidadProximosDias(medicoId); 
    
    if (disponibilidadDias.length > 0) {
        let listaDisp = `Horarios disponibles para el Dr/a. *${medicoNombre}*. Por favor, elija un **número**:\n`;
        const turnosMap = {};
        let contador = 1;

        disponibilidadDias.forEach(dia => {
            dia.horarios.forEach(hora => {
                // Muestra: 1. Lunes 2025-12-01 - 09:00
                const fechaHoraStr = `${dia.diaSemana} ${dia.fecha} - ${hora}`; 
                listaDisp += `${contador}. ${fechaHoraStr}\n`;
                
                // Guardamos el objeto completo del turno para el Paso 5
                turnosMap[contador] = { fecha: dia.fecha, hora: hora }; 
                contador++;
            });
        });

        // 3. Guarda el ID del médico y el mapa de turnos, y avanza al paso 5
        await updateChatState(chatID, { 
            paso_actual: 5, 
            data: { 
                ...data, 
                medico_id: medicoId, // Ya tenemos paciente_id y especialidad
                turnos_map: turnosMap // Guardamos el mapa de turnos disponibles
            }
        });
        
        await ctx.reply(listaDisp);
        
    } else {
        // Si no hay horarios disponibles
        await updateChatState(chatID, { paso_actual: 3, data: data }); 
        await ctx.reply(`❌ El médico ${medicoNombre} no tiene horarios disponibles en los próximos días. Elija otra especialidad o /start.`);
    }
}

// --- PASO 5: ESPERANDO SELECCIÓN FINAL DE TURNO POR NÚMERO (¡NUEVO!) ---
else if (paso === 5) {
    const numTurno = parseInt(mensaje);
    const turnosMap = data.turnos_map;
    
    // 1. Validar la selección del turno
    if (isNaN(numTurno) || !turnosMap || !turnosMap[numTurno]) {
        await ctx.reply('❌ Por favor, ingrese un número de turno válido de la lista anterior.');
        return;
    }

    const turnoSeleccionado = turnosMap[numTurno];
    
    // 2. Lógica de Reserva REAL
    const { paciente_id, medico_id } = data;
    const fecha = turnoSeleccionado.fecha;
    const hora = turnoSeleccionado.hora;

    try {
        await createTurno(medico_id, paciente_id, fecha, hora); 
        
        // 3. Finalizar la conversación y limpiar el estado
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        
        await ctx.reply(`✅ ¡Turno reservado con éxito para el ${fecha} a las ${hora}! Escribe /start para comenzar de nuevo.`);

    } catch (error) {
        console.error('❌ ERROR al crear el turno:', error);
        await ctx.reply('❌ Hubo un error al intentar reservar el turno. Por favor, intente de nuevo o escriba /start.');
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
    }
}
// --- PASO 6: ESPERANDO SELECCIÓN DE TURNO PARA MODIFICAR/CANCELAR ---
else if (paso === 6) {
    const numTurno = parseInt(mensaje);
    const turnosActivosMap = data.turnos_activos_map;
    const accion = data.accion_a_ejecutar; // MODIFICAR o CANCELAR

    if (isNaN(numTurno) || !turnosActivosMap || !turnosActivosMap[numTurno]) {
        await ctx.reply('❌ Por favor, ingrese un número de turno válido de la lista.');
        return;
    }

    const turnoSeleccionado = turnosActivosMap[numTurno];
    const turnoId = turnoSeleccionado.id;
    const medicoId = turnoSeleccionado.medico_id;
    const medicoNombre = turnoSeleccionado.medico_nombre;

    // 1. SI LA ACCIÓN ES CANCELAR (Paso 8)
    if (accion === 'CANCELAR') {
        // Preparamos los datos finales y vamos directo al paso 8 (ejecución)
        await updateChatState(chatID, { 
            paso_actual: 8, // Nuevo Paso: Ejecutar cancelación
            data: { 
                ...data, 
                turno_id_final: turnoId,
                turno_detalles_final: turnoSeleccionado // Guardamos los detalles para el mensaje final
            } 
        });
        await ctx.reply(`Confirmación: ¿Desea realmente CANCELAR el turno con el Dr/a. ${medicoNombre} para el ${turnoSeleccionado.fecha} a las ${turnoSeleccionado.hora}? Responda SÍ para confirmar.`);
    } 
    
    // 2. SI LA ACCIÓN ES MODIFICAR (Paso 7)
    else if (accion === 'MODIFICAR') {
        // Buscar nueva disponibilidad para el médico (igual que en el flujo anterior)
        const disponibilidadDias = await getDisponibilidadProximosDias(medicoId); 
        
        if (disponibilidadDias.length > 0) {
            let listaDisp = `Modificando turno con el *Dr/a. ${medicoNombre}*. Elija el nuevo **número** de horario:\n`;
            const nuevaDispMap = {};
            let contador = 1;

            disponibilidadDias.forEach(dia => {
                dia.horarios.forEach(hora => {
                    const fechaHoraStr = `${dia.diaSemana} ${dia.fecha} - ${hora}`; 
                    listaDisp += `${contador}. ${fechaHoraStr}\n`;
                    nuevaDispMap[contador] = { fecha: dia.fecha, hora: hora }; 
                    contador++;
                });
            });
            
            await updateChatState(chatID, { 
                paso_actual: 7, // Nuevo Paso: Esperando la nueva hora
                data: { 
                    ...data, 
                    turno_id_modificar: turnoId,
                    medico_id: medicoId,
                    nueva_disp_map: nuevaDispMap
                }
            });
            
            // Corregir negrita de **número**
            listaDisp = listaDisp.replace(/\*\*/g, '*');
            await ctx.reply(listaDisp);
            
        } else {
            await ctx.reply(`❌ El médico ${medicoNombre} no tiene nuevos horarios disponibles. Escriba /start.`);
            await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        }
    }
}

// --- PASO 7: ESPERANDO NUEVA SELECCIÓN DE HORARIO ---
else if (paso === 7) {
    const numNuevaDisp = parseInt(mensaje);
    const nuevaDispMap = data.nueva_disp_map;
    
    if (isNaN(numNuevaDisp) || !nuevaDispMap || !nuevaDispMap[numNuevaDisp]) {
        await ctx.reply('❌ Por favor, ingrese un número de horario válido de la lista anterior.');
        return;
    }

    const turnoId = data.turno_id_modificar;
    const nuevaSeleccion = nuevaDispMap[numNuevaDisp];
    const nuevaFecha = nuevaSeleccion.fecha;
    const nuevaHora = nuevaSeleccion.hora;

    try {
        // 1. Ejecutar la modificación en la DB
        await updateTurno(turnoId, nuevaFecha, nuevaHora); 
        
        // 2. Finalizar
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        
        await ctx.reply(`✅ Turno *${turnoId}* modificado con éxito para el ${nuevaFecha} a las ${nuevaHora}. Escribe /start para comenzar de nuevo.`);

    } catch (error) {
        console.error('❌ ERROR al modificar el turno:', error);
        await ctx.reply('❌ Hubo un error al intentar modificar el turno. Por favor, intente de nuevo o escriba /start.');
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
    }
}
// --- PASO 8: ESPERANDO SELECCIÓN DE TURNO PARA CANCELACIÓN (¡NUEVO!) -
else if (paso === 8) {
    if (mensaje.toUpperCase() === 'SÍ' || mensaje.toUpperCase() === 'SI') {
        const turnoId = data.turno_id_final;
        const detalles = data.turno_detalles_final;

        try {
            await cancelTurno(turnoId); 
            await updateChatState(chatID, { paso_actual: 0, data: {} }); 
            
            await ctx.reply(`✅ El turno con el *Dr/a. ${detalles.medico_nombre}* para el ${detalles.fecha} a las ${detalles.hora} ha sido **CANCELADO** con éxito. Escribe /start para comenzar de nuevo.`);

        } catch (error) {
            console.error('❌ ERROR al cancelar el turno:', error);
            await ctx.reply('❌ Hubo un error al intentar cancelar el turno. Por favor, intente de nuevo o escriba /start.');
            await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        }

    } else {
        // Si no dice SÍ, se cancela la acción.
        await updateChatState(chatID, { paso_actual: 0, data: {} }); 
        await ctx.reply('🚫 Cancelación de turno abortada. Su turno no fue modificado. Escriba /start para volver al menú.');
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
            if (estado.paso_actual > 1) {
                await ctx.reply(`Lo siento, no entendí tu respuesta. Por favor, ingresa el dato esperado o escribe /start para comenzar de nuevo.`);
            }
        } catch (error) {
            console.error('Error en bot.on(\'message\'):', error.message);
        }
    });
}