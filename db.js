// db.js
import mysql from 'mysql2/promise';
import 'dotenv/config'; // Carga las variables de entorno

// Crea el pool de conexiones (más eficiente que una conexión simple)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Prueba la conexión al iniciar
pool.getConnection()
    .then(connection => {
        console.log("✅ Conexión a la DB de Railway exitosa!");
        connection.release(); // Libera la conexión
    })
    .catch(err => {
        console.error("❌ Error al conectar con la DB de Railway:", err.message);
    });

export default pool;