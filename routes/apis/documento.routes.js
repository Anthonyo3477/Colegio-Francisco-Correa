// routes/documento/documento.routes.js
const express = require('express');
const multer = require('multer');
const documentoController = require('../../db/controllers/documentoController');

const router = express.Router();

// Configuración Multer con memoria (no se guarda en uploads/)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para subir PDF directo a la base de datos
router.post('/upload-matricula', upload.single('documento'), async (req, res) => {
    try {
        const nombre_archivo = req.file.originalname;
        const documento = req.file.buffer;

        await db.query(
            "INSERT INTO matriculas (nombre_archivo, documento) VALUES (?, ?)",
            [nombre_archivo, documento]
        );

        console.log("Matrícula subida:", nombre_archivo);

        res.redirect('/documento-matricula');
    } catch (error) {
        console.error("Error al subir matrícula:", error);
        res.status(500).send("Error al subir matrícula");
    }
});

// Ruta para listar los PDF
router.get('/DocMatricula', documentoController.listarMatriculas);

// Descargar PDF
router.get('/matricula/descargar/:id', documentoController.descargarMatricula);

// Generar PDF automáticamente desde los datos de alumno/apoderado
router.get('/matricula/generar/:idAlumno', documentoController.generarMatriculaPDF);

// Visualizar PDF
router.get('/matricula/ver/:id', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT documento, nombre_archivo FROM matriculas WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send("Matrícula no encontrada");
        }

        const pdfBuffer = rows[0].documento;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${rows[0].nombre_archivo}"`);
        res.send(pdfBuffer);    // el navegador lo abre el PDF en un nueva pestaña de Google
    } catch (error) {
        console.error("Error al mostrar PDF:", error);
        res.status(500).send("Error al mostrar PDF");
    }
});

module.exports = router;