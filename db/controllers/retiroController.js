const conn = require('../dbConnection');
const TABLA = 'retiros';

// Crear retiro
async function createRetiro(retiro) {
    const {
        nombre_retiro, rut_retiro, parentesco_retiro, alumno_id } = retiro;

    const sql = `
        INSERT INTO ${TABLA} 
        (nombre_retiro, rut_retiro, parentesco_retiro, alumno_id) 
        VALUES (?, ?, ?, ?)
    `;
    const valores = [nombre_retiro, rut_retiro, parentesco_retiro, alumno_id];
    const [result] = await conn.query(sql, valores);
    return result;

}

// Obtener todos los retiros
async function getAllRetiros() {
    const sql = `
        SELECT id, nombre_retiro, rut_retiro, parentesco_retiro, alumno_id
        FROM ${TABLA}
    `;
    const [rows] = await conn.query(sql);
    return rows;
}

// Modificar Retiro

// Eliminar Retiro
async function deleteRetiro(id) {
    if (!id) return null;
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}