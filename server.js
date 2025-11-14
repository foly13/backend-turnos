// server.js
import express from 'express';
import 'dotenv/config'; 
import turnosRoutes from './routes/turnos.js'; // Importa las rutas de turnos
import medicosRoutes from './routes/medicos.js';
import pacientesRoutes from './routes/pacientes.js';
import disponibilidadRoutes from './routes/disponibilidad.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Permite a Express leer JSON en el cuerpo de las peticiones

// Rutas
app.get('/', (req, res) => {
    res.send('Servidor de Sistema de Turnos API');
});
app.use('/api/turnos', turnosRoutes); // Usa el prefijo /api/turnos para las rutas
app.use('/api/medicos', medicosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
});
