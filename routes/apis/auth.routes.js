const express = require('express');
const router = express.Router();
const authController = require('../../db/controllers/authController.js');

// Login
router.post('/login', authController.login);

// Registro
router.post('/register', authController.registrar);

// Logout
router.get('/logout', (req,res) => {
    req.session.destroy(err => {
        if(err) {
            console.log('Error al cerrar la session', err);
            return req.statusCode(500).send('error al cerrar session');
        }
        res.redirect('/InicioSeccion')
    })
})

module.exports = router;