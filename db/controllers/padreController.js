const conn = require("../conexion");
const TABLA = "padre";

// ==========================================================
// CREATE PADRE
// ==========================================================
async function createPadre(padre) {
    const { nombre_padre, rut_padre, fechaNacimiento_padre, nacionalidad_padre, nivelEducacional_padre,
        trabajo_padre, correo_padre, direccion_padre, telefono_padre, alumno_id } = padre;

    const sql = `
        INSERT INTO ${TABLA} 
        (nombre_padre , rut_padre, fechaNacimiento_padre, nacionalidad_padre, nivelEducacional_padre, 
        trabajo_padre, correo_padre, direccion_padre, telefono_padre, alumno_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valoresPadre = [nombre_padre, rut_padre, fechaNacimiento_padre, nacionalidad_padre, nivelEducacional_padre,
        trabajo_padre, correo_padre, direccion_padre, telefono_padre, alumno_id];

    const [result] = await conn.query(sql, valoresPadre);
    return result;
}

// ==========================================================
// OBTENER TODOS LOS PADRES
// ==========================================================
async function getAllPadre() {
    const sql = `
        SELECT id, nombre_padre , rut_padre, fechaNacimiento_padre, nacionalidad_padre, nivelEducacional_padre, 
        trabajo_padre, correo_padre, direccion_padre, telefono_padre, alumno_id FROM${TABLA} 
    `;

    const [rows] = await conn.query(sql);
    return rows;
}

// ==========================================================
// OBTENER PADRES EN BASE DEL ID
// ==========================================================
async function getPadreById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// ==========================================================
// OBTENER PADRES CON ALUMNOS
// ==========================================================
async function getPadreByAlumnoId(alumnoId) {
    const [rows] = await conn.query('SELECT * FROM padre WHERE alumno_id = ?', [alumnoId]);
    return rows[0] || null;
};

// ==========================================================
// ACTUALIZAR PADRES
// ==========================================================
async function updatePadre(alumnoId, padre) {
    const {
        nombre_padre,rut_padre,fechaNacimiento_padre,nacionalidad_padre,
        nivelEducacional_padre,trabajo_padre,correo_padre,direccion_padre,telefono_padre} = padre;

    const sql = `
        UPDATE ${TABLA} 
        SET nombre_padre = ?, rut_padre = ?, fechaNacimiento_padre = ?, nacionalidad_padre = ?, 
            nivelEducacional_padre = ?, trabajo_padre = ?, correo_padre = ?, direccion_padre = ?, 
            telefono_padre = ?
        WHERE alumno_id = ?
    `;

    const valoresPadre = [
        nombre_padre,rut_padre,fechaNacimiento_padre,nacionalidad_padre,nivelEducacional_padre,
        trabajo_padre,correo_padre,direccion_padre,telefono_padre,alumnoId];

    const [result] = await conn.query(sql, valoresPadre);
    return result;
}

// ==========================================================
// ELIMINAR PADRES
// ==========================================================
async function deletePadre(id) {
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

module.exports = { createPadre, getAllPadre, getPadreById, getPadreByAlumnoId, updatePadre, deletePadre };