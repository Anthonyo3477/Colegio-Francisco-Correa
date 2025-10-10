const conn = require('../conexion');
const TABLA = 'apoderados';

// Crear apoderado
async function createApoderado(apoderado) {
    const {
        nombre_apoderado, parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado, 
        telefono,correo_apoderado, trabajo_apoderado, nivelEducacional_apoderado, alumno_id} = apoderado;

    const sql = `
        INSERT INTO ${TABLA} 
        (nombre_apoderado, parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado, telefono, correo_apoderado, trabajo_apoderado, nivelEducacional_apoderado, alumno_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [nombre_apoderado, parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado, telefono, correo_apoderado, trabajo_apoderado, nivelEducacional_apoderado, alumno_id];

    const [result] = await conn.query(sql, valores);
    return result;
}

// Obtener todos los apoderados
async function getAllApoderados() {
    const sql = `
        SELECT id, nombre_apoderado, parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado, telefono, correo_apoderado, trabajo_apoderado, nivelEducacional_apoderado, alumno_id
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
    const {
        nombre_apoderado,
        parentesco_apoderado,
        rut_apoderado,
        fechaNacimiento_apoderado,
        telefono,
        correo_apoderado,
        trabajo_apoderado,
        nivelEducacional_apoderado,
        alumno_id
    } = apoderado;

    if (!alumno_id) {
        throw new Error("El campo 'alumno_id' es obligatorio y no puede ser nulo.");
    }
    const sql = `
        UPDATE ${TABLA} 
        SET nombre_apoderado=?, parentesco_apoderado=?, rut_apoderado=?, fechaNacimiento_apoderado=?, 
            telefono=?, correo_apoderado=?, trabajo_apoderado=?, nivelEducacional_apoderado=?, alumno_id=? 
        WHERE id=?
    `;
    const valores = [
        nombre_apoderado,
        parentesco_apoderado,
        rut_apoderado,
        fechaNacimiento_apoderado,
        telefono,
        correo_apoderado,
        trabajo_apoderado,
        nivelEducacional_apoderado,
        alumno_id,
        id
    ];

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