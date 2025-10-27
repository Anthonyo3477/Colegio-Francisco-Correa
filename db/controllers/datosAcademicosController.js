const conn = require('../conexion');
const TABLA = 'datos_academicos';

// =====================================
//  CREATE DATOS ACADEMICOS 
// =====================================
async function createDatosAcademicos(datos) {
    const {
        ultimo_curso_cursado, año_cursado, colegio_procedencia, cursos_reprobados,
        beneficios_beca, proteccion_infantil, alumno_id
    } = datos;

    const sql = `
        INSERT INTO ${TABLA}
        (ultimo_curso_cursado, año_cursado, colegio_procedencia, cursos_reprobados, beneficios_beca, proteccion_infantil, alumno_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        ultimo_curso_cursado, año_cursado, colegio_procedencia, cursos_reprobados,
        beneficios_beca, proteccion_infantil, alumno_id
    ];

    const [result] = await conn.query(sql, valores);
    return result;
}

// =====================================
//  OBTENER DATOS ACADEMICOS POR ALUMNO
// =====================================
async function getByAlumnoId(alumnoId) {
    const sql = `SELECT * FROM ${TABLA} WHERE alumno_id = ?`;
    const [rows] = await conn.query(sql, [alumnoId]);
    return rows[0] || null;
}

// =====================================
//  ACTUALIZAR DATOS ACADEMICOS 
// =====================================
async function updateDatosAcademicosByAlumnoId(alumno_id, datos) {
    const {
        ultimo_curso_cursado, año_cursado, colegio_procedencia,
        cursos_reprobados, beneficios_beca, proteccion_infantil
    } = datos;

    const sql = `
        UPDATE ${TABLA}
        SET ultimo_curso_cursado=?, año_cursado=?, colegio_procedencia=?, cursos_reprobados=?,
            beneficios_beca=?, proteccion_infantil=?
        WHERE alumno_id=?`;

    const valores = [
        ultimo_curso_cursado, año_cursado, colegio_procedencia,
        cursos_reprobados, beneficios_beca, proteccion_infantil, alumno_id
    ];

    const [result] = await conn.query(sql, valores);
    return result;
}

// =====================================
//  ELIMINAR DATOS ACADEMICOS
// =====================================
async function deleteDatosAcademicos(id) {
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

module.exports = { createDatosAcademicos, getByAlumnoId, updateDatosAcademicosByAlumnoId, deleteDatosAcademicos };