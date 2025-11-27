// routes/telegramLogic.js
// Lógica que se registra en el bot (importado indirectamente a través de server.js)

// ⬅️ ¡CORRECCIÓN CLAVE: Importar la instancia activa del bot!
import { bot } from '../server.js'; 

import { getChatState, updateChatState } from '../services/chatState.js';
// Asegúrate de tener estas funciones importadas
import { findPacienteByDni, createPaciente } from '../services/pacienteService.js'; 
import { getMedicosByEspecialidad } from '../services/medicoService.js';
// import { getDisponibilidad } from '../services/disponibilidadService.js'; // Necesitarás este pronto

// --- UTILS ---
const mainMenu = () => {
    return '¿Qué desea hacer?\n1. Solicitar Turno\n2. Modificar Turno\n3. Cancelar Turno';
};

// --- HANDLERS DE COMANDOS ---

bot.start(async (ctx) => { // ⬅️ CORREGIDO: USAR 'bot.start'
    const chatID = ctx.chat.id;

    // Reinicia y avanza al paso 1: Esperando DNI
    await updateChatState(chatID, { paso_actual: 1, data: {} }); 

    await ctx.reply('¡Hola! Bienvenido al Sistema de Turnos. Por favor, ingrese su **DNI** para empezar.');
});


// --- LÓGICA CENTRAL DE TEXTO ---

bot.on('text', async (ctx) => { // ⬅️ CORREGIDO: USAR 'bot.on'
    const chatID = ctx.chat.id;
    const mensaje = ctx.message.text.trim();
    
    // Añade manejo de errores general para debug si algo falla en la DB
    try {
        const estado = await getChatState(chatID);
        let paso = estado.paso_actual;
        let data = estado.data;

        // --- PASO 1: ESPERANDO DNI ---
        if (paso === 1) {
            // ... [Toda la lógica del Paso 1] ...
            const dni = mensaje;
            const paciente = await findPacienteByDni(dni);

            if (paciente) {
                await updateChatState(chatID, { 
                    paso_actual: 2, 
                    data: { ...data, paciente_id: paciente.id, nombre: paciente.nombre }
                });
                await ctx.reply(`¡Hola, **${paciente.nombre}**! ${mainMenu()}`);
            } else {
                await updateChatState(chatID, { 
                    paso_actual: 99, 
                    data: { ...data, dni_nuevo: dni }
                });
                await ctx.reply(`❌ DNI ${dni} no encontrado. Ingrese su **Nombre y Apellido** para registrarse.`);
            }
        }
        
        // --- PASO 99: ESPERANDO NOMBRE Y APELLIDO (Registro) ---
        else if (paso === 99) {
            // ... [Toda la lógica del Paso 99] ...
            const nombreCompleto = mensaje;
            const dniNuevo = data.dni_nuevo;
            
            // Asumiendo que createPaciente devuelve el ID
            const nuevoPacienteId = await createPaciente(nombreCompleto, dniNuevo);

            await updateChatState(chatID, { 
                paso_actual: 2, 
                data: { paciente_id: nuevoPacienteId, nombre: nombreCompleto }
            });

            await ctx.reply(`✅ ¡Registro exitoso, **${nombreCompleto}**! ${mainMenu()}`);
        }


        // --- PASO 2: ESPERANDO OPCIÓN DEL MENÚ ---
        else if (paso === 2) {
            // ... [Toda la lógica del Paso 2] ...
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
            // ... [Toda la lógica del Paso 3] ...
            const especialidad = mensaje;
            
            // 1. Buscar médicos disponibles para esa especialidad
            const medicos = await getMedicosByEspecialidad(especialidad);

            if (medicos && medicos.length > 0) {
                
                // 2. Construir la lista para el usuario
                let listaMedicos = `Médicos disponibles para **${especialidad}**:\n`;
                
                medicos.forEach(medico => {
                    listaMedicos += `${medico.id}. ${medico.nombre}\n`;
                });
                listaMedicos += `\nPor favor, ingrese el **número ID** del médico que desea elegir.`;

                // 3. Guarda la especialidad seleccionada y avanza al paso 4
                await updateChatState(chatID, { 
                    paso_actual: 4, 
                    data: { ...data, especialidad: especialidad }
                });

                await ctx.reply(listaMedicos);

            } else {
                // 4. Si no hay médicos disponibles
                await ctx.reply(`❌ Lo sentimos, no encontramos médicos para la especialidad "${especialidad}". Por favor, ingrese otra especialidad o escriba /start.`);
            }
        }
        // --- PASO 4: ESPERANDO ID DEL MÉDICO ---
        else if (paso === 4) {
            // ... [Toda la lógica del Paso 4] ...
            // 1. Validar que el mensaje es un número
            const medicoId = parseInt(mensaje);
            if (isNaN(medicoId)) {
                await ctx.reply('❌ Por favor, ingrese solo el número ID del médico.');
                return; // Detiene la ejecución
            }
            
            // 2. Buscar Disponibilidad
            // Necesitas un nuevo servicio (getDisponibilidad) que consulte la tabla 'disponibilidad'.
            
            // Simulación de disponibilidad:
            const disponibilidad = [
                'Lunes 2 de Dic - 09:00',
                'Martes 3 de Dic - 11:00',
                'Miércoles 4 de Dic - 15:30'
            ];
            
            if (disponibilidad.length > 0) {
                let listaDisp = `Horarios disponibles (ingrese la fecha y hora - Ej: 2025-12-03 11:00):\n`;
                disponibilidad.forEach(disp => {
                    listaDisp += `• ${disp}\n`;
                });
                
                // 4. Guarda el ID del médico y avanza al paso 5
                await updateChatState(chatID, { 
                    paso_actual: 5, 
                    data: { ...data, medico_id: medicoId } // data ya tiene paciente_id y especialidad
                });
                
                await ctx.reply(listaDisp);
                
            } else {
                // Si no hay horarios disponibles
                await updateChatState(chatID, { paso_actual: 3, data: data }); // Regresa al paso de especialidad
                await ctx.reply(`❌ El médico seleccionado no tiene horarios disponibles. Por favor, ingrese otra **especialidad** o /start.`);
            }
        }
    } catch (error) {
        console.error('Error general en bot.on(\'text\'):', error.message);
        // Si hay un error de conexión a la DB, esto lo notificará
        await ctx.reply('⚠️ Lo siento, ocurrió un error interno en el sistema. Por favor, intenta /start de nuevo.');
    }
});

// Registrar el handler de mensajes no reconocidos (siempre al final)
bot.on('message', async (ctx) => { // ⬅️ CORREGIDO: USAR 'bot.on'
    // Si el mensaje llegó aquí, no fue manejado por ninguno de los pasos.
    try {
        const estado = await getChatState(ctx.chat.id);
        if (estado.paso_actual > 1) {
            await ctx.reply(`Lo siento, no entendí tu respuesta. Por favor, ingresa el dato esperado o escribe /start para comenzar de nuevo.`);
        }
    } catch (error) {
        console.error('Error en bot.on(\'message\'):', error.message);
    }
});