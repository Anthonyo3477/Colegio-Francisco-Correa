const express = require('express');
const router = express.Router();
const nuevoPDFController = require('../../db/controllers/nuevoPDFController');

// Mostrar el formulario de edición
router.get('/editarPDF/:id', nuevoPDFController.mostrarFormulario);

// Procesar la edición del PDF
router.post('/editarPDF', nuevoPDFController.editarPDF);

module.exports = router;