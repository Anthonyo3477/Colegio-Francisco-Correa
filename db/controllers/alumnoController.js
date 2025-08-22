const conn = require('../Conexion.js');
const TABLA = 'alumno';

// Crear alumno
function createAlumno(alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada } = alumno;

    return new Promise((resolve, reject) => {
        conn.query(
            `INSERT INTO ${TABLA} 
            (rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                rut_alumnos,
                nombre,
                apellido_paterno,
                apellido_materno,
                curso,
                formatDate(fecha_ingreso),
                nacionalidad,
                orden_llegada
            ],
            (error, result) => error ? reject(error) : resolve(result)
        );
    });
}

// Obtener todos los alumnos
function getAllAlumnos() {
    return new Promise((resolve, reject) => {
        conn.query(
            `SELECT id, rut_alumnos, nombre, apellido_paterno, apellido_materno, curso,  DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso, nacionalidad, orden_llegada  FROM ${TABLA}`,
            (error, result) => error ? reject(error) : resolve(result)
        );
    });
}

// Obtener alumno por ID
function getAlumnoById(id) {
    return new Promise((resolve, reject) => {
        conn.query(
            `SELECT * FROM ${TABLA}  WHERE id = ?`, [id], (error, result) => {
                return error ? reject(error) : resolve(result[0]);
            } 
        );
    });
}

// Actualizar alumno por ID
function updateAlumno(id, alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada } = alumno;
    return new Promise((resolve, reject) => {
        conn.query(
            `UPDATE ${TABLA}  SET rut_alumnos = ?, nombre = ?, apellido_paterno = ?, apellido_materno = ?, curso = ?, fecha_ingreso = ?, nacionalidad = ?, orden_llegada = ? WHERE id = ?`,
            [
                rut_alumnos,
                nombre,
                apellido_paterno,
                apellido_materno,
                curso,
                formatDate(fecha_ingreso),
                nacionalidad,
                orden_llegada,
                id
            ],
            (error, result) => error ? reject(error) : resolve(result)
        );
    });
}

// Eliminar alumno por ID
function deleteAlumno(id) {
    return new Promise((resolve, reject) => {
        conn.query(
            `DELETE FROM ${TABLA} WHERE id = ?`,
            [id],
            (error, result) => error ? reject(error) : resolve(result)
        );
    });
}

// Helper: normalizar fecha a YYYY-MM-DD
function formatDate(date) {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return date;
}

module.exports = { createAlumno, getAllAlumnos, getAlumnoById, updateAlumno, deleteAlumno };