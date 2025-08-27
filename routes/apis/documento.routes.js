const express = require('express');
const multer = require('multer');
const path = require('path');
const documentoController = require('../../db/controllers/documentoController');

const router = express.Router();

// Configuración multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF.'), false);
    }
};

const upload = multer({ storage, fileFilter });

// Ruta para subir PDF
router.post('/upload-matricula', upload.single('documento'), documentoController.subirDocumento);

module.exports = router;