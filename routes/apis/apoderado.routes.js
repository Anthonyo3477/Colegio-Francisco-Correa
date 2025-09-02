const express = require('express');
const router = express.Router();
const apoderadoController = require('../../db/controllers/apoderadoController');

// Middleware para parsear body
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/* ==================================================
   FORMULARIO NUEVO APODERADO
================================================== */
router.get('/nuevo-apoderado/:id', (req, res) => {
    const alumnoId = req.params.id;

    res.render('apoderadoForm', {
        title: 'Registrar Nuevo Apoderado',
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
        const { rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado } = req.body;

        // Validar campos
        if (!rut_apoderado?.trim() || !nombre_apoderado?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !nacionalidad?.trim() || !alumno_id || !telefono?.trim() || !correo_apoderado?.trim()) {
            return res.status(400).render('apoderadoForm', {
                title: 'Registrar Nuevo Apoderado',
                error: 'Todos los campos son obligatorios',
                valores: req.body,
                alumnoId: alumno_id
            });
        }

        // Crear apoderado
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

        // IMPORTANTE: return aquí también
        return res.redirect('/listaAlumnos');

    } catch (error) {
        console.error("Error al guardar apoderado:", error);

        // IMPORTANTE: return aquí también
        return res.status(500).render('apoderadoForm', {
            title: 'Registrar Nuevo Apoderado',
            error: 'Error interno al guardar apoderado',
            valores: req.body,
            alumnoId: req.body.alumno_id
        });
    }
});


module.exports = router;
