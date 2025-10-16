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
    const {
        nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno,
        puebloOriginario, quePueblo, enfermedad, alergias, medicamentos, curso,
        fecha_ingreso, añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon
    } = alumno;

    const sql = `
        INSERT INTO ${TABLA} 
        (nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno, 
         puebloOriginario, quePueblo, enfermedad, alergias, medicamentos, curso, fecha_ingreso, 
         añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno,
        puebloOriginario, quePueblo, enfermedad, alergias, medicamentos, curso,
        formatDate(fecha_ingreso), añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon
    ];

    const [result] = await conn.query(sql, valores);
    return result;
}

// Obtener todos los alumnos
async function getAllAlumnos() {
    const sql = `
        SELECT id, nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno, 
               puebloOriginario, quePueblo, enfermedad, alergias, medicamentos, curso, 
               DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso, 
               añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon 
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
// getAlumnosConApoderados corregida y robusta
async function getAlumnosConApoderados({ curso } = {}) {
    let sql = `
        SELECT 
            a.id AS alumno_id, a.nombreCompleto_alumno, a.sexo, a.rut_alumnos,
            DATE_FORMAT(a.fechaNacimiento_alumno, '%d-%m-%Y') AS fechaNacimiento_alumno,
            a.edadAlumno, a.puebloOriginario, a.quePueblo, a.enfermedad, a.alergias, a.medicamentos,
            a.curso, DATE_FORMAT(a.fecha_ingreso, '%Y-%m-%d') AS fecha_ingreso,
            a.añoIngresoChile, a.nacionalidad, a.orden_llegada, a.direccion, a.comuna, a.viveCon,

            ap.id AS apoderado_id, ap.rut_apoderado, ap.nombre_apoderado,
            ap.parentesco_apoderado, DATE_FORMAT(ap.fechaNacimiento_apoderado, '%d-%m-%Y') AS fechaNacimiento_apoderado,
            ap.telefono AS apoderado_telefono,
            ap.correo_apoderado,
            ap.trabajo_apoderado,
            ap.nivelEducacional_apoderado
        FROM alumno a
        LEFT JOIN apoderados ap ON a.id = ap.alumno_id
    `;

    const valores = [];
    if (curso) {
        sql += " WHERE a.curso = ?";
        valores.push(curso);
    }

    sql += " ORDER BY TRIM(LOWER(a.nombreCompleto_alumno)) ASC";
    const [rows] = await conn.query(sql, valores);

    // Agrupar los apoderados por alumno SIN perder el orden
    const alumnosMap = new Map();
    for (const row of rows) {
        if (!alumnosMap.has(row.alumno_id)) {
            alumnosMap.set(row.alumno_id, {
                id: row.alumno_id,
                rut_alumnos: row.rut_alumnos,
                nombreCompleto_alumno: row.nombreCompleto_alumno,
                sexo: row.sexo,
                fechaNacimiento_alumno: row.fechaNacimiento_alumno,
                edadAlumno: row.edadAlumno,
                curso: row.curso,
                fecha_ingreso: row.fecha_ingreso,
                nacionalidad: row.nacionalidad,
                orden_llegada: row.orden_llegada,
                direccion: row.direccion,
                comuna: row.comuna,
                viveCon: row.viveCon,
                apoderados: []
            });
        }

        if (row.apoderado_id) {
            alumnosMap.get(row.alumno_id).apoderados.push({
                id: row.apoderado_id,
                rut_apoderado: row.rut_apoderado,
                nombre_apoderado: row.nombre_apoderado,
                parentesco_apoderado: row.parentesco_apoderado,
                fechaNacimiento_apoderado: row.fechaNacimiento_apoderado,
                telefono: row.apoderado_telefono,
                correo_apoderado: row.correo_apoderado,
                trabajo_apoderado: row.trabajo_apoderado,
                nivelEducacional_apoderado: row.nivelEducacional_apoderado
            });
        }
    }

    return Array.from(alumnosMap.values());
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
    const {
        nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno,
        puebloOriginario, quePueblo, enfermedad, alergias, medicamentos, curso,
        fecha_ingreso, añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon
    } = alumno;

    const sql = `
        UPDATE ${TABLA} 
        SET nombreCompleto_alumno=? , sexo=?, rut_alumnos=?, fechaNacimiento_alumno=?, edadAlumno=?, puebloOriginario=?,
            quePueblo=?, enfermedad=?, alergias=?, medicamentos=?, curso=?, 
            fecha_ingreso=?, añoIngresoChile=?, nacionalidad=?, orden_llegada=?, direccion=?, comuna=?, viveCon=? 
        WHERE id=?
    `;
    const valores = [
        nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno, puebloOriginario,
        quePueblo, enfermedad, alergias, medicamentos, curso,
        formatDate(fecha_ingreso), añoIngresoChile, nacionalidad, orden_llegada, direccion, comuna, viveCon, id
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

module.exports = {
    createAlumno,
    getAllAlumnos,
    getAlumnoById,
    getAlumnosConApoderados,
    getAllCursos,
    getAlumnosByCurso,
    updateAlumno,
    deleteAlumno
};