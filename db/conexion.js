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

        // Verificar la conexión
        this.pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error al conectar a la base de datos:', err);
            } else {
                console.log('Conexión a la base de datos establecida con éxito');
                connection.release();
            }
        });
    }

    /**
     * Ejecuta una consulta SQL con valores preparados (recomendado para seguridad).
     * @param {string} sql
     * @param {Array} valores
     * @returns {Promise<[Array, Array]>} Retorna una promesa con [filas, campos]
     */
    execute(sql, valores = []) {
        return new Promise((resolve, reject) => {
            // Asegúrate de que el callback tiene (error, resultados, fields)
            this.pool.execute(sql, valores, (error, resultados, fields) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return reject(error);
                }
                // ¡Aquí es donde se asegura que siempre se devuelve un array!
                resolve([resultados, fields]);
            });
        });
    }

    /**
     * Ejecuta una consulta SQL estándar (menos segura si no se sanitizan los valores).
     * @param {string} sql
     * @param {Array} valores
     * @returns {Promise<[Array, Array]>} Retorna una promesa con [filas, campos]
     */
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

    /**
     * Cierra el pool de conexiones.
     * @returns {Promise<void>}
     */
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