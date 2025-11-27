// routes/telegramLogic.js
// Lógica que se registra en el bot (importado indirectamente a través de server.js)

// ⬅️ ¡CORRECCIÓN CLAVE: Importar la instancia activa del bot!
import { bot } from '../server.js'; 

import { getChatState, updateChatState } from '../services/chatState.js';
// Asegúrate de tener estas funciones importadas
import { findPacienteByDni, createPaciente } from '../services/pacienteService.js'; 
import { getMedicosByEspecialidad } from '../services/medicoService.js';
// import { getDisponibilidad } from '../services/disponibilidadService.js'; // Necesitarás este pronto

const mainMenu = () => {
    return '¿Qué desea hacer?\n1. Solicitar Turno\n2. Modificar Turno\n3. Cancelar Turno';
};

// ⬅️ ¡CORRECCIÓN CLAVE: Exportar una función que recibe el bot!
export function registerBotHandlers(bot) { 
    
    // --- HANDLERS DE COMANDOS ---
    bot.start(async (ctx) => {
        const chatID = ctx.chat.id;
        await updateChatState(chatID, { paso_actual: 1, data: {} }); 
        await ctx.reply('¡Hola! Bienvenido al Sistema de Turnos. Por favor, ingrese su **DNI** para empezar.');
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
                    await ctx.reply(`¡Hola, **${paciente.nombre}**! ${mainMenu()}`);
                } else {
                    await updateChatState(chatID, { paso_actual: 99, data: { ...data, dni_nuevo: dni } });
                    await ctx.reply(`❌ DNI ${dni} no encontrado. Ingrese su **Nombre y Apellido** para registrarse.`);
                }
            }
            
            // --- PASO 99: REGISTRO ---
            else if (paso === 99) {
                const nombreCompleto = mensaje;
                const dniNuevo = data.dni_nuevo;
                const nuevoPacienteId = await createPaciente(nombreCompleto, dniNuevo);

                await updateChatState(chatID, { paso_actual: 2, data: { paciente_id: nuevoPacienteId, nombre: nombreCompleto } });
                await ctx.reply(`✅ ¡Registro exitoso, **${nombreCompleto}**! ${mainMenu()}`);
            }

            // --- PASO 2: MENÚ PRINCIPAL ---
            else if (paso === 2) {
                if (mensaje === '1') {
                    await updateChatState(chatID, { paso_actual: 3, data: data });
                    await ctx.reply('Excelente. ¿Qué **especialidad** está buscando?');
                } else if (mensaje === '2' || mensaje === '3') {
                    await ctx.reply('Opción aún no implementada. Por favor, elija 1.');
                } else {
                    await ctx.reply(`Opción inválida. ${mainMenu()}`);
                }
            }
            
            // --- PASO 3: ESPERANDO ESPECIALIDAD ---
            else if (paso === 3) {
                const especialidad = mensaje;
                const medicos = await getMedicosByEspecialidad(especialidad);

                if (medicos && medicos.length > 0) {
                    let listaMedicos = `Médicos disponibles para **${especialidad}**:\n`;
                    medicos.forEach(medico => { listaMedicos += `${medico.id}. ${medico.nombre}\n`; });
                    listaMedicos += `\nPor favor, ingrese el **número ID** del médico que desea elegir.`;

                    await updateChatState(chatID, { paso_actual: 4, data: { ...data, especialidad: especialidad } });
                    await ctx.reply(listaMedicos);

                } else {
                    await ctx.reply(`❌ Lo sentimos, no encontramos médicos para la especialidad "${especialidad}". Por favor, ingrese otra especialidad o escriba /start.`);
                }
            }
            
            // --- PASO 4: ESPERANDO ID DEL MÉDICO ---
            else if (paso === 4) {
                const medicoId = parseInt(mensaje);
                if (isNaN(medicoId)) {
                    await ctx.reply('❌ Por favor, ingrese solo el número ID del médico.');
                    return;
                }
                
                // Simulación de disponibilidad: (DEBES REEMPLAZAR ESTO CON getDisponibilidad)
                const disponibilidad = [
                    'Lunes 2 de Dic - 09:00', 'Martes 3 de Dic - 11:00', 'Miércoles 4 de Dic - 15:30'
                ];
                
                if (disponibilidad.length > 0) {
                    let listaDisp = `Horarios disponibles (ingrese la fecha y hora - Ej: 2025-12-03 11:00):\n`;
                    disponibilidad.forEach(disp => { listaDisp += `• ${disp}\n`; });
                    
                    await updateChatState(chatID, { paso_actual: 5, data: { ...data, medico_id: medicoId } });
                    await ctx.reply(listaDisp);
                    
                } else {
                    await updateChatState(chatID, { paso_actual: 3, data: data });
                    await ctx.reply(`❌ El médico seleccionado no tiene horarios disponibles. Por favor, ingrese otra **especialidad** o /start.`);
                }
            }
            // --- Próximo Paso: 5 (Esperando Fecha y Hora) ---

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