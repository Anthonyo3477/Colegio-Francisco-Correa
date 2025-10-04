const express = require('express');
const router = express.Router();
const padreController = require('../../db/controllers/padreController');
const madreController = require('../../db/controllers/madreController');
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware');

/* ====================================================== 
    CREAR PADRE Y MADRE
======================================================*/
// Mostrar formulario
router.get('/nuevo-padres/:alumnoId', isAuthenticated, isAdmin, (req, res) => {
    const { alumnoId } = req.params;
    res.render('padresForm', {
        title: 'Registrar Padres',
        error: null,
        valores: {},
        alumnoId
    });
});

// Procesar formulario
router.post('/insertPadres', async (req, res) => {
    try {
        // Log de lo que llega del formulario
        console.log("Datos recibidos en req.body:", req.body);

        const {
            alumno_id, // viene desde el form oculto

            // Datos del padre
            nombre_padre, rut_padre, fechaNacimiento_padre, nacionalidad_padre,
            nivelEducacional_padre, trabajo_padre, correo_padre, direccion_padre, telefono_padre,

            // Datos de la madre
            nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre,
            nivelEducacional_madre, trabajo_madre, correo_madre, direccion_madre, telefono_madre
        } = req.body;

        // Validación
        if (
            !alumno_id ||
            !nombre_padre?.trim() || !rut_padre?.trim() || !fechaNacimiento_padre?.trim() || !nacionalidad_padre?.trim() ||
            !nivelEducacional_padre?.trim() || !trabajo_padre?.trim() || !correo_padre?.trim() || !direccion_padre?.trim() ||
            !telefono_padre?.trim() ||
            !nombre_madre?.trim() || !rut_madre?.trim() || !fechaNacimiento_madre?.trim() || !nacionalidad_madre?.trim() ||
            !nivelEducacional_madre?.trim() || !trabajo_madre?.trim() || !correo_madre?.trim() || !direccion_madre?.trim() ||
            !telefono_madre?.trim()
        ) {
            console.warn("Validación fallida: faltan datos obligatorios.");
            return res.status(400).render('padresForm', {
                title: 'Registrar Padres',
                error: 'Todos los campos son obligatorios',
                valores: req.body,
                alumnoId: alumno_id
            });
        }

        // Crear Padre
        const resultPadre = await padreController.createPadre({
            nombre_padre: nombre_padre.trim(),
            rut_padre: rut_padre.trim(),
            fechaNacimiento_padre: fechaNacimiento_padre.trim(),
            nacionalidad_padre: nacionalidad_padre.trim(),
            nivelEducacional_padre: nivelEducacional_padre.trim(),
            trabajo_padre: trabajo_padre.trim(),
            correo_padre: correo_padre.trim(),
            direccion_padre: direccion_padre.trim(),
            telefono_padre: telefono_padre.trim(),
            alumno_id
        });
        console.log("Padre insertado correctamente:", resultPadre);

        // Crear Madre
        const resultMadre = await madreController.createMadre({
            nombre_madre: nombre_madre.trim(),
            rut_madre: rut_madre.trim(),
            fechaNacimiento_madre: fechaNacimiento_madre.trim(),
            nacionalidad_madre: nacionalidad_madre.trim(),
            nivelEducacional_madre: nivelEducacional_madre.trim(),
            trabajo_madre: trabajo_madre.trim(),
            correo_madre: correo_madre.trim(),
            direccion_madre: direccion_madre.trim(),
            telefono_madre: telefono_madre.trim(),
            alumno_id
        });
        console.log("Madre insertada correctamente:", resultMadre);

        console.log("Padre y Madre insertados para el alumno:", alumno_id);
        res.redirect(`/nuevo-apoderado/${alumno_id}`);

    } catch (error) {
        console.error('Error al insertar los datos de los padres:', error);
        res.status(500).render('padresForm', {
            title: 'Registrar Padres',
            error: 'Error del servidor. Por favor, inténtelo de nuevo más tarde.',
            valores: req.body,
            alumnoId: req.body.alumno_id
        });
    }
});


