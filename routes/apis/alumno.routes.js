const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const alumnoController = require('../../db/controllers/alumnoController');
const datosAcademicosController = require('../../db/controllers/datosAcademicosController');
const documentoController = require('../../db/controllers/documentoController');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Función para dar formato a la fecha en YYYY-MM-DD
function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

            // Guardar documento en BD
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
        doc.text(`Nombre Completo: ${datos.nombreCompleto_alumno}`);
        doc.text(`Curso: ${datos.curso}`);
        doc.text(`Fecha de Ingreso: ${datos.fecha_ingreso}`);
        doc.text(`Nacionalidad: ${datos.nacionalidad}`);
        doc.text(`Dirección: ${datos.direccion}, ${datos.comuna}`);
        doc.moveDown();

        doc.fontSize(14).text("Datos del Apoderado:");
        doc.fontSize(12).text(`RUT: ${datos.rut_apoderado}`);
        doc.text(`Nombre: ${datos.nombre_apoderado}`);
        doc.text(`Parentesco: ${datos.parentesco_apoderado}`);
        doc.text(`Teléfono: ${datos.telefono}`);
        doc.text(`Correo: ${datos.correo_apoderado}`);
        doc.text(`Trabajo: ${datos.trabajo_apoderado}`);

        doc.end();

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).send("Error al generar PDF");
    }
});

