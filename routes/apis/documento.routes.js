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

module.exports = router;