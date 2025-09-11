const conn = require('../conexion');
const TABLA = 'alumno';

// Este apartado es solo para probar al final lo que deberia de hacer es entregarme la fecha asi dd-mm-aaaa
function formatDate(date) {
    if (!date) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [day, month, year] = date.split("-");
        return `${year}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    if (date instanceof Date) {
        return date.toISOString().split("T")[0];
    }
    if (typeof date === "string" && date.includes("T")) {
        return date.split("T")[0];
    }
    return date;
}

// Crear alumno
async function createAlumno(alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = alumno;

    const sql = `
        INSERT INTO ${TABLA} 
        (rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        rut_alumnos, nombre, apellido_paterno, apellido_materno, curso,
        formatDate(fecha_ingreso), nacionalidad, orden_llegada, direccion, comuna
    ];

    const [result] = await conn.query(sql, valores);
    return result;
}

// Obtener todos los alumnos
async function getAllAlumnos() {
    const sql = `
        SELECT id, rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, 
               DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso, 
               nacionalidad, orden_llegada, direccion, comuna 
        FROM ${TABLA}
    `;
    const [rows] = await conn.query(sql);
    return rows;
}

// Obtener alumno por ID
async function getAlumnoById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

// Listado alumno con apoderado
async function getAlumnosConApoderados({ curso } = {}) {
    let sql = `
        SELECT 
            a.id AS alumno_id, a.rut_alumnos, a.nombre, a.apellido_paterno, a.apellido_materno,
            a.curso, DATE_FORMAT(a.fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso,
            a.nacionalidad, a.orden_llegada, a.direccion, a.comuna,
            ap.id AS apoderado_id, ap.rut_apoderado, ap.nombre_apoderado,
            ap.apellido_paterno AS apoderado_apellido_paterno,
            ap.apellido_materno AS apoderado_apellido_materno,
            ap.nacionalidad AS apoderado_nacionalidad,
            ap.telefono AS apoderado_telefono,
            ap.correo_apoderado AS apoderado_correo
        FROM alumno a
        LEFT JOIN apoderados ap ON a.id = ap.alumno_id
    `;

    const valores = [];
    if (curso) {
        sql += " WHERE a.curso = ?";
        valores.push(curso);
    }

    const [rows] = await conn.query(sql, valores);

    // Agrupar los apoderados por alumno
    const alumnos = {};
    for (const row of rows) {
        if (!alumnos[row.alumno_id]) {
            alumnos[row.alumno_id] = {
                id: row.alumno_id,
                rut_alumnos: row.rut_alumnos,
                nombre: row.nombre,
                apellido_paterno: row.apellido_paterno,
                apellido_materno: row.apellido_materno,
                curso: row.curso,
                fecha_ingreso: row.fecha_ingreso,
                nacionalidad: row.nacionalidad,
                orden_llegada: row.orden_llegada,
                direccion: row.direccion,
                comuna: row.comuna,
                apoderados: []
            };
        }

        if (row.apoderado_id) {
            alumnos[row.alumno_id].apoderados.push({
                id: row.apoderado_id,
                rut_apoderado: row.rut_apoderado,
                nombre_apoderado: row.nombre_apoderado,
                apellido_paterno: row.apoderado_apellido_paterno,
                apellido_materno: row.apoderado_apellido_materno,
                nacionalidad: row.apoderado_nacionalidad,
                telefono: row.apoderado_telefono,
                correo_apoderado: row.apoderado_correo
            });
        }
    }

    return Object.values(alumnos);
}

// Obtiene alumnos filtrados por curso
async function getAlumnosByCurso(curso) {
    const [rows] = await conn.query("SELECT * FROM alumno WHERE curso = ?", [curso]);
    return rows;
}

// Obtiene todos los cursos distintos
async function getAllCursos() {
    const [rows] = await conn.query("SELECT DISTINCT curso FROM alumno ORDER BY curso ASC");
    return rows.map(r => r.curso);
}

// Actualizar alumno por ID
async function updateAlumno(id, alumno) {
    const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = alumno;
    const sql = `
        UPDATE ${TABLA} 
        SET rut_alumnos=?, nombre=?, apellido_paterno=?, apellido_materno=?, curso=?, 
            fecha_ingreso=?, nacionalidad=?, orden_llegada=?, direccion=?, comuna=? 
        WHERE id=?
    `;
    const valores = [
        rut_alumnos, nombre, apellido_paterno, apellido_materno, curso,
        formatDate(fecha_ingreso), nacionalidad, orden_llegada, direccion, comuna, id
    ];
    const [result] = await conn.query(sql, valores);
    return result;
}

// Eliminar alumno por ID
async function deleteAlumno(id) {
    const sql = `DELETE FROM ${TABLA} WHERE id = ?`;
    const [result] = await conn.query(sql, [id]);
    return result;
}

// Guardar documento
async function guardarDocumento(nombreArchivo, buffer) {
    const sql = `INSERT INTO ${TABLA} (nombre_archivo, documento) VALUES (?, ?)`;
    const [result] = await conn.query(sql, [nombreArchivo, buffer]);
    return result.insertId;
}

// Obtener documento por ID
async function obtenerDocumento(id) {
    const sql = `SELECT * FROM ${TABLA} WHERE id = ?`;
    const [rows] = await conn.query(sql, [id]);
    return rows[0] || null;
}

module.exports = { 
    guardarDocumento,
    obtenerDocumento,
    createAlumno, 
    getAllAlumnos, 
    getAlumnoById, 
    getAlumnosConApoderados, 
    getAllCursos, 
    getAlumnosByCurso, 
    updateAlumno, 
    deleteAlumno 
};