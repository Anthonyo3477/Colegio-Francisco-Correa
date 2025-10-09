const conn = require('../conexion');
const PDFDocument = require('pdfkit');                      // Para generar PDFs nuevos
const { PDFDocument: PDFLib, rgb } = require('pdf-lib');    // Para editar PDFs existentes


// =====================================================
// SUBIR PDF MANUAL (desde formulario)
// =====================================================
exports.subirDocumento = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const nombreArchivo = req.file.originalname;
    const documento = req.file.buffer;

    await conn.execute(
      "INSERT INTO matriculas (nombre_archivo, documento) VALUES (?, ?)",
      [nombreArchivo, documento]
    );

    console.log("Matrícula manual subida:", nombreArchivo);
    res.redirect('/DocMatricula');
  } catch (error) {
    console.error("Error al guardar el documento:", error);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
};


// =====================================================
// LISTAR MATRÍCULAS
// =====================================================
exports.listarMatriculas = async (req, res) => {
  try {
    const [rows] = await conn.execute(
      `SELECT m.id, m.nombre_archivo, m.fecha_subida, 
              a.nombreCompleto_alumno AS alumno_nombre,
              ap.parentesco_apoderado,
              ap.fechaNacimiento_apoderado
       FROM matriculas m
       LEFT JOIN alumno a ON m.alumno_id = a.id
       LEFT JOIN apoderados ap ON ap.alumno_id = a.id
       ORDER BY m.fecha_subida DESC`
    );
    res.render('DocMatricula', { matriculas: rows });
  } catch (error) {
    console.error("Error al listar matrículas:", error);
    res.status(500).send('Error al listar matrículas');
  }
};


// =====================================================
// VISUALIZAR PDF EN EL NAVEGADOR
// =====================================================
exports.verMatricula = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await conn.execute(
      "SELECT documento, nombre_archivo FROM matriculas WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send("Matrícula no encontrada");
    }

    const pdfBuffer = rows[0].documento;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${rows[0].nombre_archivo}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error al mostrar PDF:", error);
    res.status(500).send("Error al mostrar PDF");
  }
};


// =====================================================
// GENERAR O REEMPLAZAR PDF (Alumno + Apoderado)
// =====================================================
exports.generarMatriculaPDF = async (req, res) => {
  try {
    const { idAlumno } = req.params;

    // Buscar alumno
    const [alumnos] = await conn.execute(`SELECT * FROM alumno WHERE id = ?`, [idAlumno]);
    if (alumnos.length === 0) {
      return res.status(404).send("Alumno no encontrado");
    }
    const alumno = alumnos[0];

    // Buscar apoderado
    const [apoderados] = await conn.execute(`SELECT * FROM apoderados WHERE alumno_id = ?`, [idAlumno]);
    const apoderado = apoderados.length > 0 ? apoderados[0] : null;

    // Crear PDF con pdfkit
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      const nombreArchivo = `matricula_${alumno.rut_alumnos}.pdf`;

      await conn.execute(
        `INSERT INTO matriculas (alumno_id, nombre_archivo, documento) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           nombre_archivo = VALUES(nombre_archivo), 
           documento = VALUES(documento), 
           fecha_subida = CURRENT_TIMESTAMP`,
        [alumno.id, nombreArchivo, pdfData]
      );

      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfData);
    });

    // Contenido del PDF
    doc.fontSize(20).text("Ficha de Matrícula", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text("Datos del Alumno");
    doc.fontSize(12)
      .text(`Nombre: ${alumno.nombreCompleto_alumno}`)
      .text(`RUT: ${alumno.rut_alumnos}`)
      .text(`Curso: ${alumno.curso}`)
      .text(`Fecha ingreso: ${alumno.fecha_ingreso}`)
      .text(`Dirección: ${alumno.direccion}, ${alumno.comuna}`);
    doc.moveDown();

    if (apoderado) {
      doc.fontSize(14).text("Datos del Apoderado");
      doc.fontSize(12)
        .text(`Nombre: ${apoderado.nombre_apoderado}`)
        .text(`RUT: ${apoderado.rut_apoderado}`)
        .text(`Teléfono: ${apoderado.telefono}`)
        .text(`Correo: ${apoderado.correo_apoderado}`);
    } else {
      doc.fontSize(14).text("Este alumno aún no tiene apoderado registrado");
    }

    doc.end();
  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send("Error en el servidor");
  }
};


// =====================================================
// REGENERAR PDF
// =====================================================
exports.regenerarMatricula = async (req, res) => {
  try {
    const { idAlumno } = req.params;
    return exports.generarMatriculaPDF(req, res);
  } catch (error) {
    console.error("Error al regenerar PDF:", error);
    res.status(500).send("Error al regenerar PDF");
  }
};


