const express = require('express');
const router = express.Router();
const nuevoPDFController = require('../../db/controllers/nuevoPDFController');

// SE muestra el formulario de edición
router.get('/editarPDF/:id', async (req, res) => {
    const documentoId = req.params.id;
    res.render('editarPDF', { documentoId, datos: {} }); 
});

// Se procesa el formulario de edición
router.post('/editarPDF', nuevoPDFController.mostrarFormulario);

module.exports = router;
