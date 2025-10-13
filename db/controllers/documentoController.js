const conn = require('../conexion');
const path = require('path');
const fs = require('fs');
const PDFKit = require('pdfkit'); // Renombrado para evitar confusión
const { PDFDocument: PDFLib, rgb } = require('pdf-lib');

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
// GENERAR O REEMPLAZAR PDF DESDE PLANTILLA EXISTENTE
// =====================================================
exports.generarMatriculaPDF = async (req, res) => {
  try {
    const { idAlumno } = req.params;

    // Obtener datos desde la base de datos 
    const [[alumno]] = await conn.execute(`SELECT * FROM alumno WHERE id = ?`, [idAlumno]);
    if (!alumno) return res.status(404).send("Alumno no encontrado");

    const [[datosAcademicos]] = await conn.execute(`SELECT * FROM datos_academicos WHERE alumno_id = ?`, [idAlumno]);
    const [[padre]] = await conn.execute(`SELECT * FROM padre WHERE alumno_id = ?`, [idAlumno]);
    const [[madre]] = await conn.execute(`SELECT * FROM madre WHERE alumno_id = ?`, [idAlumno]);
    const [[apoderado]] = await conn.execute(`SELECT * FROM apoderados WHERE alumno_id = ?`, [idAlumno]);
    const [[apoderado2]] = await conn.execute(`SELECT * FROM apoderado_suplente WHERE alumno_id = ?`, [idAlumno]);

    // Cargar plantilla PDF base
    const plantillaPath = path.join(__dirname, "../../extras/PDF Modificado.pdf");
    const pdfBytes = fs.readFileSync(plantillaPath);
    const pdfDoc = await PDFLib.load(pdfBytes);
    const form = pdfDoc.getForm();

    // =======================
    // DATOS DEL ALUMNO
    // =======================
    form.getTextField("nombreCompleto").setText(alumno.nombreCompleto_alumno || "");
    form.getTextField("sexoAlumno").setText(alumno.sexo || "");
    form.getTextField("rutAlumnos").setText(alumno.rut_alumnos || "");
    form.getTextField("cursoAlumno").setText(alumno.curso || "");
    form.getTextField("fechaNacimientoAlumno").setText(alumno.fechaNacimiento_alumno?.toISOString().split("T")[0] || "");
    form.getTextField("edadAlumno").setText(alumno.edadAlumno?.toString() || "");
    form.getTextField("domicilioAlumno").setText(alumno.direccion || "");
    form.getTextField("comunaAlumno").setText(alumno.comuna || "");
    form.getTextField("viviendaAlumno").setText(alumno.viveCon || "");
    form.getTextField("nacionalidadAlumno").setText(alumno.nacionalidad || "");
    form.getTextField("ingresoChile").setText(alumno.añoIngresoChile?.toString() || "");
    form.getTextField("puebloOriginario").setText(alumno.puebloOriginario || "");
    form.getTextField("quePuebloOriginario").setText(alumno.quePueblo || "");
    form.getTextField("cualEnfermedad").setText(alumno.enfermedad || "");
    form.getTextField("cualesAlergias").setText(alumno.alergias || "");
    form.getTextField("recibeMedicamentos").setText(alumno.medicamentos || "");
    form.getTextField("pesoAlumno").setText(alumno.peso || "");
    form.getTextField("tallaAlumno").setText(alumno.talla || "");

    // =======================
    // DATOS SOCIO-ACADÉMICOS
    // =======================
    if (datosAcademicos) {
      form.getTextField("UltimoCurso").setText(datosAcademicos.ultimo_curso_cursado || "");
      form.getTextField("añoCursado").setText(datosAcademicos.año_cursado?.toString() || "");
      form.getTextField("colegioProcedencia").setText(datosAcademicos.colegio_procedencia || "");
      form.getTextField("cursoReprobado").setText(datosAcademicos.cursos_reprobados || "");
      form.getTextField("cualBeca").setText(datosAcademicos.beneficios_beca || "");
      form.getTextField("perteneceProgramaProteccionInfantil").setText(datosAcademicos.proteccion_infantil || "");
    }

    // =======================
    // PADRE
    // =======================
    if (padre) {
      form.getTextField("nombrePadre").setText(padre.nombre_padre || "");
      form.getTextField("rutPadre").setText(padre.rut_padre || "");
      form.getTextField("fechaNacimientoPadre").setText(padre.fechaNacimiento_padre?.toISOString().split("T")[0] || "");
      form.getTextField("nacionalidadPadre").setText(padre.nacionalidad_padre || "");
      form.getTextField("nivelEducacionalPadre").setText(padre.nivelEducacional_padre || "");
      form.getTextField("trabajoPadre").setText(padre.trabajo_padre || "");
      form.getTextField("correoPadre").setText(padre.correo_padre || "");
      form.getTextField("direccionPadre").setText(padre.direccion_padre || "");
      form.getTextField("telefonoPadre").setText(padre.telefono_padre || "");
    }

    // =======================
    // MADRE
    // =======================
    if (madre) {
      form.getTextField("nombreMadre").setText(madre.nombre_madre || "");
      form.getTextField("rutMadre").setText(madre.rut_madre || "");
      form.getTextField("fechaNacimientoMadre").setText(madre.fechaNacimiento_madre?.toISOString().split("T")[0] || "");
      form.getTextField("nacionalidadMadre").setText(madre.nacionalidad_madre || "");
      form.getTextField("nivelEducacionalMadre").setText(madre.nivelEducacional_madre || "");
      form.getTextField("trabajoMadre").setText(madre.trabajo_madre || "");
      form.getTextField("correoMadre").setText(madre.correo_madre || "");
      form.getTextField("direccionMadre").setText(madre.direccion_madre || "");
      form.getTextField("telefonoMadre").setText(madre.telefono_madre || "");
    }

    // =======================
    // APODERADO PRINCIPAL
    // =======================
    if (apoderado) {
      form.getTextField("nombreApoderado").setText(apoderado.nombre_apoderado || "");
      form.getTextField("parentescoApoderado").setText(apoderado.parentesco_apoderado || "");
      form.getTextField("rutApoderado").setText(apoderado.rut_apoderado || "");
      form.getTextField("fechaNacimientoApoderado").setText(apoderado.fechaNacimiento_apoderado?.toISOString().split("T")[0] || "");
      form.getTextField("telefonoApoderado").setText(apoderado.telefono || "");
      form.getTextField("correoApoderado").setText(apoderado.correo_apoderado || "");
      form.getTextField("trabajoApoderado").setText(apoderado.trabajo_apoderado || "");
      form.getTextField("nivelEducacionalApoderado").setText(apoderado.nivelEducacional_apoderado || "");
    }

    // =======================
    // APODERADO SUPLENTE
    // =======================
    if (apoderado2) {
      form.getTextField("nombreApoderado2").setText(apoderado2.nombreApoderado_suplente || "");
      form.getTextField("parentescoApoderado2").setText(apoderado2.parentescoApoderado_suplente || "");
      form.getTextField("rutApoderado2").setText(apoderado2.rut_apoderado_suplente || "");
      form.getTextField("fechaNacimientoApoderado2").setText(apoderado2.fechaNacimiento_apoderado_suplente?.toISOString().split("T")[0] || "");
      form.getTextField("telefonoApoderado2").setText(apoderado2.telefono_suplente || "");
      form.getTextField("correoApoderado2").setText(apoderado2.correoApoderado_suplente || "");
      form.getTextField("trabajoApoderado2").setText(apoderado2.trabajo_apoderado_suplente || "");
      form.getTextField("nivelEducacionalApoderado2").setText(apoderado2.nivelEducacional_apoderado_suplente || "");
    }

    // =======================
    // Guardar en base de datos (NO DESCARGAR)
    // =======================
    form.flatten();
    const pdfFinal = await pdfDoc.save();
    const nombreArchivo = `matricula_${alumno.nombreCompleto_alumno}.pdf`;

    await conn.execute(
      `INSERT INTO matriculas (alumno_id, nombre_archivo, documento)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nombre_archivo = VALUES(nombre_archivo),
         documento = VALUES(documento),
         fecha_subida = CURRENT_TIMESTAMP`,
      [alumno.id, nombreArchivo, pdfFinal]
    );

    console.log(`Matrícula generada y guardada: ${nombreArchivo}`);
    res.redirect('/DocMatricula');

  } catch (error) {
    console.error("Error al generar PDF:", error);
    res.status(500).send("Error al generar PDF");
  }
};

// =====================================================
// REGENERAR PDF
// =====================================================
exports.regenerarMatricula = async (req, res) => {
  try {
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
    if (rows.length === 0) return res.status(404).send('Archivo no encontrado');

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

    if (result.affectedRows === 0) return res.status(404).send("Matrícula no encontrada");

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
    page.drawRectangle({ x: 92, y: 382, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionMadre || "", { x: 92, y: 382, size: 11 });

    page.drawRectangle({ x: 436, y: 382, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoMadre || "", { x: 436, y: 382, size: 11 });

    page.drawRectangle({ x: 390, y: 401, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoMadre || "", { x: 390, y: 401, size: 11 });

    /* ------------------ APODERADO PRINCIPAL ------------------ */
    page.drawRectangle({ x: 100, y: 287, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado || "", { x: 100, y: 287, size: 11 });

    page.drawRectangle({ x: 330, y: 287, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado || "", { x: 330, y: 287, size: 11 });

    /* ------------------ APODERADO SUPLENTE ------------------ */
    page.drawRectangle({ x: 100, y: 205, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado2 || "", { x: 100, y: 205, size: 11 });

    page.drawRectangle({ x: 330, y: 205, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado2 || "", { x: 330, y: 205, size: 11 });

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