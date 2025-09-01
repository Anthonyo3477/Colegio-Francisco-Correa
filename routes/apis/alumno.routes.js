const express = require('express');
const router = express.Router();
const alumnoController = require('../../db/controllers/alumnoController');

// Middleware para parsear body
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* ==================================================
   CREAR ALUMNO
================================================== */

// Mostrar formulario de creación
router.get('/nuevo', (req, res) => {
    res.render('alumno', {
        title: 'Registrar Nuevo Alumno',
        error: null,
        valores: {}
    });
});

// Procesar creación
router.post('/insert', async (req, res) => {
    try {
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direcion, comuna } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso || !nacionalidad?.trim() || !direcion?.trim() || !comuna?.trim()) {
            return res.status(400).render('alumno', {
                title: 'Registrar Nuevo Alumno',
                error: 'Todos los campos son obligatorios',
                valores: req.body
            });
        }

        // 🔹 Aquí guardamos el alumno y recibimos el ID
        const result = await alumnoController.createAlumno({
            rut_alumnos: rut_alumnos.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            curso: curso.trim(),
            fecha_ingreso,
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null,
            direcion: direcion.trim(),
            comuna: comuna.trim()
        });

        console.log("Alumno creado correctamente:", rut_alumnos, "ID:", result.insertId);

        res.redirect(`/nuevo-apoderado/${result.insertId}`);
    } catch (error) {
        console.error('Error al crear alumno:', error);
        res.status(500).render('alumno', {
            title: 'Registrar Nuevo Alumno',
            error: 'Error al guardar el alumno',
            valores: req.body
        });
    }
});


/* ==================================================
   LISTAR ALUMNOS
================================================== */

/*router.get('/listaAlumnos', async (req, res) => {
    try {
        const alumnos = await alumnoController.getAllAlumnos();
        console.log("Alumnos cargados:", alumnos.length);
        res.render('listaAlumnos', { alumnos });
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).render('error', { message: 'Error al cargar alumnos' });
    }
});*/

/* ==================================================
   LISTAR ALUMNOS con FILTRO
================================================== */

router.get('/listaAlumnos', async (req, res) => {
    try {
        const cursoSeleccionado = req.query.curso || "";

        // Traer alumnos filtrados (si hay curso, filtrar)
        let alumnos;
        if (cursoSeleccionado) {
            alumnos = await alumnoController.getAlumnosByCurso(cursoSeleccionado);
        } else {
            alumnos = await alumnoController.getAllAlumnos();
        }

        // Obtener lista única de cursos
        const cursos = await alumnoController.getAllCursos();

        res.render('listaAlumnos', {
            alumnos,
            cursos,
            cursoSeleccionado
        });

    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).render('error', { message: 'Error al cargar alumnos' });
    }
});

/* ==================================================
   MODIFICAR ALUMNO
================================================== */

// Formulario edición
router.get('/editar/:id', async (req, res) => {
    const id = req.params.id;
    console.log("Solicitud GET /editar con ID:", id);

    try {
        // Promesa con timeout opcional de 5 segundos
        const alumno = await Promise.race([
            alumnoController.getAlumnoById(id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 5000))
        ]);

        console.log("Alumno encontrado:", alumno);

        if (!alumno) {
            return res.status(404).render('error', { message: 'Alumno no encontrado' });
        }

        res.render('EditarAlumnos', {
            title: `Editar ${alumno.nombre}`,
            alumno,
            error: null
        });

    } catch (error) {
        console.error('Error al cargar el formulario de edición:', error);
        res.status(500).render('error', { message: `Error al obtener alumno: ${error.message}` });
    }
});

// Procesar actualización
router.post('/actualizar/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso || !nacionalidad?.trim()) {
            return res.status(400).render('EditarAlumnos', {
                title: `Editar Alumno`,
                error: 'Todos los campos son obligatorios',
                alumno: { id, ...req.body }
            });
        }

        await alumnoController.updateAlumno(id, {
            rut_alumnos: rut_alumnos.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            curso: curso.trim(),
            fecha_ingreso,
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null
        });

        console.log("Alumno actualizado correctamente:", id);
        res.redirect('/listaAlumnos');

    } catch (error) {
        console.error('Error al actualizar alumno:', error);
        res.status(500).render('EditarAlumnos', {
            title: `Editar Alumno`,
            error: `Error al actualizar el alumno: ${error.message}`,
            alumno: { id, ...req.body }
        });
    }
});

/* ==================================================
   ELIMINAR ALUMNO
================================================== */

router.post('/eliminar/:id', async (req, res) => {
    const id = req.params.id;
    console.log("Solicitud POST /eliminar con ID:", id);

    try {
        await alumnoController.deleteAlumno(id);
        console.log("Alumno eliminado correctamente:", id);
        res.redirect('/listaAlumnos');
    } catch (error) {
        console.error('Error al eliminar alumno:', error);
        res.status(500).render('error', { message: 'Error al eliminar alumno' });
    }
});

module.exports = router;