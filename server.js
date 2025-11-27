// server.js
import express from 'express';
import 'dotenv/config';

// Importaciones de middleware y rutas
import { checkApiKey } from './middleware/auth.js';
import excepcionesRoutes from './routes/excepciones.js';
import turnosRoutes from './routes/turnos.js';
import medicosRoutes from './routes/medicos.js';
import pacientesRoutes from './routes/pacientes.js';
import disponibilidadRoutes from './routes/disponibilidad.js';
import disponibilidadesRoutes from './routes/disponibilidades.js';
import { Telegraf } from 'telegraf'; 
import axios from 'axios';           // NECESARIO para llamadas internas
// ⬅️ ¡CORRECCIÓN CLAVE: Importar la función de registro!
import { registerBotHandlers } from './routes/telegramLogic.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔍 Rutas de API
app.get('/test', (req, res) => {
    res.json({ ok: true, message: "Servidor funcionando sin API Key" });
});

app.get('/', (req, res) => {
    res.send('Servidor de Sistema de Turnos API');
});

// Rutas protegidas
app.use('/api/excepciones', checkApiKey, excepcionesRoutes);
app.use('/api/turnos', checkApiKey, turnosRoutes);
app.use('/api/medicos', checkApiKey, medicosRoutes);
app.use('/api/pacientes', checkApiKey, pacientesRoutes);
app.use('/api/disponibilidad', checkApiKey, disponibilidadRoutes);
app.use('/api/disponibilidades', checkApiKey, disponibilidadesRoutes);

// Inicialización de Telegraf
const BOT_TOKEN = process.env.BOT_TOKEN;
export const bot = new Telegraf(BOT_TOKEN); // ⬅️ ¡CORRECCIÓN CLAVE: SE EXPORTA EL BOT!

// 📢 RUTA DEL WEBHOOK DE TELEGRAM
// Este endpoint recibe todos los mensajes del bot.
app.post('/webhook/telegram', bot.webhookCallback('/webhook/telegram')); // Telegraf lo maneja internamente
// ⬅️ ¡CORRECCIÓN CLAVE: Llamar a la función DESPUÉS de crear 'bot'!
registerBotHandlers(bot);

// Log de variables para debug
console.log("🔍 Variables cargadas:", {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    pass: process.env.MYSQLPASSWORD ? "OK" : "NO",
    db: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});


// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
});