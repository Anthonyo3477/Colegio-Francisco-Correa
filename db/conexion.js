const mysql = require('mysql2');
require('dotenv').config();

class Conexion {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'colegio',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        this.pool.getConnection((err, connection) => {
            if (err) {
                console.error("Error en la conexión a la base de datos: ", err);
            } else {
                console.log("Conectado a la base de datos");
                connection.release();
            }
        });
    }

    execute(sql, valores = []) {
        return new Promise((resolve, reject) => {
            this.pool.execute(sql, valores, (error, resultados, fields) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return reject(error);
                }
                resolve([resultados, fields]);
            });
        });
    }

    query(sql, valores = []) {
        return new Promise((resolve, reject) => {
            this.pool.query(sql, valores, (error, resultados, fields) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return reject(error);
                }
                resolve([resultados, fields]);
            });
        });
    }

    cerrarConexion() {
        return new Promise((resolve, reject) => {
            this.pool.end(err => {
                if (err) {
                    console.error('Error al cerrar la conexión:', err);
                    return reject(err);
                }
                console.log('Conexión a la base de datos cerrada con éxito');
                resolve();
            });
        });
    }
}

module.exports = new Conexion();