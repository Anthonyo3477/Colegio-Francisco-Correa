const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Ajusta con tus credenciales / o usa tu módulo existente de conexión
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'colegio'
});

const insertarAlumnoYApoderado = async (obj) => {
    const conn = await pool.getConnection();
    try {
        const { alumno, apoderado } = obj;

        // Evita duplicados por RUT del alumno
        const [ya] = await conn.execute(
            'SELECT id FROM alumno WHERE rut_alumnos = ?',
            [alumno.rut]
        );
        if (ya.length) {
            console.log(`Alumno ya existe (RUT ${alumno.rut}), id=${ya[0].id}. Saltando.`);
            return;
        }

        // Inserta alumno
        const [resA] = await conn.execute(
            `INSERT INTO alumno
       (rut_alumnos, nombre, parentesco_apoderado, fechaNacimiento_apoderado,
        curso, fecha_ingreso, trabajo_apoderado, orden_llegada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                alumno.rut,
                alumno.nombre,
                alumno.parentesco_apoderado,
                alumno.fechaNacimiento_apoderado,
                alumno.curso || 'SIN CURSO',
                alumno.fecha_ingreso || new Date(),
                alumno.trabajo_apoderado || 'Chilena',
                null 
            ]
        );

        const alumnoId = resA.insertId;

        // Apoderado: evita duplicar por RUT del apoderado
        const [yaApo] = await conn.execute(
            'SELECT id FROM apoderados WHERE rut_apoderado = ?',
            [apoderado.rut]
        );
        if (!yaApo.length) {
            await conn.execute(
                `INSERT INTO apoderados
         (rut_apoderado, nombre_apoderado, parentesco_apoderado, fechaNacimiento_apoderado,
          trabajo_apoderado, alumno_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    apoderado.rut || null,
                    apoderado.nombre || '',
                    apoderado.parentesco_apoderado || '',
                    apoderado.fechaNacimiento_apoderado || '',
                    apoderado.trabajo_apoderado || 'Chilena',
                    alumnoId
                ]
            );
        } else {
            // Si existe, lo puedes vincular igual a este alumno o dejarlo tal cual.
            // Aquí lo dejamos así para no duplicar relaciones.
        }

        console.log(`OK importado alumno ${alumno.nombre} (${alumno.rut})`);
    } finally {
        conn.release();
    }
};

(async () => {
    const entrada = process.argv[2];
    if (!entrada) {
        console.error('Uso: node scripts/importar_json_a_mysql.js <archivo.json | carpeta>');
        process.exit(1);
    }

    const stat = fs.statSync(entrada);
    const archivos = [];

    if (stat.isDirectory()) {
        fs.readdirSync(entrada).forEach(f => {
            if (f.toLowerCase().endsWith('.json')) archivos.push(path.join(entrada, f));
        });
    } else {
        archivos.push(entrada);
    }

    for (const f of archivos) {
        const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
        await insertarAlumnoYApoderado(obj);
    }

    console.log('Fin.');
    process.exit(0);
})();