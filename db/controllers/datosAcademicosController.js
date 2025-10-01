const conn = require('../conexion');
const TABLA = 'datos_academicos';

// Crear registro academicos
async function createDatosAcademicos (datos) {
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

// Obtener por alumno
async function getByAlumnoId(alumnoId){
    const sql = `SELECT * FROM ${TABLA} WHERE alumno_id = ?`;
    const [rows] = await conn.query(sql,[alumnoId]);
    return rows[0] || null;
}


module.exports = {
    createDatosAcademicos, getByAlumnoId
};