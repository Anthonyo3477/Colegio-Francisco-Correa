const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const alumnoController = require('../../db/controllers/alumnoController');
const documentoController = require('../../db/controllers/documentoController');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* ================================================
    Convertir Datos a PDF 
==================================================*/

router.post('/generar-pdf', isAdmin, async (req, res) => {
    try {
        const datos = req.body;

        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);

            await documentoController.guardarDocumento(
                `Ficha_${datos.rut_alumnos}.pdf`,
                pdfBuffer
            );

            res.redirect('/documento-matricula');
        });

        // Contenido del PDF
        doc.fontSize(18).text("Ficha de Alumno y Apoderado", { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text("Datos del Alumno:");
        doc.fontSize(12).text(`RUT: ${datos.rut_alumnos}`);
        doc.text(`Nombre: ${datos.nombre} ${datos.apellido_paterno} ${datos.apellido_materno}`);
        doc.text(`Curso: ${datos.curso}`);
        doc.text(`Fecha de Ingreso: ${datos.fecha_ingreso}`);
        doc.text(`Nacionalidad: ${datos.nacionalidad}`);
        doc.text(`Dirección: ${datos.direccion}, ${datos.comuna}`);
        doc.moveDown();

        doc.fontSize(14).text("Datos del Apoderado:");
        doc.fontSize(12).text(`RUT: ${datos.rut_apoderado}`);
        doc.text(`Nombre: ${datos.nombre_apoderado} ${datos.apellido_paterno_ap} ${datos.apellido_materno_ap}`);
        doc.text(`Teléfono: ${datos.telefono}`);
        doc.text(`Correo: ${datos.correo_apoderado}`);

        doc.end();

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).send("Error al generar PDF");
    }
});

/* ==================================================
   CREAR ALUMNO
================================================== */

// Mostrar formulario de creación
router.get('/nuevo', isAuthenticated, isAdmin, (req, res) => {
    res.render('alumno', {
        title: 'Registrar Nuevo Alumno',
        error: null,
        valores: {}
    });
});

// Procesar creación
router.post('/insert', async (req, res) => {
    try {
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso || !nacionalidad?.trim() || !direccion?.trim() || !comuna?.trim()) {
            return res.status(400).render('alumno', {
                title: 'Registrar Nuevo Alumno',
                error: 'Todos los campos son obligatorios',
                valores: req.body
            });
        }

        // Guardar alumno y recibir el ID
        const result = await alumnoController.createAlumno({
            rut_alumnos: rut_alumnos.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            curso: curso.trim(),
            fecha_ingreso,
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null,
            direccion: direccion.trim(),
            comuna: comuna.trim()
        });

        console.log("Alumno creado correctamente:", rut_alumnos, "ID:", result.insertId);

        // Redirigimos al formulario del apoderado
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
   LISTAR ALUMNOS con FILTRO
================================================== */

router.get('/listaAlumnos', isAuthenticated,  async (req, res) => {
    try {
        const cursoSeleccionado = req.query.curso || "";

        // Nueva funcion con filtro
        const alumnos = await alumnoController.getAlumnosConApoderados({
            curso: cursoSeleccionado || undefined
        });

        // Obtener solo la lista de cursos
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
        const { rut_alumnos, nombre, apellido_paterno, apellido_materno, curso, fecha_ingreso, nacionalidad, orden_llegada, direccion, comuna } = req.body;

        if (!rut_alumnos?.trim() || !nombre?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !curso?.trim() || !fecha_ingreso || !nacionalidad?.trim() || !direccion?.trim() || !comuna?.trim() ) {
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
            orden_llegada: orden_llegada ? parseInt(orden_llegada) : null,
            direccion: direccion.trim(),
            comuna: comuna.trim()
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