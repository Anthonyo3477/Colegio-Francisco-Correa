const express = require('express');
const router = express.Router();
const apoderadoController = require('../../db/controllers/apoderadoController');
const apoderadoSuplenteController = require('../../db/controllers/apoderadoSuplenteController');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

/* ==================================================
   FORMULARIO NUEVO APODERADO
================================================== */
router.get('/nuevo-apoderado/:alumnoId', (req, res) => {
    const { alumnoId } = req.params;
    res.render('apoderadoForm', {
        title: 'Registrar Apoderado',
        error: null,
        valores: {},
        alumnoId
    });
});

/* ==================================================
   INSERTAR APODERADO
================================================== */
router.post('/insertApoderado', async (req, res) => {
    try {
        const {
            // Datos Apoderado Titular
            rut_apoderado, nombre_apoderado, parentesco_apoderado, fechaNacimiento_apoderado,
            trabajo_apoderado, nivelEducacional_apoderado, alumno_id, telefono, correo_apoderado,

            // Datos de Apoderado Suplente
            nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente,
            fechaNacimiento_apoderado_suplente, telefono_suplente, correoApoderado_suplente,
            trabajoApoderado_suplente, nivelEducacional_apoderado_suplente
        } = req.body;

        console.log("Datos recibidos del formulario:", req.body);

        /* ---- VALIDACIÓN APODERADO TITULAR ---- */
        if (
            !rut_apoderado?.trim() || !nombre_apoderado?.trim() ||
            !parentesco_apoderado?.trim() || !fechaNacimiento_apoderado?.trim() ||
            !trabajo_apoderado?.trim() || !nivelEducacional_apoderado?.trim() ||
            !alumno_id || !telefono?.trim() || !correo_apoderado?.trim()
        ) {
            return res.status(400).render('apoderadoForm', {
                title: 'Registrar Nuevo Apoderado',
                error: 'Debes ingresar todos los datos del apoderado titular',
                valores: req.body,
                alumnoId: alumno_id
            });
        }

        // Crear Apoderado Principal
        const resultApoderado = await apoderadoController.createApoderado({
            rut_apoderado: rut_apoderado.trim(),
            nombre_apoderado: nombre_apoderado.trim(),
            parentesco_apoderado: parentesco_apoderado.trim(),
            fechaNacimiento_apoderado: fechaNacimiento_apoderado.trim(),
            trabajo_apoderado: trabajo_apoderado.trim(),
            nivelEducacional_apoderado: nivelEducacional_apoderado.trim(),
            alumno_id,
            telefono: telefono.trim(),
            correo_apoderado: correo_apoderado.trim()
        });

        console.log("Apoderado titular creado:", resultApoderado.insertId);

        /* ----- APODERADO SUPLENTE (OPCIONAL) ----- */
        if (
            rut_apoderado_suplente?.trim() &&
            nombreApoderado_suplente?.trim() &&
            parentescoApoderado_suplente?.trim()
        ) {
            const resultApoderadoSuplente = await apoderadoSuplenteController.createApoderadoSuplente({
                nombreApoderado_suplente: nombreApoderado_suplente.trim(),
                parentescoApoderado_suplente: parentescoApoderado_suplente.trim(),
                rut_apoderado_suplente: rut_apoderado_suplente.trim(),
                fechaNacimiento_apoderado_suplente: fechaNacimiento_apoderado_suplente?.trim() || null,
                telefono_suplente: telefono_suplente?.trim() || null,
                correoApoderado_suplente: correoApoderado_suplente?.trim() || null,
                trabajoApoderado_suplente: trabajoApoderado_suplente?.trim() || null,
                nivelEducacional_apoderado_suplente: nivelEducacional_apoderado_suplente?.trim() || null,
                alumno_id
            });

            console.log("Apoderado suplente creado:", resultApoderadoSuplente.insertId);
        } else {
            console.log("No se ingresó apoderado suplente (opcional).");
        }

        return res.redirect('/listaAlumnos');
    } catch (error) {
        console.error("Error al guardar apoderado:", error);
        return res.status(500).render('apoderadoForm', {
            title: 'Registrar Nuevo Apoderado',
            error: 'Error interno al guardar apoderado',
            valores: req.body,
            alumnoId: req.body.alumno_id
        });
    }
});

/* ==================================================
   FORMULARIO EDITAR APODERADO
================================================== */
router.get('/editar-apoderado/:alumnoId', isAuthenticated, isAdmin, async (req, res) => {
    const alumnoId = req.params.alumnoId;

    try {
        const apoderado = await apoderadoController.getByAlumnoId(alumnoId);
        const apoderado_suplente = await apoderadoSuplenteController.getByAlumnoId(alumnoId);

        if (!apoderado) {
            return res.render('EditarApoderado', {
                title: 'Editar Apoderado',
                error: 'Este alumno no tiene un apoderado asignado',
                apoderado: {},
                apoderado_suplente: apoderado_suplente || {},
                alumnoId
            });
        }

        res.render('EditarApoderado', {
            title: 'Editar Apoderado',
            error: null,
            apoderado,
            apoderado_suplente: apoderado_suplente || {},
            alumnoId
        });

    } catch (err) {
        console.error("Error al obtener apoderado:", err);
        res.render('EditarApoderado', {
            title: 'Editar Apoderado',
            error: 'Error al cargar apoderado',
            apoderado: null,
            apoderado_suplente: {},
            alumnoId
        });
    }
});

