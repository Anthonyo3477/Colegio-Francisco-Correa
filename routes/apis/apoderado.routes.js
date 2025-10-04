const express = require('express');
const router = express.Router();
const apoderadoController = require('../../db/controllers/apoderadoController');
const apoderadoSuplenteController = require('../../db/controllers/apoderadoSuplenteController');

/* ==================================================
   FORMULARIO NUEVO APODERADO
================================================== */
router.get('/nuevo-apoderado/:alumnoId',(req, res) => {
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
        
        /* ===== VALIDAR APODERADO TITULAR ===== */
        if (
            !rut_apoderado?.trim() ||
            !nombre_apoderado?.trim() ||
            !parentesco_apoderado?.trim() ||
            !fechaNacimiento_apoderado?.trim() ||
            !trabajo_apoderado?.trim() ||
            !nivelEducacional_apoderado?.trim() ||
            !alumno_id ||
            !telefono?.trim() ||
            !correo_apoderado?.trim()
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

        /* ===== APODERADO SUPLENTE (OPCIONAL) ===== */
        if (
            rut_apoderado_suplente?.trim() &&
            nombreApoderado_suplente?.trim() &&
            parentescoApoderado_suplente?.trim()
        ) {
            const resultApoderadoSuplente = await apoderadoSuplenteController.createApoderadoSuplente({
                nombreApoderado_suplente: nombreApoderado_suplente.trim(),
                parentescoApoderado_suplente: parentescoApoderado_suplente.trim(),
                rut_apoderado_suplente: rut_apoderado_suplente.trim(),
                fechaNacimiento_apoderado_suplente: fechaNacimiento_apoderado_suplente.trim(),
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
router.get('/editar-apoderado/:alumnoId', async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const apoderado = await apoderadoController.getByAlumnoId(alumnoId);

        if (!apoderado) {
            return res.render('editarApoderado', {
                error: 'Este alumno no tiene un apoderado asignado',
                apoderado: { alumno_id: alumnoId }
            });
        }

        res.render('editarApoderado', { apoderado, error: null });
    } catch (err) {
        console.error("Error al obtener apoderado", err);
        res.render('editarApoderado', {
            error: 'Error al cargar apoderado',
            apoderado: null
        });
    }
});

/* ==================================================
   PROCESO ACTUALIZAR APODERADO
================================================== */
router.post('/actualizar-apoderado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await apoderadoController.updateApoderado(id, req.body);
        res.redirect('/listaAlumnos');
    } catch (err) {
        console.error("Error al actualizar apoderado", err);
        res.render('editarApoderado', {
            error: 'Error al actualizar el apoderado',
            apoderado: { id, ...req.body }
        });
    }
});

module.exports = router;