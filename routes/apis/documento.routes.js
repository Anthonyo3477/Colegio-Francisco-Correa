const express = require('express');
const multer = require('multer');
const documentoController = require('../../db/controllers/documentoController');

const router = express.Router();

// Configuración de multer en memoria (PDFs no se guardan en disco)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==============================
//  SUBIDA DE PDF
// ==============================
router.post(
    '/upload-matricula',
    upload.single('documento'),
    documentoController.subirDocumento
);

// ==============================
// LISTADO DE MATRÍCULAS
// ==============================
router.get('/DocMatricula', documentoController.listarMatriculas);

// ==============================
// DESCARGAR PDF
// ==============================
router.get('/matricula/descargar/:id', documentoController.descargarMatricula);

// ==============================
// GENERAR PDF desde alumno/apoderado
// ==============================
router.get('/matricula/generar/:idAlumno', documentoController.generarMatriculaPDF);

// ==============================
// VISUALIZAR PDF en navegador
// ==============================
router.get('/matricula/ver/:id', documentoController.verMatricula);

module.exports = router;