/* ==================================================
   CREAR ALUMNO
================================================== */
// Mostrar formulario
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
        const {
            // Datos del Alumno
            nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno, puebloOriginario,
            quePueblo, enfermedad, alergias, medicamentos, curso, fecha_ingreso, añoIngresoChile, nacionalidad,
            orden_llegada, direccion, comuna, viveCon,

            // Datos Académicos
            ultimo_curso_cursado, año_cursado, colegio_procedencia, cursos_reprobados, beneficios_beca, proteccion_infantil

        } = req.body;

        // Validar SOLO los campos realmente obligatorios
        if (!nombreCompleto_alumno?.trim() || !sexo?.trim() || !rut_alumnos?.trim() || !fechaNacimiento_alumno?.trim()
            || !edadAlumno?.trim() || !curso?.trim() || !fecha_ingreso?.trim() || !añoIngresoChile?.trim()
            || !nacionalidad?.trim() || !orden_llegada?.trim() || !direccion?.trim() || !comuna?.trim() || !viveCon?.trim()
            || !ultimo_curso_cursado?.trim() || !año_cursado?.trim() || !colegio_procedencia?.trim()
            || !cursos_reprobados?.trim() || !beneficios_beca?.trim() || !proteccion_infantil?.trim()) {
            return res.status(400).render('alumno', {
                title: 'Registrar Nuevo Alumno',
                error: 'Todos los campos obligatorios deben estar completos',
                valores: req.body
            });
        }

        // Crear Alumno
        const resultAlumno = await alumnoController.createAlumno({
            nombreCompleto_alumno: nombreCompleto_alumno.trim(),
            sexo: sexo.trim(),
            rut_alumnos: rut_alumnos.trim(),
            fechaNacimiento_alumno: fechaNacimiento_alumno.trim(),
            edadAlumno: edadAlumno.trim(),
            puebloOriginario: puebloOriginario?.trim() || null,
            quePueblo: quePueblo?.trim() || null,
            enfermedad: enfermedad?.trim() || null,
            alergias: alergias?.trim() || null,
            medicamentos: medicamentos?.trim() || null,
            curso: curso.trim(),
            fecha_ingreso: formatDate(fecha_ingreso),
            añoIngresoChile: añoIngresoChile.trim(),
            nacionalidad: nacionalidad.trim(),
            orden_llegada: parseInt(orden_llegada) || null,
            direccion: direccion.trim(),
            comuna: comuna.trim(),
            viveCon: viveCon.trim()
        });

        const alumnoId = resultAlumno.insertId;

        // Crear Datos Académicos vinculados
        await datosAcademicosController.createDatosAcademicos({
            ultimo_curso_cursado: ultimo_curso_cursado.trim(),
            año_cursado: año_cursado.trim(),
            colegio_procedencia: colegio_procedencia.trim(),
            cursos_reprobados: cursos_reprobados.trim(),
            beneficios_beca: beneficios_beca.trim(),
            proteccion_infantil: proteccion_infantil.trim(),
            alumno_id: alumnoId
        });

        console.log("Alumno y datos académicos creados correctamente:", rut_alumnos, "ID:", alumnoId);
        res.redirect(`/nuevo-padres/${alumnoId}`);

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
router.get('/listaAlumnos', isAuthenticated, async (req, res) => {
    try {
        // Obtener todos los alumnos con sus apoderados
        const alumnos = await alumnoController.getAlumnosConApoderados();

        // Renderizar la vista con el listado
        res.render('listaAlumnos', {
            alumnos,
            cursos: [],            // Eliminamos el uso de cursos
            cursoSeleccionado: ""  // Sin filtro activo
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
        const alumno = await alumnoController.getAlumnoById(id);
        const datos_academicos = await datosAcademicosController.getByAlumnoId(id);

        if (!alumno) {
            return res.status(404).send('Alumno no encontrado');
        }

        res.render('EditarAlumnos', {
            title: `Editar ${alumno.nombreCompleto_alumno}`,
            alumno,
            datos_academicos,
            error: null
        });

    } catch (error) {
        console.error('Error al cargar el formulario de edición:', error);
        res.status(500).send(`Error al obtener alumno: ${error.message}`);
    }
});


// Procesar actualización
router.post('/actualizar/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const {
            // Datos del Alumno 
            nombreCompleto_alumno, sexo, rut_alumnos, fechaNacimiento_alumno, edadAlumno, puebloOriginario,
            quePueblo, enfermedad, alergias, medicamentos, curso, fecha_ingreso, añoIngresoChile, nacionalidad,
            orden_llegada, direccion, comuna, viveCon,

            //Datos Academicos
            ultimo_curso_cursado, año_cursado, colegio_procedencia,
            cursos_reprobados, beneficios_beca, proteccion_infantil

        } = req.body;

        if (!nombreCompleto_alumno?.trim() || !sexo?.trim() || !rut_alumnos?.trim() || !fechaNacimiento_alumno
            || !edadAlumno?.trim() || !enfermedad?.trim() || !alergias?.trim()
            || !medicamentos?.trim() || !curso?.trim() || !fecha_ingreso || !añoIngresoChile?.trim() || !nacionalidad?.trim()
            || !orden_llegada?.trim() || !direccion?.trim() || !comuna?.trim() || !viveCon?.trim()

            || !ultimo_curso_cursado || !año_cursado?.trim() || !colegio_procedencia?.trim()
            || !cursos_reprobados?.trim() || !beneficios_beca?.trim() || !proteccion_infantil?.trim()) {
            return res.status(400).render('EditarAlumnos', {
                title: `Editar Alumno`,
                error: 'Todos los campos obligatorios deben estar completos',
                alumno: { id, ...req.body }
            });
        }

        await alumnoController.updateAlumno(id, {
            nombreCompleto_alumno: nombreCompleto_alumno.trim(),
            sexo: sexo.trim(),
            rut_alumnos: rut_alumnos.trim(),
            fechaNacimiento_alumno: formatDate(fechaNacimiento_alumno),
            edadAlumno: edadAlumno.trim(),
            puebloOriginario: puebloOriginario?.trim() || null,
            quePueblo: quePueblo?.trim() || null,
            enfermedad: enfermedad.trim(),
            alergias: alergias.trim(),
            medicamentos: medicamentos.trim(),
            curso: curso.trim(),
            fecha_ingreso: formatDate(fecha_ingreso),
            añoIngresoChile: añoIngresoChile.trim(),
            nacionalidad: nacionalidad.trim(),
            orden_llegada: orden_llegada && !isNaN(parseInt(orden_llegada)) ? parseInt(orden_llegada) : null,
            direccion: direccion.trim(),
            comuna: comuna.trim(),
            viveCon: viveCon.trim()
        });

        // Actualizar Datos Académicos vinculados

        await datosAcademicosController.updateDatosAcademicosByAlumnoId(id, {
            ultimo_curso_cursado: ultimo_curso_cursado.trim(),
            año_cursado: año_cursado.trim(),
            colegio_procedencia: colegio_procedencia.trim(),
            cursos_reprobados: cursos_reprobados.trim(),
            beneficios_beca: beneficios_beca.trim(),
            proteccion_infantil: proteccion_infantil.trim(),
            alumno_id: id
        });

        console.log("Alumno actualizado correctamente:", id);
        res.redirect(`/editarPadres/${id}`);

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
    try {
        await alumnoController.deleteAlumno(id);
        console.log("Alumno eliminado correctamente:", id);
        res.redirect('/listaAlumnos?deleted=1');
    } catch (error) {
        console.error('Error al eliminar alumno:', error);
        res.status(500).render('error', { message: 'Error al eliminar alumno' });
    }
});

module.exports = router;