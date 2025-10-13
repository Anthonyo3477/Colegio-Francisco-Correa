const conn = require('../../db/conexion');
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

// ==============================
// ELIMINAR PDF
// ==============================
router.get('/eliminar/:id', documentoController.eliminarMatricula);

// ==============================
// EDITAR PDF (Solo algunos campos)
// este apartado solo edita algunos datos como el telefono, direccion, comuna, y con quien vive el alumno
// ==============================
router.get('/matricula/editarVisual/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await conn.execute('SELECT id, nombre_archivo FROM matriculas WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).send('Documento no encontrado');
    }

    const matricula = rows[0];
    res.render('editarPDFVisual', { matricula }); // Renderiza tu vista correcta
  } catch (error) {
    console.error('Error al cargar formulario de edición visual:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// === GUARDAR CAMBIOS EN EL PDF EXISTENTE ===
router.post('/matricula/editarPDFVisual/:id', documentoController.editarMatriculaPDF);

module.exports = router;