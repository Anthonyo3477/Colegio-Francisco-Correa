const express = require('express');
const router = express.Router();
const authController = require('../../db/controllers/authController.js');

//Prosesar Login
router.post('/login', authController.login);

//Procesar Registro
router.post('/registrar', authController.registrar);

//Cierre Sesion
router.get('/logout', (req, res) =>{
    req.session.destroy(err =>{
        if (err) {
            console.error('Error al cerrar la sesion:',err);
            return res.status(500).send('Error al cerrar su sesion');
        }
        res.redirect('/InicioSeccion');
    });
});

module.exports = router;