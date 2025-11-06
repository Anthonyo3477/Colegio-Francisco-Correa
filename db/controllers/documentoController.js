const conn = require('../conexion');
const path = require('path');
const fs = require('fs');
const PDFKit = require('pdfkit');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const ExcelJS = require('exceljs');


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
       ORDER BY a.nombreCompleto_alumno ASC`
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
    const [[retiros]] = await conn.execute(`SELECT * FROM retiros WHERE alumno_id = ?`, [idAlumno]);

    // Cargar plantilla PDF base
    const plantillaPath = path.join(__dirname, "../../extras/PDF Modificado Completo.pdf");
    const pdfBytes = fs.readFileSync(plantillaPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fuente Helvetica tamaño 10
    const fontBase = await pdfDoc.embedFont(StandardFonts.Helvetica);

    function setText(fieldName, text, fontSize = 5) {
      try {
        const field = form.getTextField(fieldName);
        if (!field) {
          console.warn(`Campo no encontrado en el PDF: ${fieldName}`);
          return;
        }
        field.setText(text || "");
        field.updateAppearances(fontBase);
      } catch (error) {
        console.warn(`No se puede actualizar este campo: ${fieldName}:`, error.message);
      }
    }

    // =======================
    // DATOS DEL ALUMNO
    // =======================
    setText("nombreCompleto", alumno.nombreCompleto_alumno);
    setText("sexoAlumno", alumno.sexo, 2);
    setText("rutAlumnos", alumno.rut_alumnos);
    setText("cursoAlumno", alumno.curso);
    setText("fechaNacimientoAlumno", alumno.fechaNacimiento_alumno?.toISOString().split("T")[0]);
    setText("edadAlumno", alumno.edadAlumno?.toString());
    setText("domicilioAlumno", alumno.direccion, 4);
    setText("comunaAlumno", alumno.comuna);
    setText("viviendaAlumno", alumno.viveCon);
    setText("nacionalidadAlumno", alumno.nacionalidad);
    setText("ingresoChile", alumno.añoIngresoChile?.toString());
    setText("puebloOriginario", alumno.puebloOriginario, 4);
    setText("quePuebloOriginario", alumno.quePueblo, 4);
    setText("cualEnfermedad", alumno.enfermedad, 4);
    setText("cualesAlergias", alumno.alergias, 4);
    setText("recibeMedicamentos", alumno.medicamentos, 4);
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

    // =======================
    // RETIRO
    // =======================
    if (retiros) {
      setText("nombreRetiro", retiros.nombre_retiro);
      setText("rutRetirado", retiros.rut_retiro);
      setText("parentescoRetiro", retiros.parentesco_retiro);
    }

    // Guardar en base de datos
    form.flatten();
    const pdfFinal = await pdfDoc.save();
    const nombreArchivo = `${alumno.nombreCompleto_alumno}.pdf`;

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

// ==========================================================
// EDITAR PDF DE MANERA VISUAL
// ==========================================================
exports.editarMatriculaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // --------------- Datos del Alumno ---------------
      nombreAlumno, generoAlumno, rutAlumno, fechaNacimiento_alumno,
      edadAlumno, direccionAlumno, comunaAlumno, viveCon,
      nacionalidadAlumno, añoIngreso_chile, puebloOriginario,
      quePueblo, enfermedad, alergias, medicamentos,
      curso, peso, talla,
      // ---------------- Datos socio academico ----------------
      ultimoCurso_aprobado, añoCursado, colegioProcedencia,
      cursoReprobado, beca, proteccionInfantil,
      // ----------------- Datos de los padres -----------------
      nombrePadre, rutPadre, fechaNacimiento_padre, nacionalidadPadre,
      nivelEducacional_padre, trabajoPadre, correoPadre, direccionPadre,
      telefonoPadre,
      nombreMadre, rutMadre, fechaNacimiento_madre, nacionalidadMadre,
      nivelEducacional_madre, trabajoMadre, correoMadre, direccionMadre,
      telefonoMadre,
      // --------------- Datos de los apoderados ---------------
      nombreApoderado, parentescoApoderado, rutApoderado, fechaNacimiento_apoderado,
      telefonoApoderado, correoApoderado, trabajoApoderado, nivelEducacional_apoderado,
      nombreApoderado2, parentescoApoderado2, rutApoderado2, fechaNacimiento_apoderado2,
      telefonoApoderado2, correoApoderado2, trabajoApoderado2, nivelEducacional_apoderado2,
      // --------------------- Datos retiro --------------------
      nombreRetiro, rutRetiro, parentescoRetiro
    } = req.body;

    // Buscar el documento original
    const [rows] = await conn.execute("SELECT documento FROM matriculas WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).send("No se encontró el documento.");

    const pdfBuffer = rows[0].documento;
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;

    // ======================================================================
    // Este apartado solo escribira encima cuando detecte que se
    // Escribio en el, de lo contrrio mantendra solo el mismo datos que esta
    // ======================================================================
    function escribirCampo(texto, x, y, width, height) {
      if (texto && texto.trim() !== "") {
        page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) });
        page.drawText(texto, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }
    }

    // ==========================================================
    // Alumno
    // ==========================================================
    escribirCampo(nombreAlumno, 140, 796, 200, 11);
    escribirCampo(generoAlumno, 70, 782, 60, 11);
    escribirCampo(rutAlumno, 170, 782, 80, 11);
    escribirCampo(fechaNacimiento_alumno, 387, 782, 80, 11);
    escribirCampo(edadAlumno, 510, 782, 50, 11);
    escribirCampo(direccionAlumno, 100, 769, 200, 11);
    escribirCampo(comunaAlumno, 89, 755, 80, 11);
    escribirCampo(viveCon, 277, 755, 100, 11);
    escribirCampo(nacionalidadAlumno, 114, 740, 80, 11);
    escribirCampo(añoIngreso_chile, 398, 740, 80, 11);
    escribirCampo(puebloOriginario, 220, 726, 60, 11);
    escribirCampo(quePueblo, 320, 726, 80, 11);
    escribirCampo(enfermedad, 300, 713, 80, 11);
    escribirCampo(alergias, 248, 698, 200, 11);
    escribirCampo(medicamentos, 315, 685, 80, 11);
    escribirCampo(curso, 370, 852, 80, 11);
    escribirCampo(peso, 70, 671, 30, 11);
    escribirCampo(talla, 160, 671, 30, 11);

    // ==========================================================
    // Socio Academico
    // ==========================================================
    escribirCampo(ultimoCurso_aprobado, 160, 615, 50, 11);
    escribirCampo(añoCursado, 277, 615, 30, 11);
    escribirCampo(colegioProcedencia, 160, 600, 30, 11);
    escribirCampo(cursoReprobado, 430, 600, 30, 11);
    escribirCampo(beca, 310, 585, 80, 11);
    escribirCampo(proteccionInfantil, 425, 545, 80, 11);

    // ==========================================================
    // Padre
    // ==========================================================
    escribirCampo(nombrePadre, 118, 494, 130, 11);
    escribirCampo(rutPadre, 340, 495, 70, 11);
    escribirCampo(fechaNacimiento_padre, 510, 495, 60, 11);
    escribirCampo(nacionalidadPadre, 114, 480, 80, 11);
    escribirCampo(nivelEducacional_padre, 375, 480, 100, 11);
    escribirCampo(trabajoPadre, 139, 466, 105, 11);
    escribirCampo(direccionPadre, 93, 453, 100, 11);
    escribirCampo(telefonoPadre, 436, 452, 100, 11);
    escribirCampo(correoPadre, 390, 466, 150, 11);

    // ==========================================================
    // Madre
    // ==========================================================
    escribirCampo(nombreMadre, 120, 425, 150, 11);
    escribirCampo(rutMadre, 340, 424, 70, 11);
    escribirCampo(fechaNacimiento_madre, 510, 424, 60, 11);
    escribirCampo(nacionalidadMadre, 120, 410, 100, 11);
    escribirCampo(nivelEducacional_madre, 375, 410, 100, 11);
    escribirCampo(trabajoMadre, 139, 396, 100, 11);
    escribirCampo(direccionMadre, 92, 382, 100, 11);
    escribirCampo(telefonoMadre, 436, 382, 100, 11);
    escribirCampo(correoMadre, 390, 396, 100, 11);

    // ==========================================================
    // Apoderado Principal
    // ==========================================================
    escribirCampo(nombreApoderado, 154, 318, 130, 11);
    escribirCampo(parentescoApoderado, 398, 318, 100, 11);
    escribirCampo(rutApoderado, 70, 303, 90, 11);
    escribirCampo(fechaNacimiento_apoderado, 290, 303, 90, 11);
    escribirCampo(telefonoApoderado, 100, 290, 90, 11);
    escribirCampo(correoApoderado, 330, 290, 150, 11);
    escribirCampo(trabajoApoderado, 139, 275, 100, 11);
    escribirCampo(nivelEducacional_apoderado, 350, 275, 100, 11);

    // ==========================================================
    // Apoderado Suplente
    // ==========================================================
    escribirCampo(nombreApoderado2, 154, 235, 130, 11);
    escribirCampo(parentescoApoderado2, 387, 235, 90, 11);
    escribirCampo(rutApoderado2, 70, 219, 90, 11);
    escribirCampo(fechaNacimiento_apoderado2, 290, 219, 90, 11);
    escribirCampo(telefonoApoderado2, 100, 205, 80, 11);
    escribirCampo(correoApoderado2, 330, 205, 90, 11);
    escribirCampo(trabajoApoderado2, 139, 190, 90, 11);
    escribirCampo(nivelEducacional_apoderado2, 350, 190, 90, 11);

    // ==========================================================
    // Apoderado Retiro
    // ==========================================================
    escribirCampo(nombreRetiro, 300, 164, 120, 11);
    escribirCampo(rutRetiro, 70, 148, 90, 11);
    escribirCampo(parentescoRetiro, 280, 148, 100, 11);

    // ==========================================================
    // Guardar
    // ==========================================================
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

// =====================================
// DESCARGAR EXCEL
// =====================================
exports.generarExcel = async function (req, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Lista de Alumnos");

    // -------------------------------------------
    //  Encabezados
    // -------------------------------------------
    worksheet.columns = [
      // ------------------------- Alumno -------------------------
      { header: "Orden de Llegada", key: "orden_llegada", width: 15 },
      { header: "Nombre Completo", key: "nombreCompleto_alumno", width: 30 },
      { header: "RUT", key: "rut_alumnos", width: 15 },
      { header: "Género", key: "sexo", width: 10 },
      { header: "Fecha de Nacimiento", key: "fechaNacimiento_alumno", width: 20 },
      { header: "Edad", key: "edadAlumno", width: 10 },
      { header: "Curso", key: "curso", width: 10 },
      { header: "Enfermedades", key: "enfermedad", width: 30 },
      { header: "Alergias", key: "alergias", width: 30 },
      { header: "Medicamentos", key: "medicamentos", width: 30 },
      { header: "Nacionalidad", key: "nacionalidad", width: 20 },
      { header: "Año que Ingresó a Chile", key: "añoIngresoChile", width: 20 },
      { header: "Fecha de Matrícula", key: "fecha_ingreso", width: 20 },
      { header: "Comuna", key: "comuna", width: 20 },
      { header: "Dirección", key: "direccion", width: 40 },
      { header: "Vive Con", key: "viveCon", width: 20 },
      { header: "Pueblo Originario", key: "puebloOriginario", width: 20 },
      { header: "¿Qué Pueblo?", key: "quePueblo", width: 20 },

      // ------------------------- Apoderado Principal -------------------------
      { header: "Nombre Apoderado Completo", key: "nombre_apoderado", width: 30 },
      { header: "RUT Apoderado", key: "rut_apoderado", width: 20 },
      { header: "Parentesco", key: "parentesco_apoderado", width: 15 },
      { header: "Teléfono", key: "telefono_apoderado", width: 15 },
      { header: "Correo Apoderado", key: "correo_apoderado", width: 30 },

      // ------------------------- Apoderado Suplente -------------------------
      { header: "Nombre Apoderado Suplente", key: "nombreApoderado_suplente", width: 30 },
      { header: "RUT Apoderado Suplente", key: "rut_apoderado_suplente", width: 20 },
      { header: "Parentesco Suplente", key: "parentescoApoderado_suplente", width: 15 },
      { header: "Teléfono Suplente", key: "telefono_suplente", width: 15 },
      { header: "Correo Suplente", key: "correoApoderado_suplente", width: 30 }
    ];

    // -------------------------------------------
    //  Título principal
    // -------------------------------------------
    const totalColumnas = worksheet.columns.length;
    const ultimaColumna = worksheet.getColumn(totalColumnas).letter;
    worksheet.mergeCells(`A1:${ultimaColumna}1`);

    const titulo = worksheet.getCell('A1');
    titulo.value = 'LISTADO DE TODOS LOS ALUMNOS';
    titulo.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titulo.alignment = { horizontal: 'center', vertical: 'middle' };
    titulo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '305496' }
    };
    worksheet.getRow(1).height = 30;

    // -------------------------------------------
    //  Estilos de encabezado
    // -------------------------------------------
    const headers = worksheet.columns.map(col => col.header);
    worksheet.addRow(headers);

    const filaHeaders = worksheet.getRow(2);
    filaHeaders.font = { bold: true, color: { argb: 'FFFFFF' } };
    filaHeaders.alignment = { horizontal: 'center', vertical: 'middle' };
    filaHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    filaHeaders.height = 25;

    // -------------------------------------------
    //  Consulta de datos
    // -------------------------------------------
    const [rows] = await conn.query(`
      SELECT 
        a.orden_llegada,
        a.nombreCompleto_alumno,
        a.rut_alumnos,
        a.sexo,
        a.fechaNacimiento_alumno,
        a.edadAlumno,
        a.curso,
        a.enfermedad,
        a.alergias,
        a.medicamentos,
        a.nacionalidad,
        a.añoIngresoChile,
        a.fecha_ingreso,
        a.comuna,
        a.direccion,
        a.viveCon,
        a.puebloOriginario,
        a.quePueblo,

        -- Apoderado Principal
        p.nombre_apoderado,
        p.parentesco_apoderado,
        p.rut_apoderado,
        p.telefono AS telefono_apoderado,
        p.correo_apoderado,

        -- Apoderado Suplente
        s.nombreApoderado_suplente,
        s.parentescoApoderado_suplente,
        s.rut_apoderado_suplente,
        s.telefono_suplente,
        s.correoApoderado_suplente

      FROM alumno a
      LEFT JOIN apoderados p ON a.id = p.alumno_id
      LEFT JOIN apoderado_suplente s ON a.id = s.alumno_id
      ORDER BY a.orden_llegada ASC
    `);

    // -------------------------------------------
    //  Agregar filas
    // -------------------------------------------
    rows.forEach(alumno => worksheet.addRow(alumno));

    // -------------------------------------------
    //  Bordes y estilo general
    // -------------------------------------------
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      if (rowNumber > 2 && rowNumber % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
          };
        });
      }
    });

    // -------------------------------------------
    // Ajuste automático de ancho
    // -------------------------------------------
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = maxLength < 15 ? 15 : maxLength + 2;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Listado_Alumnos.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error al generar el archivo Excel:", error);
    res.status(500).send("Error al generar el archivo Excel");
  }
};