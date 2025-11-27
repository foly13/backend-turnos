// routes/telegramLogic.js
// Lógica que se registra en el bot (importado indirectamente a través de server.js)

// ⬅️ ¡CORRECCIÓN CLAVE: Importar la instancia activa del bot!
import { bot } from '../server.js'; 

import { getChatState, updateChatState } from '../services/chatState.js';
// Asegúrate de tener estas funciones importadas
import { findPacienteByDni, createPaciente } from '../services/pacienteService.js'; 
import { getMedicosByEspecialidad } from '../services/medicoService.js';
import { getTodasEspecialidades, getMedicosByEspecialidad } from '../services/medicoService.js';
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

           // --- PASO 2: ESPERANDO OPCIÓN DEL MENÚ ---
else if (paso === 2) {
    if (mensaje === '1') {
        // Lógica de listado de especialidades
        const especialidades = await getTodasEspecialidades(); // ⬅️ Obtiene todas las especialidades

        if (especialidades && especialidades.length > 0) {
            let listaEspecialidades = 'Por favor, elija la **especialidad** ingresando el **número** correspondiente:\n';
            
            // Creamos un mapa (Diccionario) para guardar especialidad por número
            const especialidadesMap = {};

            especialidades.forEach((esp, index) => {
                const num = index + 1;
                listaEspecialidades += `${num}. ${esp}\n`;
                especialidadesMap[num] = esp; // Asocia el número con el nombre real
            });

            // Guarda el mapa en el estado, y avanza al paso 3
            await updateChatState(chatID, { 
                paso_actual: 3, // Nuevo Paso: Esperando la selección de especialidad
                data: { ...data, especialidades_map: especialidadesMap } 
            });
            await ctx.reply(listaEspecialidades);
            
        } else {
            // Si no hay especialidades disponibles
            await ctx.reply('❌ Lo sentimos, no hay especialidades disponibles en este momento. Intente más tarde o escriba /start.');
        }

    } else if (mensaje === '2' || mensaje === '3') {
        await ctx.reply('Opción aún no implementada. Por favor, elija 1.');
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
    
// --- PASO 4: ESPERANDO ID DEL MÉDICO (Modificado) ---
else if (paso === 4) {
    const medicoId = parseInt(mensaje);
    const medicosMap = data.medicos_map;
    
    // 1. Validar que el mensaje es un número y que el médico existe en el mapa
    if (isNaN(medicoId) || !medicosMap || !medicosMap[medicoId]) {
        await ctx.reply('❌ Por favor, ingrese un número ID de médico válido de la lista anterior.');
        return;
    }
    
    // 2. Buscar Disponibilidad (Esta parte sigue con la simulación)
    // Debes reemplazar esta simulación con tu llamada a getDisponibilidad(medicoId) REAL
    
    const disponibilidad = [
        'Lunes 2 de Dic - 09:00',
        'Martes 3 de Dic - 11:00',
        'Miércoles 4 de Dic - 15:30'
    ];
    
    if (disponibilidad.length > 0) {
        let listaDisp = `Horarios disponibles para el Dr/a. ${medicosMap[medicoId]}. Ingrese la fecha y hora (Ej: 2025-12-03 11:00):\n`;
        disponibilidad.forEach(disp => {
            listaDisp += `• ${disp}\n`;
        });
        
        // 3. Guarda el ID del médico y avanza al paso 5 (Esperando Fecha/Hora)
        await updateChatState(chatID, { 
            paso_actual: 5, 
            data: { ...data, medico_id: medicoId } // data ya tiene paciente_id y especialidad
        });
        
        await ctx.reply(listaDisp);
        
    } else {
        // Si no hay horarios disponibles, regresamos al paso de especialidad
        await updateChatState(chatID, { paso_actual: 3, data: { ...data, medicos_map: undefined } }); // Limpiamos el mapa de médicos y volvemos a pedir especialidad
        await ctx.reply(`❌ El médico seleccionado no tiene horarios disponibles. Por favor, elija otra especialidad o /start.`);
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