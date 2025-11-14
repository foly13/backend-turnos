import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
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
