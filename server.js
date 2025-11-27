// server.js
import express from 'express';
import 'dotenv/config';

// CORRECTO → carpeta "middleware" y archivo "auth.js"
import { checkApiKey } from './middleware/auth.js';
import excepcionesRoutes from './routes/excepciones.js';
import turnosRoutes from './routes/turnos.js';
import medicosRoutes from './routes/medicos.js';
import pacientesRoutes from './routes/pacientes.js';
import disponibilidadRoutes from './routes/disponibilidad.js';
import disponibilidadesRoutes from './routes/disponibilidades.js';
import { Telegraf } from 'telegraf'; 
import axios from 'axios';           // NECESARIO para llamadas internas

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔍 Ruta abierta SIN API KEY (para probar Railway)
app.get('/test', (req, res) => {
    res.json({ ok: true, message: "Servidor funcionando sin API Key" });
});

// Ruta raíz (también pública)
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
const bot = new Telegraf(BOT_TOKEN); // Pasa el token del .env

// 📢 RUTA DEL WEBHOOK DE TELEGRAM
// Este endpoint recibe todos los mensajes del bot.
app.post('/webhook/telegram', bot.webhookCallback('/webhook/telegram')); // Telegraf lo maneja internamente

// Log de variables para debug
console.log("🔍 Variables cargadas:", {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    pass: process.env.MYSQLPASSWORD ? "OK" : "NO",
    db: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

// IMPORTANTE: Debemos importar la lógica del bot *después* de inicializar 'bot'
import './routes/telegramLogic.js'; // ⬅️ Crearemos este archivo ahora

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
});
