const conn = require('../conexion');
const path = require('path');
const fs = require('fs');
const PDFKit = require('pdfkit');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');


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
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fuente Helvetica tamaño 10
    const fontBase = await pdfDoc.embedFont(StandardFonts.Helvetica);

    function setText(fieldName, text, fontSize = 9) {
      const field = form.getTextField(fieldName);
      if (!field) return;

      field.setText(text || "");

      // Actualizar apariencia con fuente y tamaño
      try {
        field.updateAppearances(fontBase);
        if (field.defaultUpdateAppearances)
          field.defaultUpdateAppearances(fontBase, { fontSize });
      } catch (err) {
        console.warn(`No se pudo actualizar ${fieldName}:`, err.message);
      }
    }

    // =======================
    // DATOS DEL ALUMNO
    // =======================
    setText("nombreCompleto", alumno.nombreCompleto_alumno);
    setText("sexoAlumno", alumno.sexo);
    setText("rutAlumnos", alumno.rut_alumnos);
    setText("cursoAlumno", alumno.curso);
    setText("fechaNacimientoAlumno", alumno.fechaNacimiento_alumno?.toISOString().split("T")[0]);
    setText("edadAlumno", alumno.edadAlumno?.toString());
    setText("domicilioAlumno", alumno.direccion);
    setText("comunaAlumno", alumno.comuna);
    setText("viviendaAlumno", alumno.viveCon);
    setText("nacionalidadAlumno", alumno.nacionalidad);
    setText("ingresoChile", alumno.añoIngresoChile?.toString());
    setText("puebloOriginario", alumno.puebloOriginario);
    setText("quePuebloOriginario", alumno.quePueblo);
    setText("cualEnfermedad", alumno.enfermedad);
    setText("cualesAlergias", alumno.alergias);
    setText("recibeMedicamentos", alumno.medicamentos);
    setText("pesoAlumno", alumno.peso);
    setText("tallaAlumno", alumno.talla);

    // =======================
    // DATOS SOCIO-ACADÉMICOS
    // =======================
    if (datosAcademicos) {
      setText("UltimoCurso", datosAcademicos.ultimo_curso_cursado);
      setText("añoCursado", datosAcademicos.año_cursado?.toString());
      setText("colegioProcedencia", datosAcademicos.colegio_procedencia);
      setText("cursoReprobado", datosAcademicos.cursos_reprobados);
      setText("cualBeca", datosAcademicos.beneficios_beca);
      setText("perteneceProgramaProteccionInfantil", datosAcademicos.proteccion_infantil);
    }

    // =======================
    // PADRE
    // =======================
    if (padre) {
      setText("nombrePadre", padre.nombre_padre);
      setText("rutPadre", padre.rut_padre);
      setText("fechaNacimientoPadre", padre.fechaNacimiento_padre?.toISOString().split("T")[0]);
      setText("nacionalidadPadre", padre.nacionalidad_padre);
      setText("nivelEducacionalPadre", padre.nivelEducacional_padre);
      setText("trabajoPadre", padre.trabajo_padre);
      setText("correoPadre", padre.correo_padre);
      setText("direccionPadre", padre.direccion_padre);
      setText("telefonoPadre", padre.telefono_padre);
    }

    // =======================
    // MADRE
    // =======================
    if (madre) {
      setText("nombreMadre", madre.nombre_madre);
      setText("rutMadre", madre.rut_madre);
      setText("fechaNacimientoMadre", madre.fechaNacimiento_madre?.toISOString().split("T")[0]);
      setText("nacionalidadMadre", madre.nacionalidad_madre);
      setText("nivelEducacionalMadre", madre.nivelEducacional_madre);
      setText("trabajoMadre", madre.trabajo_madre);
      setText("correoMadre", madre.correo_madre);
      setText("direccionMadre", madre.direccion_madre);
      setText("telefonoMadre", madre.telefono_madre);
    }

    // =======================
    // APODERADO PRINCIPAL
    // =======================
    if (apoderado) {
      setText("nombreApoderado", apoderado.nombre_apoderado);
      setText("parentescoApoderado", apoderado.parentesco_apoderado);
      setText("rutApoderado", apoderado.rut_apoderado);
      setText("fechaNacimientoApoderado", apoderado.fechaNacimiento_apoderado?.toISOString().split("T")[0]);
      setText("telefonoApoderado", apoderado.telefono);
      setText("correoApoderado", apoderado.correo_apoderado);
      setText("trabajoApoderado", apoderado.trabajo_apoderado);
      setText("nivelEducacionalApoderado", apoderado.nivelEducacional_apoderado);
    }

    // =======================
    // APODERADO SUPLENTE
    // =======================
    if (apoderado2) {
      setText("nombreApoderado2", apoderado2.nombreApoderado_suplente);
      setText("parentescoApoderado2", apoderado2.parentescoApoderado_suplente);
      setText("rutApoderado2", apoderado2.rut_apoderado_suplente);
      setText("fechaNacimientoApoderado2", apoderado2.fechaNacimiento_apoderado_suplente?.toISOString().split("T")[0]);
      setText("telefonoApoderado2", apoderado2.telefono_suplente);
      setText("correoApoderado2", apoderado2.correoApoderado_suplente);
      setText("trabajoApoderado2", apoderado2.trabajo_apoderado_suplente);
      setText("nivelEducacionalApoderado2", apoderado2.nivelEducacional_apoderado_suplente);
    }

    // Guardar en base de datos
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

    console.log(`Matrícula generada correctamente: ${nombreArchivo}`);
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
// MOSTRAR VISTA EDITAR PDF CON DATOS CARGADOS
// =====================================================
exports.vistaEditarPDF = async (req, res) => {
  try {
    const { idAlumno } = req.params;

    const [[alumno]] = await conn.execute(`SELECT * FROM alumno WHERE id = ?`, [idAlumno]);
    if (!alumno) return res.status(404).send("Alumno no encontrado");

    const [[datosAcademicos]] = await conn.execute(`SELECT * FROM datos_academicos WHERE alumno_id = ?`, [idAlumno]);
    const [[padre]] = await conn.execute(`SELECT * FROM padre WHERE alumno_id = ?`, [idAlumno]);
    const [[madre]] = await conn.execute(`SELECT * FROM madre WHERE alumno_id = ?`, [idAlumno]);
    const [[apoderado]] = await conn.execute(`SELECT * FROM apoderados WHERE alumno_id = ?`, [idAlumno]);
    const [[apoderado2]] = await conn.execute(`SELECT * FROM apoderado_suplente WHERE alumno_id = ?`, [idAlumno]);

    // Construir objeto con todos los datos para el formulario
    const datos = {
      // ALUMNO
      nombreCompleto: alumno.nombreCompleto_alumno,
      sexoAlumno: alumno.sexo,
      rutAlumnos: alumno.rut_alumnos,
      fechaNacimientoAlumno: alumno.fechaNacimiento_alumno?.toISOString().split("T")[0],
      edadAlumno: alumno.edadAlumno,
      domicilioAlumno: alumno.direccion,
      comunaAlumno: alumno.comuna,
      viviendaAlumno: alumno.viveCon,
      trabajo_apoderadoAlumno: alumno.trabajo_apoderadoAlumno,
      ingresoChile: alumno.añoIngresoChile,
      puebloOriginario: alumno.puebloOriginario,
      quePuebloOriginario: alumno.quePueblo,
      cualEnfermedad: alumno.enfermedad,
      cualesAlergias: alumno.alergias,
      recibeMedicamentos: alumno.medicamentos,
      pesoAlumno: alumno.peso,
      tallaAlumno: alumno.talla,

      // DATOS ACADÉMICOS
      UltimoCurso: datosAcademicos?.ultimo_curso_cursado,
      añoCursado: datosAcademicos?.año_cursado,
      colegioProcedencia: datosAcademicos?.colegio_procedencia,
      cursoReprobado: datosAcademicos?.cursos_reprobados,
      cualBeca: datosAcademicos?.beneficios_beca,
      perteneceProgramaProteccionInfantil: datosAcademicos?.proteccion_infantil,

      // PADRE
      nombrePadre: padre?.nombre_padre,
      rutPadre: padre?.rut_padre,
      fechaNacimientoPadre: padre?.fechaNacimiento_padre?.toISOString().split("T")[0],
      trabajo_apoderadoPadre: padre?.trabajo_apoderadoPadre,
      nivelEducacional: padre?.nivelEducacional_padre,
      trabajoPadre: padre?.trabajo_padre,
      correoPadre: padre?.correo_padre,
      direccionPadre: padre?.direccion_padre,
      telefonoPadre: padre?.telefono_padre,

      // MADRE
      nombreMadre: madre?.nombre_madre,
      rutMadre: madre?.rut_madre,
      fechaNacimientoMadre: madre?.fechaNacimiento_madre?.toISOString().split("T")[0],
      trabajo_apoderadoMadre: madre?.trabajo_apoderadoMadre,
      nivelEducacionalMadre: madre?.nivelEducacional_madre,
      trabajoMadre: madre?.trabajo_madre,
      correoMadre: madre?.correo_madre,
      direccionMadre: madre?.direccion_madre,
      telefonoMadre: madre?.telefono_madre,

      // APODERADO PRINCIPAL
      nombre_apoderado: apoderado?.nombre_apoderado,
      parentesco_apoderado: apoderado?.parentesco_apoderado,
      rut_apoderado: apoderado?.rut_apoderado,
      fechaNacimiento_apoderado: apoderado?.fechaNacimiento_apoderado?.toISOString().split("T")[0],
      telefono: apoderado?.telefono,
      correo_apoderado: apoderado?.correo_apoderado,
      trabajo_apoderado: apoderado?.trabajo_apoderado,
      nivelEducacional_apoderado: apoderado?.nivelEducacional_apoderado,

      // APODERADO SUPLENTE
      nombre_apoderado2: apoderado2?.nombreApoderado_suplente,
      parentesco_apoderado2: apoderado2?.parentescoApoderado_suplente,
      rut_apoderado2: apoderado2?.rut_apoderado_suplente,
      fechaNacimiento_apoderado2: apoderado2?.fechaNacimiento_apoderado_suplente?.toISOString().split("T")[0],
      telefono2: apoderado2?.telefono_suplente,
      correo_apoderado2: apoderado2?.correoApoderado_suplente,
      trabajo_apoderado2: apoderado2?.trabajo_apoderado_suplente,
      nivelEducacional_apoderado2: apoderado2?.nivelEducacional_apoderado_suplente,
    };

    res.render('editarPDF', { documentoId: idAlumno, datos });
  } catch (error) {
    console.error("Error al cargar datos para edición:", error);
    res.status(500).send("Error al cargar los datos");
  }
};

