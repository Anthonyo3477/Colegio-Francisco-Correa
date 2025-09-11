const conn = require('../conexion');
const TABLA = 'apoderados';

// Crear apoderado
async function createApoderado(apoderado) {
    const { rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado } = apoderado;

    const sql = `
        INSERT INTO ${TABLA} 
        (rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado];

    const [result] = await conn.query(sql, valores);
    return result;
}

// Obtener todos los apoderados
async function getAllApoderados() {
    const sql = `
        SELECT id, rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado 
        FROM ${TABLA}
    `;
    const [rows] = await conn.query(sql);
    return rows;
}

// Obtener apoderado por ID
async function getApoderadoById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// Obtener apoderado por ID de Alumno
async function getByAlumnoId(alumnoId) {
    if (!alumnoId) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE alumno_id = ?`;
    const [rows] = await conn.query(sql, [alumnoId]);
    return rows[0] || null;
}

// Actualizar apoderado por ID
async function updateApoderado(id, apoderado) {
    const { rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado } = apoderado;
    const sql = `
        UPDATE ${TABLA} 
        SET rut_apoderado=?, nombre_apoderado=?, apellido_paterno=?, apellido_materno=?, nacionalidad=?, alumno_id=?, telefono=?, correo_apoderado=? 
        WHERE id=?
    `;
    const valores = [rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado, id];
    const [result] = await conn.query(sql, valores);
    return result;
}

// Eliminar apoderado por ID
async function deleteApoderado(id) {
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

module.exports = { createApoderado, getAllApoderados, getApoderadoById, getByAlumnoId, updateApoderado, deleteApoderado };
