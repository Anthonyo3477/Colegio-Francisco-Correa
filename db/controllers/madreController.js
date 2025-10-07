const conn = require("../conexion");
const TABLA = "madre";

// Creacion de madre
async function createMadre(madre) {
    const { nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre,
        trabajo_madre, direccion_madre, telefono_madre, alumno_id } = madre;

    const sql = `
        INSERT INTO ${TABLA} 
        (nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre, 
        trabajo_madre, direccion_madre, telefono_madre, alumno_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valoresMadre = [nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre,
        trabajo_madre, direccion_madre, telefono_madre, alumno_id];

    const [result] = await conn.query(sql, valoresMadre);
    return result;
}

// Obtener todas las madres
async function getAllMadres() {
    const sql = `
        SELECT id, nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre, 
        trabajo_madre, direccion_madre, telefono_madre, alumno_id FROM ${TABLA} 
    `;
    const [rows] = await conn.query(sql);
    return rows;
}

// Obtener madres por ID
async function getMadresById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// Obtener datos de la madre según alumno_id
async function getMadreByAlumnoId (alumnoId) {
    const [rows] = await conn.query('SELECT * FROM madre WHERE alumno_id = ?', [alumnoId]);
    return rows[0] || null;
}

// Actualizar madre por ID
async function updateMadres(id, madre) {
    const { nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre, trabajo_madre,
        direccion_madre, telefono_madre, alumno_id } = madre;

    const sql = `
        UPDATE ${TABLA} 
        SET nombre_madre=?, rut_madre=?, fechaNacimiento_madre=?, nacionalidad_madre=?, nivelEducacional_madre=?, 
        trabajo_madre=?, direccion_madre=?, telefono_madre=?, alumno_id=? 
        WHERE id=?
    `;

    const valoresMadre = [nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre,
        trabajo_madre, direccion_madre, telefono_madre, alumno_id, id];

    const [result] = await conn.query(sql, valoresMadre);
    return result;
}

// Eliminar por ID
async function deleteMadre(id) {
    if (!id) return null;
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result
}

module.exports = { createMadre, getAllMadres, getMadresById, getMadreByAlumnoId, updateMadres, deleteMadre };