/* ==================================================
   ACTUALIZAR APODERADO
================================================== */
router.post('/actualizar-apoderado/:alumnoId', isAuthenticated, isAdmin, async (req, res) => {
    const alumnoId = req.params.alumnoId;
    try {
        const {
            // Apoderado principal
            nombre_apoderado, parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado,
            telefono, correo_apoderado, trabajo_apoderado, nivelEducacional_apoderado,

            // Apoderado suplente
            nombreApoderado_suplente, parentescoApoderado_suplente, rut_apoderado_suplente,
            fechaNacimiento_apoderado_suplente, telefono_suplente, correoApoderado_suplente,
            trabajoApoderado_suplente, nivelEducacional_apoderado_suplente
        } = req.body;

        // Validación básica
        if (
            !nombre_apoderado?.trim() || !parentesco_apoderado?.trim() || !rut_apoderado?.trim() ||
            !fechaNacimiento_apoderado?.trim() || !telefono?.trim() || !correo_apoderado?.trim() ||
            !trabajo_apoderado?.trim() || !nivelEducacional_apoderado?.trim() ||

            !nombreApoderado_suplente?.trim() || !parentescoApoderado_suplente?.trim() ||
            !rut_apoderado_suplente?.trim() || !fechaNacimiento_apoderado_suplente?.trim() || !telefono_suplente?.trim() ||
            !correoApoderado_suplente?.trim() || !trabajoApoderado_suplente?.trim() || !nivelEducacional_apoderado_suplente?.trim()
        ) {
            const apoderado = await apoderadoController.getByAlumnoId(alumnoId);
            const apoderado_suplente = await apoderadoSuplenteController.getByAlumnoId(alumnoId);

            return res.status(400).render('EditarApoderado', {
                title: 'Editar Apoderado',
                error: 'No puede haber campos vacíos',
                apoderado,
                apoderado_suplente: apoderado_suplente || {},
                alumnoId
            });
        }

        // Actualizar apoderado titular
        await apoderadoController.updateApoderado(alumnoId, {
            nombre_apoderado: nombre_apoderado.trim(),
            parentesco_apoderado: parentesco_apoderado.trim(),
            rut_apoderado: rut_apoderado.trim(),
            fechaNacimiento_apoderado: fechaNacimiento_apoderado.trim(),
            telefono: telefono.trim(),
            correo_apoderado: correo_apoderado.trim(),
            trabajo_apoderado: trabajo_apoderado.trim(),
            nivelEducacional_apoderado: nivelEducacional_apoderado.trim()
        });

        // Actualizar apoderado suplente si existe
        if (rut_apoderado_suplente?.trim()) {
            await apoderadoSuplenteController.updateApoderadoSuplente(alumnoId, {
                nombreApoderado_suplente: nombreApoderado_suplente?.trim() || '',
                parentescoApoderado_suplente: parentescoApoderado_suplente?.trim() || '',
                rut_apoderado_suplente: rut_apoderado_suplente?.trim() || '',
                fechaNacimiento_apoderado_suplente: fechaNacimiento_apoderado_suplente?.trim() || '',
                telefono_suplente: telefono_suplente?.trim() || '',
                correoApoderado_suplente: correoApoderado_suplente?.trim() || '',
                trabajoApoderado_suplente: trabajoApoderado_suplente?.trim() || '',
                nivelEducacional_apoderado_suplente: nivelEducacional_apoderado_suplente?.trim() || ''
            });
        }

        console.log(` Apoderado y suplente actualizados correctamente para alumno ${alumnoId}`);
        res.redirect('/listaAlumnos');

    } catch (error) {
        console.error('Error al actualizar apoderado:', error);

        const apoderado = await apoderadoController.getByAlumnoId(alumnoId);
        const apoderado_suplente = await apoderadoSuplenteController.getByAlumnoId(alumnoId);

        res.status(500).render('EditarApoderado', {
            title: 'Editar Apoderado',
            error: 'Error del servidor. Por favor, inténtelo de nuevo más tarde.',
            apoderado,
            apoderado_suplente: apoderado_suplente || {},
            alumnoId
        });
    }
});


/* ==================================================
   ELIMINAR APODERADO
================================================== */
router.post('/eliminar-apoderado/:alumnoId', isAuthenticated, isAdmin, async (req, res) => {
    const alumnoId = req.params.alumnoId;
    try {
        const deleted = await apoderadoController.deleteApoderado(alumnoId);
        if (!deleted) {
            return res.status(404).send('Apoderado no encontrado');
        }

        console.log(`Apoderado eliminado correctamente para alumno ${alumnoId}`);
        res.redirect('/listaAlumnos');
    } catch (error) {
        console.error("Error al eliminar apoderado:", error);
        res.status(500).send('Error interno al eliminar apoderado');
    }
});

module.exports = router;