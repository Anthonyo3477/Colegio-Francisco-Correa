const conn = require('../conexion');
const TABLA = 'retiros';

// ============================================================
// CREAR RETIRO
// ============================================================
async function createRetiro({ nombre_retiro, rut_retiro, parentesco_retiro, alumno_id }) {
    const sql = `
    INSERT INTO ${TABLA} (nombre_retiro, rut_retiro, parentesco_retiro, alumno_id)
    VALUES (?, ?, ?, ?)
  `;
    const valores = [nombre_retiro, rut_retiro, parentesco_retiro, alumno_id];

    const [result] = await conn.query(sql, valores);
    return result;
}

// ============================================================
// OBTENER TODOS LOS RETIROS
// ============================================================
async function getAllRetiros() {
    const sql = `
    SELECT r.id, r.nombre_retiro, r.rut_retiro, r.parentesco_retiro,
           a.nombreCompleto_alumno AS alumno_nombre
    FROM ${TABLA} r
    LEFT JOIN alumno a ON r.alumno_id = a.id
    ORDER BY r.nombre_retiro ASC
  `;
    const [rows] = await conn.query(sql);
    return rows;
}

// ============================================================
// OBTENER RETIRO POR ID
// ============================================================
async function getRetiroById(id) {
    if (!id) return null;
    const sql = `
    SELECT r.*, a.nombreCompleto_alumno AS alumno_nombre
    FROM ${TABLA} r
    LEFT JOIN alumno a ON r.alumno_id = a.id
    WHERE r.id = ?
  `;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// ============================================================
// OBTENER RETIRO POR ALUMNO_ID
// ============================================================
async function getRetiroByAlumnoId(alumno_id) {
    const sql = `SELECT * FROM ${TABLA} WHERE alumno_id = ?`;
    const [rows] = await conn.query(sql, [alumno_id]);
    return rows[0] || null;
}

// ============================================================
// ACTUALIZAR RETIRO
// ============================================================
async function updateRetiro(id, { nombre_retiro, rut_retiro, parentesco_retiro, alumno_id }) {
    const sql = `
    UPDATE ${TABLA}
    SET nombre_retiro = ?, rut_retiro = ?, parentesco_retiro = ?, alumno_id = ?
    WHERE id = ?
  `;
    const valores = [nombre_retiro, rut_retiro, parentesco_retiro, alumno_id, id];
    const [result] = await conn.query(sql, valores);
    return result;
}

// ============================================================
// ELIMINAR RETIRO
// ============================================================
async function deleteRetiro(id) {
    if (!id) return null;
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

module.exports = { createRetiro, getAllRetiros, getRetiroById, getRetiroByAlumnoId, updateRetiro, deleteRetiro };