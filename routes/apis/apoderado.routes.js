const express = require('express');
const router = express.Router();
const apoderadoController = require('../../db/controllers/apoderadoController');

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
        const { rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno,
                nacionalidad, alumno_id, telefono, correo_apoderado } = req.body;

        if (!rut_apoderado?.trim() || !nombre_apoderado?.trim() || !apellido_paterno?.trim() || 
            !apellido_materno?.trim() || !nacionalidad?.trim() || !alumno_id || 
            !telefono?.trim() || !correo_apoderado?.trim()) {
            
            return res.status(400).render('apoderadoForm', {
                title: 'Registrar Nuevo Apoderado',
                error: 'Todos los campos son obligatorios',
                valores: req.body,
                alumnoId: alumno_id
            });
        }

        await apoderadoController.createApoderado({
            rut_apoderado: rut_apoderado.trim(),
            nombre_apoderado: nombre_apoderado.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno.trim(),
            nacionalidad: nacionalidad.trim(),
            alumno_id,
            telefono: telefono.trim(),
            correo_apoderado: correo_apoderado.trim()
        });

        console.log("Apoderado creado correctamente:", rut_apoderado);
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
router.get('/editar/:alumnoId', async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const apoderado = await apoderadoController.getByAlumnoId(alumnoId);

        if (!apoderado) {
            return res.render('EditarApoderado', {
                error: 'Este alumno no tiene un apoderado asignado',
                apoderado: { alumno_id: alumnoId }
            });
        }

        res.render('EditarApoderado', { apoderado, error: null });
    } catch (err) {
        console.error("Error al obtener apoderado", err);
        res.render('EditarApoderado', {
            error: 'Error al cargar apoderado',
            apoderado: null
        });
    }
});

/* ==================================================
   PROCESO ACTUALIZAR APODERADO
================================================== */
router.post('/actualizar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await apoderadoController.updateApoderado(id, req.body);
        res.redirect('/listaAlumnos');
    } catch (err) {
        console.error("Error al actualizar apoderado", err);
        res.render('EditarApoderado', {
            error: 'Error al actualizar el apoderado',
            apoderado: req.body
        });
    }
});

module.exports = router;