// ==========================================================
// EDITAR PDF EXISTENTE DE MANERA VISUAL Y SOLO ALGUNOS DATOS
// ==========================================================
exports.editarMatriculaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      direccionAlumno, 
      comunaAlumno, 
      viveCon,
      direccionPadre, 
      telefonoPadre, 
      correoPadre,
      direccionMadre, 
      telefonoMadre, 
      correoMadre,
      telefonoApoderado, 
      correoApoderado,
      telefonoApoderado2, 
      correoApoderado2
    } = req.body;

    const [rows] = await conn.execute("SELECT documento FROM matriculas WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).send("No se encontró el documento.");

    const pdfBuffer = rows[0].documento;
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;

    // === Alumno ===
    page.drawRectangle({ x: 100, y: 769, width: 200, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionAlumno || "", { x: 100, y: 769, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 89, y: 755, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(comunaAlumno || "", { x: 89, y: 755, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 277, y: 755, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(viveCon || "", { x: 280, y: 755, size: fontSize, font, color: rgb(0, 0, 0) });

    // === Padre ===
    page.drawRectangle({ x: 93, y: 450, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionPadre || "", { x: 93, y: 450, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 436, y: 450, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoPadre || "", { x: 436, y: 450, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 390, y: 469, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoPadre || "", { x: 390, y: 469, size: fontSize, font, color: rgb(0, 0, 0) });

    // === Madre ===
    page.drawRectangle({ x: 92, y: 382, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionMadre || "", { x: 92, y: 382, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 436, y: 382, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoMadre || "", { x: 436, y: 382, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 390, y: 401, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoMadre || "", { x: 390, y: 401, size: fontSize, font, color: rgb(0, 0, 0) });

    // === Apoderado principal ===
    page.drawRectangle({ x: 100, y: 287, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado || "", { x: 100, y: 287, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 330, y: 287, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado || "", { x: 330, y: 287, size: fontSize, font, color: rgb(0, 0, 0) });

    // === Apoderado suplente ===
    page.drawRectangle({ x: 100, y: 205, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado2 || "", { x: 100, y: 205, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 330, y: 205, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado2 || "", { x: 330, y: 205, size: fontSize, font, color: rgb(0, 0, 0) });

    // Guardar y actualizar
    const pdfEditado = await pdfDoc.save();
    await conn.execute(
      "UPDATE matriculas SET documento = ?, fecha_subida = CURRENT_TIMESTAMP WHERE id = ?",
      [pdfEditado, id]
    );

    console.log(`PDF editado correctamente (ID: ${id})`);
    return res.redirect('/DocMatricula');

  } catch (error) {
    console.error("Error al editar PDF:", error);
    res.status(500).send("Error al editar PDF");
  }
};