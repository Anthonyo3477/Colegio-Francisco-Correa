const conn = require('../conexion');
const TABLA = 'alumno';

// Helper: normalizar fecha a YYYY-MM-DD
function formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return date;
}

// Crear alumno
async function createAlumno(alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = alumno;

    const sql = `INSERT INTO ${TABLA} (rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, formatDate(fecha_ingreso), nacionalidad, orden_llegada, direccion, comuna ];

    const [result] = await conn.query(sql, valores);
    return result;
}

// Obtener todos los alumnos
async function getAllAlumnos() {
    const sql = `SELECT id, rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna FROM ${TABLA}`;
    const [rows] = await conn.query(sql);
    return rows;
}

// Obtienes Alumnos filtrdos
async function getAlumnosByCurso(curso) {
    const [rows] = await conn.query("SELECT * FROM alumno WHERE curso = ?", [curso]);
    return rows;
}

async function getAllCursos() {
    const [rows] = await conn.query("SELECT DISTINCT curso FROM alumno ORDER BY curso ASC");
    return rows.map(r => r.curso);
}

// Obtener alumno por ID
async function getAlumnoById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// Actualizar alumno por ID
async function updateAlumno(id, alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = alumno;
    const sql = `UPDATE ${TABLA} SET rut_alumnos=?, nombre=?, apellido_paterno=?, apellido_materno=?, curso=?, fecha_ingreso=?, nacionalidad=?, orden_llegada=?, direccion=?, comuna=? WHERE id=?`;
    const valores = [rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, formatDate(fecha_ingreso), nacionalidad, orden_llegada, direccion, comuna, id];
    const [result] = await conn.query(sql, valores);
    return result;
}

// Eliminar alumno por ID
async function deleteAlumno(id) {
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

module.exports = { createAlumno, getAllAlumnos, getAlumnoById, getAllCursos, getAlumnosByCurso, updateAlumno, deleteAlumno };