// =====================================================
// DESCARGAR PDF
// =====================================================
exports.descargarMatricula = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await conn.execute(
      'SELECT nombre_archivo, documento FROM matriculas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Archivo no encontrado');
    }

    const { nombre_archivo, documento } = rows[0];

    res.setHeader('Content-Disposition', `attachment; filename="${nombre_archivo}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(documento);
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    res.status(500).send('Error en el servidor');
  }
};


// =====================================================
// ELIMINAR MATRÍCULA
// =====================================================
exports.eliminarMatricula = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await conn.execute("DELETE FROM matriculas WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      console.warn("Matrícula no encontrada para eliminar:", id);
      return res.status(404).send("Matrícula no encontrada");
    }

    console.log("Matrícula eliminada correctamente:", id);
    res.redirect('/DocMatricula');
  } catch (error) {
    console.error("Error al eliminar matrícula:", error);
    res.status(500).send("Error al eliminar matrícula");
  }
};


// =====================================================
// EDITAR PDF EXISTENTE (Matriculas ya cargadas - PDF plano)
// =====================================================
exports.editarMatriculaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // DATOS DEL ALUMNO
      direccionAlumno,
      comunaAlumno,
      viveConAlumno,
      correoAlumno,

      // DATOS DEL PADRE
      direccionPadre,
      telefonoPadre,
      correoPadre,

      // DATOS DE LA MADRE
      direccionMadre,
      telefonoMadre,
      correoMadre,

      // DATOS APODERADO PRINCIPAL
      telefonoApoderado,
      correoApoderado,

      // DATOS APODERADO SUPLENTE
      telefonoApoderado2,
      correoApoderado2
    } = req.body;

    // Obtener PDF de la base de datos
    const [rows] = await conn.execute("SELECT documento FROM matriculas WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).send("No se encontró el documento.");
    }

    const pdfBuffer = rows[0].documento;
    const pdfDoc = await PDFLib.load(pdfBuffer);
    const page = pdfDoc.getPages()[0];

    // Este apartado se encarga de dibuja un cuadro blanco, y encima va el texto que ingresda
    // se maneja a travez de cooredenadas
    // x = horizontal --------
    // y = vertical  
    const fontSize = 12;

    /* ------------------ ALUMNO ------------------ */
    page.drawRectangle({ x: 100, y: 769, width: 200, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionAlumno || "", { x: 100, y: 769, size: 11 });

    page.drawRectangle({ x: 89, y: 755, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(comunaAlumno || "", { x: 89, y: 755, size: 11 });

    page.drawRectangle({ x: 277, y: 755, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(viveConAlumno || "", { x: 280, y: 755, size: 11 });

    /* ------------------ PADRE ------------------ */
    page.drawRectangle({ x: 93, y: 450, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionPadre || "", { x: 93, y: 450, size: 11 });

    page.drawRectangle({ x: 436, y: 450, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoPadre || "", { x: 436, y: 450, size: 11 });

    page.drawRectangle({ x: 390, y: 469, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoPadre || "", { x: 390, y: 469, size: 11 });

    /* ------------------ MADRE ------------------ */
    page.drawRectangle({ x: 92, y: 382, width: 300, height: 14, color: rgb(1, 1, 1) });
    page.drawText(direccionMadre || "", { x: 92, y: 382, size: 11 });

    page.drawRectangle({ x: 400, y: 382, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoMadre || "", { x: 400, y: 382, size: 11 });

    page.drawRectangle({ x: 160, y: 382, width: 150, height: 14, color: rgb(1, 1, 1) });
    page.drawText(correoMadre || "", { x: 160, y: 382, size: fontSize });

    /* ------------------ APODERADO PRINCIPAL ------------------ */
    page.drawRectangle({ x: 400, y: 340, width: 150, height: 14, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado || "", { x: 400, y: 340, size: fontSize });

    page.drawRectangle({ x: 160, y: 320, width: 250, height: 14, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado || "", { x: 160, y: 320, size: fontSize });

    /* ------------------ APODERADO SUPLENTE ------------------ */
    page.drawRectangle({ x: 400, y: 220, width: 150, height: 14, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado2 || "", { x: 400, y: 220, size: fontSize });

    page.drawRectangle({ x: 160, y: 200, width: 250, height: 14, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado2 || "", { x: 160, y: 200, size: fontSize });

    // Guarda el PDF editado
    const pdfEditado = await pdfDoc.save();
    await conn.execute(
      "UPDATE matriculas SET documento = ?, fecha_subida = CURRENT_TIMESTAMP WHERE id = ?",
      [pdfEditado, id]
    );

    console.log("PDF editado correctamente:", id);
    res.redirect('/DocMatricula');
  } catch (error) {
    console.error("Error al editar PDF:", error);
    res.status(500).send("Error al editar PDF");
  }
};