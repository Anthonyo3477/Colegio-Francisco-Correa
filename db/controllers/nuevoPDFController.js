const { PDFDocument } = require('pdf-lib');
const db = require('../conexion');

exports.editarPDF = async (req, res) => {
  try {
    const { documentoId, nombreCompleto, rut, direccion } = req.body;

    // Recuperamos PDF desde DB
    const [rows] = await db.execute(
      'SELECT documento FROM matriculas WHERE id = ?',
      [documentoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const existingPdfBytes = rows[0].documento;

    // Cargar PDF con formulario
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const form = pdfDoc.getForm();

    // Rellenar campos
    form.getTextField('nombreCompleto').setText(nombreCompleto || '');
    form.getTextField('rut').setText(rut || '');
    form.getTextField('direccion').setText(direccion || '');

    // Si quieres, bloquear para que no se pueda cambiar luego:
    // form.flatten();

    const pdfBytes = await pdfDoc.save();

    // Guardar PDF editado en DB
    await db.execute(
      'UPDATE matriculas SET documento = ? WHERE id = ?',
      [pdfBytes, documentoId]
    );

    res.redirect('/DocMatricula');
  } catch (error) {
    console.error('Error al editar PDF:', error);
    res.status(500).json({ error: 'Error al editar el PDF' });
  }
};
