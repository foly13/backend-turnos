import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

pool.getConnection()
    .then(conn => {
        console.log("✅ Conexión a la DB de Railway exitosa!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Error al conectar con la DB de Railway:", err.message);
    });

export default pool;
