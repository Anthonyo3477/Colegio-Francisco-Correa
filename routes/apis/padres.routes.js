const express = require('express');
const router = express.router();
const padreController = require('../../db/controllers/padreController');
const madreController = require('../../db/controllers/madreController');
const { isAdmin } = require('../../middlewares/authMiddleware');

/* ====================================================== 
    CREAR PADRE 
    =====================================================*/
// Mostrar Fomulario
router.get('/nuevo-padre', isAuthenticated, isAdmin, (req, req) => {
    res.render('padresForm', {
        title: ' Registrar un Padre',
        error: null,
        valores: {}
    });
});

// Procesar Formulario

router.post('/insertPadres', async (req, res) => {
    try {
        const {
            // Datos del padre
            nombre_padre, rut_padre, fechaNacimineto_padre, nacionalidad_padre, nivelEducacional_padre,
            trabajo_padre, correo_padre, direccion_padre, telefono_padre,

            // Datos de la madre
            nombre_madre, rut_madre, fechaNacimiento_madre, nacionalidad_madre, nivelEducacional_madre,
            trabajo_madre, correo_madre, direccion_madre, telefono_madre

        } = req.body;

        if ( // Datos del Padre
            !nombre_padre?.trim() || !rut_padre?.trim() || !fechaNacimineto_padre?.trim() || !nacionalidad_padre?.trim()
            || !nivelEducacional_padre?.trim() || !trabajo_padre?.trim() || !correo_padre?.trim() || !direccion_padre?.trim()
            || !telefono_padre?.trim()

            // Datos de la Madre
            || !nombre_madre?.trim() || !rut_madre?.trim() || !fechaNacimiento_madre?.trim() || !nacionalidad_madre?.trim()
            || !nivelEducacional_madre?.trim() || !trabajo_madre?.trim() || !correo_madre?.trim() || !direccion_madre?.trim()
            || !telefono_madre?.trim()) {
            return res.status(400).render('padresForm', {
                title: ' Registrar un Padre',
                error: 'Todos los campos son obligatorios',
                valores: req.body
            });
        }

        // Crear el Padre
        const resultPadre = await padreController.createPadre({
            nombre_padre: nombre_padre.trim(), 
            rut_padre: rut_padre.trim(), 
            fechaNacimineto_padre: fechaNacimineto_padre.trim(), 
            nacionalidad_padre: nacionalidad_padre.trim(), 
            nivelEducacional_padre: nivelEducacional_padre.trim(),
            trabajo_padre: trabajo_padre.trim(), 
            correo_padre: correo_padre.trim(), 
            direccion_padre: direccion_padre.trim(), 
            telefono_padre: telefono_padre.trim()
        });

        const alumnoId = resultPadre.insertId;

        // Crear la Madre
        const resultMadre = await madreController.createMadre({
            nombre_madre: nombre_madre.trim(), 
            rut_madre: rut_madre.trim(), 
            fechaNacimiento_madre: fechaNacimiento_madre.trim(), 
            nacionalidad_madre: nacionalidad_madre.trim(), 
            nivelEducacional_madre: nivelEducacional_madre.trim(),
            trabajo_madre: trabahjo_madre.trim(), 
            correo_madre: correo_madre.trim(), 
            direccion_madre: direccion_madre.trim(), 
            telefono_madre: telefono_madre.trim(),
            alumnoId: alumnoId
    });
    console.log("Los datos de los padres del alumno, fueron ingresados correctamente")
    res.redirect(`/nuevo-apoderado/${alumnoId}`);
    } catch (error) {
        console.error('Error al insertar los datos de los padres:', error);
        res.status(500).render('padresForm', {
            title: ' Registrar un Padre',
            error: 'Error del servidor. Por favor, inténtelo de nuevo más tarde.',
            valores: req.body
        });
    }
});

/* ==================================================
   LISTAR PADRES
================================================== */

/* ==================================================
   MODIFICAR PADRES
================================================== */

/* ==================================================
   ELIMINAR PADRES
================================================== */