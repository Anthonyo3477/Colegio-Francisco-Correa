// routes/documento/documento.route.js
const express = require('express');
const multer = require('multer');
const documentoController = require('../../db/controllers/documentoController');

const router = express.Router();

// Configuración Multer con memoria (no se guarda en uploads/)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para subir PDF directo a la base de datos
router.post('/upload-matricula', upload.single('documento'), documentoController.subirDocumento);

// Ruta para listar los PDF
router.get('/DocMatricula', documentoController.listarMatriculas);

// Descargar PDF
// Ojo hay problemas en la ruta
router.get('/matricula/descargar/:id', documentoController.descargarMatricula);

// Eliminar PDF
// router.get('/matriculas/eliminar/:id', documentoController.eliminarMatricula);

module.exports = router;