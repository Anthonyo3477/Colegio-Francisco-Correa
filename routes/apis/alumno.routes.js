const express = require('express');
const router = express.Router();
const alumnoController = require('../../db/controllers/alumnoController');

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* ==================================================
   CREAR ALUMNO
================================================== */

// Mostrar formulario para crear nuevo alumno
router.get('/nuevo', (req, res) => {
    res.render('alumno', { title: 'Registrar Nuevo Alumno' });
});

// Procesar creación de alumno
router.post('/insert', async (req, res) => {
    try {
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() ||
            !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso ||
            !nacionalidad?.trim()) {
            return res.status(400).render('alumno', {
                error: 'Todos los campos son obligatorios y deben ser válidos',
                valores: req.body
            });
        }

        await alumnoController.createAlumno({
            rut_alumnos: rut_alumnos.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            curso: curso.trim(),
            fecha_ingreso,
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null
        });

        res.redirect('/listaAlumnos');
    } catch (error) {
        console.error('Error al crear alumno:', error);
        res.status(500).render('alumno', {
            error: 'Error al guardar el alumno',
            valores: req.body
        });
    }
});


/* ==================================================
   LISTAR ALUMNOS
================================================== */

router.get('/listaAlumnos', async (req, res) => {
    try {
        const alumnos = await alumnoController.getAllAlumnos();
        res.render('listaAlumnos', { alumnos });
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).render('error', { message: 'Error al cargar alumnos' });
    }
});


/* ==================================================
   MODIFICAR ALUMNO
================================================== */

// Mostrar formulario de edición (por ID)
router.get('/editar/:id', async (req, res) => {
    try {
        const alumno = await alumnoController.getAlumnoById(req.params.id);

        if (!alumno) {
            return res.status(404).render('error', { message: 'Alumno no encontrado' });
        }

        res.render('EditarAlumnos', {
            title: `Editar ${alumno.nombre}`,
            alumno
        });
    } catch (error) {
        console.error('Error al cargar el formulario de edición:', error);
        res.status(500).render('error', { message: 'Error al obtener alumno' });
    }
});

// Procesar actualización (por ID)
router.post('/actualizar/:id', async (req, res) => {
    try {
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso || !nacionalidad?.trim()) {
            return res.status(400).render('EditarAlumnos', {
                error: 'Todos los campos son obligatorios y deben ser válidos',
                alumno: { id: req.params.id, ...req.body }
            });
        }

        await alumnoController.updateAlumno(req.params.id, {
            rut_alumnos: rut_alumnos.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            curso: curso.trim(),
            fecha_ingreso,
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null
        });

        res.redirect('/listaAlumnos');
    } catch (error) {
        console.error('Error al actualizar alumno:', error);
        res.status(500).render('EditarAlumnos', {
            error: 'Error al actualizar el alumno',
            alumno: { id: req.params.id, ...req.body }
        });
    }
});


/* ==================================================
   ELIMINAR ALUMNO
================================================== */

// Eliminar alumno (por ID)
router.post('/eliminar/:id', async (req, res) => {
    try {
        await alumnoController.deleteAlumno(req.params.id);
        res.redirect('/listaAlumnos');
    } catch (error) {
        console.error('Error al eliminar alumno:', error);
        res.status(500).render('error', { message: 'Error al eliminar alumno' });
    }
});

module.exports = router;