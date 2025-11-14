// server.js
import express from 'express';
import 'dotenv/config'; 

import checkApiKey from './middlewares/checkApiKey.js';

import turnosRoutes from './routes/turnos.js';
import medicosRoutes from './routes/medicos.js';
import pacientesRoutes from './routes/pacientes.js';
import disponibilidadRoutes from './routes/disponibilidad.js';

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

// Rutas protegidas con API KEY
app.use('/api/turnos', checkApiKey, turnosRoutes);
app.use('/api/medicos', checkApiKey, medicosRoutes);
app.use('/api/pacientes', checkApiKey, pacientesRoutes);
app.use('/api/disponibilidad', checkApiKey, disponibilidadRoutes);

// Log de variables para debug
console.log("🔍 Variables cargadas:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASSWORD ? "OK" : "NO",
    db: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
});

