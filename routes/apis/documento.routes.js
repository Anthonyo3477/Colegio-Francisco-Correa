// routes/documento/documento.routes.js
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
router.get('/matricula/descargar/:id', documentoController.descargarMatricula);

// Generar PDF automáticamente desde los datos de alumno/apoderado
router.get('/matricula/generar/:idAlumno', documentoController.generarMatriculaPDF);

module.exports = router;