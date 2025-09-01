const express = require('express');
const router = express.Router();
const apoderadoController = require('../../db/controllers/apoderadoController');

// Middleware para parsear body
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Formulario para crear apoderado después de crear un alumno
router.get('/nuevo-apoderado/:id', (req, res) => {
    const alumnoId = req.params.id;

    res.render('apoderado', {
        title: 'Registrar Nuevo Apoderado',
        error: null,
        valores: {},
        alumnoId
    });
});


// Ruta Insert
router.post('/insertApoderado', async (req, res) => {
    try {
        const { rut_apoderado, nombre_apoderado, apellido_paterno, apellido_materno, nacionalidad, alumno_id, telefono, correo_apoderado } = req.body;

        if (!rut_apoderado?.trim() || !nombre_apoderado?.trim() || !apellido_paterno?.trim() || !apellido_materno?.trim() || !nacionalidad?.trim() || !alumno_id || !telefono?.trim() || !correo_apoderado?.trim()
        ) {
            return res.status(400).render('apoderado', {
                title: 'Registrar Nuevo Apoderado',
                error: 'Todos los campos son obligatorios',
                valores: req.body
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
        res.redirect('/listaAlumnos'); // O a donde quieras redirigir
    } catch (error) {
        console.error("Error al guardar apoderado:", error);
        res.status(500).render('apoderado', {
            title: 'Registrar nuevo apoderado',
            error: 'Error al guardar apoderado',
            valores: req.body
        });
    }
});

// Ruta Listar

// Ruta Listar con su alumno correspondiente

// Ruta Modificar

// Ruta Eliminar