/* ================================================== 
   LISTAR PADRES Y MADRES 
================================================== */
router.get('/listaPadres', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Idealmente deberías crear un método en el controller que haga JOIN entre padres y madres
        const padres = await padreController.getAllPadresConMadres();

        res.render('listaPadres', {
            title: 'Lista de Padres y Madres',
            padres
        });
    } catch (error) {
        console.error('Error al obtener la lista de padres y madres:', error);
        res.status(500).send('Error del servidor. Por favor, inténtelo de nuevo más tarde.');
    }
});

/* ================================================== 
   EDITAR PADRES
================================================== */
router.get('/editar-padres/:alumnoId', isAuthenticated, isAdmin, async (req, res) => {
    const alumnoId = req.params.alumnoId;
    console.log("AlumnoId recibido para editar padres:", alumnoId);

    try {
        const padre = await padreController.getPadreByAlumnoId(alumnoId);
        const madre = await madreController.getMadreByAlumnoId(alumnoId);

        if (!padre || !madre) {
            return res.status(404).send('Padre o Madre no encontrado');
        }

        res.render('EditarPadres', {
            title: 'Editar Padres',
            error: null,
            valores: { padre, madre },
            alumnoId
        })
    } catch (error) {
        console.error('Error al obtener los datos de los padres:', error);
        res.status(500).send('Error del servidor. Por favor, inténtelo de nuevo más tarde.');
    }
});

router.post('/actualizar-padres/:alumnoId', isAuthenticated, isAdmin, async (req, res) => {
    const alumnoId = req.params.alumnoId;
    try {
        const {
            // padre
            nombre_padre, rut_padre, fechaNacimiento_padre, nacionalidad_padre,
            nivelEducacional_padre, trabajo_padre, correo_padre, direccion_padre, telefono_padre,
            // madre
            nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre,
            nivelEducacional_madre, trabajo_madre, correo_madre, direccion_madre, telefono_madre
        } = req.body;

        // validación corregida
        if (
            !nombre_padre?.trim() || !rut_padre?.trim() || !fechaNacimiento_padre?.trim() || !nacionalidad_padre?.trim() ||
            !nivelEducacional_padre?.trim() || !trabajo_padre?.trim() || !correo_padre?.trim() || !direccion_padre?.trim() || !telefono_padre?.trim() ||
            
            !nombre_madre?.trim() || !rut_madre?.trim() || !fechaNacimiento_madre?.trim() || !nacionalidad_madre?.trim() ||
            !nivelEducacional_madre?.trim() || !trabajo_madre?.trim() || !correo_madre?.trim() || !direccion_madre?.trim() || !telefono_madre?.trim()
        ) {
            return res.status(400).render('EditarPadres', {
                title: 'Editar Padres',
                error: 'Todos los campos son obligatorios',
                valores: req.body,
                alumnoId
            });
        }

        await padreController.updatePadreByAlumnoId(alumnoId, { ...req.body });
        await madreController.updateMadreByAlumnoId(alumnoId, { ...req.body });

        console.log("Padres actualizados correctamente para el alumno:", alumnoId);
        res.redirect('/listaPadres');

    } catch (error) {
        console.error('Error al actualizar los datos de los padres:', error);
        res.status(500).render('EditarPadres', {
            title: 'Editar Padres',
            error: 'Error del servidor. Por favor, inténtelo de nuevo más tarde.',
            valores: req.body,
            alumnoId
        });
    }
});

/* ================================================== 
   ELIMINAR PADRES 
================================================== */
router.post('/eliminar/:alumnoId', async (req, res) => {
    const alumnoId = req.params.alumnoId;
    try {
        await padreController.deletePadreByAlumnoId(alumnoId);
        await madreController.deleteMadreByAlumnoId(alumnoId);

        console.log("Padres eliminados correctamente para alumno:", alumnoId);
        res.redirect('/listaAlumnos?deleted=1');
    } catch (error) {
        console.error('Error al eliminar padres:', error);
        res.status(500).render('error', { message: 'Error al eliminar padres' });
    }
});


module.exports = router;