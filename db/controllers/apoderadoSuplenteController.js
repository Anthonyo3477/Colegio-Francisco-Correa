const conn = require('../conexion');
const TABLA = 'apoderado_suplente';

// -------------------------------------
//  CREATE APODERADO SUPLENTE
// -------------------------------------
async function createApoderadoSuplente(apoderado_suplente) {
    const { nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente,
        fechaNacimiento_apoderado_suplente, telefono_suplente, correoApoderado_suplente, trabajoApoderado_suplente,
        nivelEducacional_apoderado_suplente, alumno_id } = apoderado_suplente;

    const sql = `        
        INSERT INTO ${TABLA} 
        (nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente, fechaNacimiento_apoderado_suplente, 
        telefono_suplente, correoApoderado_suplente, trabajoApoderado_suplente, nivelEducacional_apoderado_suplente, alumno_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente, fechaNacimiento_apoderado_suplente,
        telefono_suplente, correoApoderado_suplente, trabajoApoderado_suplente, nivelEducacional_apoderado_suplente, alumno_id];

    const [result] = await conn.query(sql, valores);
    return result;
}

// -------------------------------------
//  LISTAR TODOS LOS APODERADOS SUPLENTE
// -------------------------------------
async function getAllApoderadoSuplente() {
    const sql = `
        SELECT id, nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente, fechaNacimiento_apoderado_suplente, 
        telefono_suplente, correoApoderado_suplente, trabajoApoderado_suplente, nivelEducacional_apoderado_suplente, alumno_id
        FROM ${TABLA}
    `;
    const [rows] = await conn.query(sql);
    return rows;
}

// -------------------------------------
//  ACTUALIZAR APODERADO POR ID
// -------------------------------------
async function getApoderadoSuplenteById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// -------------------------------------
//  OBTENER APODERADO SUPLENTE POR ID
// -------------------------------------
async function getByAlumnoId(alumnoId) {
    if (!alumnoId) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE alumno_id = ?`;
    const [rows] = await conn.query(sql, [alumnoId]);
    return rows[0] || null;
}

// -------------------------------------
//  ACTUALIZAR POR ID APODERADO SUPLENTE
// -------------------------------------
async function updateApoderadoSuplente(id, apoderado_suplente) {
    const { nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente,
        fechaNacimiento_apoderado_suplente, telefono_suplente, correoApoderado_suplente, trabajoApoderado_suplente,
        nivelEducacional_apoderado_suplente, alumno_id } = apoderado_suplente;

    const sql = `        
        UPDATE ${TABLA} SET 
        nombreApoderado_suplente=?, parentescoApoderado_suplente=?, rut_apoderado_suplente=?, fechaNacimiento_apoderado_suplente=?, 
        telefono_suplente=?, correoApoderado_suplente=?, trabajoApoderado_suplente=?, nivelEducacional_apoderado_suplente=?, alumno_id=?
        WHERE id = ?
    `;

    const valores = [
        nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente,
        fechaNacimiento_apoderado_suplente, telefono_suplente, correoApoderado_suplente,
        trabajoApoderado_suplente, nivelEducacional_apoderado_suplente, alumno_id, id
    ];
    const [result] = await conn.query(sql, valores);
    return result;
}

module.exports = { createApoderadoSuplente, getAllApoderadoSuplente, getApoderadoSuplenteById, getByAlumnoId, updateApoderadoSuplente };