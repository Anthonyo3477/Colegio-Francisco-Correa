const express = require('express');
const router = express.Router();
const authController = require('../../db/controllers/authController.js');

// Login
router.post('/login', authController.login);

// Registro
router.post('/register', authController.registrar);

// Logout
router.get('/logout', authController.logout);

module.exports = router;