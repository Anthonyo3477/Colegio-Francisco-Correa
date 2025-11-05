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
      }catch (error) {
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
    setText("cualesAlergias", alumno.alergias,4 );
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
    if (retiros){
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
// EDITAR PDF EXISTENTE DE MANERA VISUAL Y SOLO ALGUNOS DATOS
// ==========================================================
exports.editarMatriculaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // --------------- Datos del Alumno ---------------
      nombreAlumno,
      generoAlumno,
      rutAlumno,
      fechaNacimiento_alumno,
      edadAlumno,
      direccionAlumno, 
      comunaAlumno, 
      viveCon,
      nacionalidadAlumno,
      añoIngreso_chile,
      puebloOriginario,
      quePueblo,
      enfermedad,
      alergias,
      medicamentos,
      curso,
      peso,
      talla,
      // -------------------------------------------------------
      // ---------------- Datos socio academico ----------------
      ultimoCurso_aprobado,
      añoCursado,
      colegioProcedencia,
      cursoReprobado,
      beca,
      proteccionInfantil,
      // -------------------------------------------------------
      // ----------------- Datos de los padres -----------------
      nombrePadre,
      rutPadre,
      fechaNacimiento_padre,
      nacionalidadPadre,
      nivelEducacional_padre,
      trabajoPadre,
      correoPadre,
      direccionPadre, 
      telefonoPadre, 

      nombreMadre,
      rutMadre,
      fechaNacimiento_madre,
      nacionalidadMadre,
      nivelEducacional_madre,
      trabajoMadre,
      correoMadre,
      direccionMadre, 
      telefonoMadre, 
      // -------------------------------------------------------
      // --------------- Datos de los apoderados ---------------
      nombreApoderado,
      parentescoApoderado,
      rutApoderado,
      fechaNacimiento_apoderado,
      telefonoApoderado, 
      correoApoderado,
      trabajoApoderado,
      nivelEducacional_apoderado,

      nombreApoderado2,
      parentescoApoderado2,
      rutApoderado2,
      fechaNacimiento_apoderado2,
      telefonoApoderado2, 
      correoApoderado2,
      trabajoApoderado2,
      nivelEducacional_apoderado2,
      // -------------------------------------------------------
      // --------------------- Datos retiro --------------------
      nombreRetiro,
      rutRetiro,
      parentescoRetiro
      // -------------------------------------------------------
    } = req.body;

    const [rows] = await conn.execute("SELECT documento FROM matriculas WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).send("No se encontró el documento.");

    const pdfBuffer = rows[0].documento;
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;

    // ------------------------ Alumno ------------------------
    // X = hacia la Derecha y Izquerda
    // X = + Derecha, - Izquerda
    // Y = hacia Arriba y Abajo
    // Y = + Arriba, - Abajo
    // --------------------------------------------------------

    page.drawRectangle({ x: 140, y: 796, width: 200, height: 11, color: rgb(1, 1, 1) })
    page.drawText( nombreAlumno || "", { x: 140, y: 796, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 70, y: 782, width: 60, height: 11, color: rgb(1, 1, 1) })
    page.drawText( generoAlumno || "", { x: 70, y: 782, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 170, y: 782, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( rutAlumno || "", { x: 170, y: 782, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 387, y: 782, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( fechaNacimiento_alumno || "", { x: 387, y: 782, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 510, y: 782, width: 50, height: 11, color: rgb(1, 1, 1) })
    page.drawText( edadAlumno || "", { x: 510, y: 782, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 100, y: 769, width: 200, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionAlumno || "", { x: 100, y: 769, size: fontSize, font, color: rgb(0, 0, 0) });
    
    page.drawRectangle({ x: 89, y: 755, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(comunaAlumno || "", { x: 89, y: 755, size: fontSize, font, color: rgb(0, 0, 0) });
    
    page.drawRectangle({ x: 277, y: 755, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(viveCon || "", { x: 280, y: 755, size: fontSize, font, color: rgb(0, 0, 0) });
    
    page.drawRectangle({ x: 114, y: 740, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( nacionalidadAlumno || "", { x: 114, y: 740, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 398, y: 740, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( añoIngreso_chile || "", { x: 398, y: 740, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 220, y: 726, width: 60, height: 11, color: rgb(1, 1, 1) })
    page.drawText( puebloOriginario || "", { x: 220, y: 726, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 320, y: 726, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( quePueblo || "", { x: 320, y: 726, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 300, y: 713, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( enfermedad || "", { x: 300, y: 713, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 248, y: 698, width: 200, height: 11, color: rgb(1, 1, 1) })
    page.drawText( alergias || "", { x: 248, y: 698, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 315, y: 685, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( medicamentos || "", { x: 315, y: 685, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 370, y: 852, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( curso || "", { x: 370, y: 852, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 70, y: 671, width: 30, height: 11, color: rgb(1, 1, 1) })
    page.drawText( peso || "", { x: 70, y: 671, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 160, y: 671, width: 30, height: 11, color: rgb(1, 1, 1) })
    page.drawText( talla || "", { x: 160, y: 671, size: fontSize, font, color: rgb(0, 0, 0) })

    // ------------------------ Datos Socio Academicos ------------------------

    page.drawRectangle({ x: 160, y: 615, width: 50, height: 11, color: rgb(1, 1, 1) })
    page.drawText( ultimoCurso_aprobado || "", { x: 160, y: 615, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 277, y: 615, width: 30, height: 11, color: rgb(1, 1, 1) })
    page.drawText( añoCursado || "", { x: 277, y: 615, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 160, y: 600, width: 30, height: 11, color: rgb(1, 1, 1) })
    page.drawText( colegioProcedencia || "", { x: 160, y: 600, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 430, y: 600, width: 30, height: 11, color: rgb(1, 1, 1) })
    page.drawText( cursoReprobado || "", { x: 430, y: 600, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 310, y: 585, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( beca || "", { x: 310, y: 585, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 425, y: 545, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( proteccionInfantil || "", { x: 425, y: 545, size: fontSize, font, color: rgb(0, 0, 0) })

    // ------------------------ Padre ------------------------

    page.drawRectangle({ x: 118, y: 494, width: 130, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nombrePadre || "", { x: 118, y: 494, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 340, y: 495, width: 70, height: 11, color: rgb(1, 1, 1) });
    page.drawText(rutPadre || "", { x: 340, y: 495, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 510, y: 495, width: 60, height: 11, color: rgb(1, 1, 1) });
    page.drawText(fechaNacimiento_padre || "", { x: 510, y: 495, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 114, y: 480, width: 80, height: 11, color: rgb(1, 1, 1) })
    page.drawText( nacionalidadPadre || "", { x: 114, y: 480, size: fontSize, font, color: rgb(0, 0, 0) })

    page.drawRectangle({ x: 375, y: 480, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nivelEducacional_padre || "", { x: 375, y: 480, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 139, y: 466, width: 105, height: 11, color: rgb(1, 1, 1) });
    page.drawText(trabajoPadre || "", { x: 139, y: 466, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 93, y: 453, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionPadre || "", { x: 93, y: 453, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 436, y: 452, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoPadre || "", { x: 436, y: 452, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 390, y: 466, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoPadre || "", { x: 390, y: 466, size: fontSize, font, color: rgb(0, 0, 0) });

    // ------------------------ Madre ------------------------

    page.drawRectangle({ x: 120, y: 425, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nombreMadre || "", { x: 120, y: 425, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 340, y: 424, width: 70, height: 11, color: rgb(1, 1, 1) });
    page.drawText(rutMadre || "", { x: 340, y: 424, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 510, y: 424, width: 60, height: 11, color: rgb(1, 1, 1) });
    page.drawText(fechaNacimiento_madre || "", { x: 510, y: 424, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 120, y: 410, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nacionalidadMadre || "", { x: 120, y: 410, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 375, y: 410, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nivelEducacional_madre || "", { x: 375, y: 410, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 139, y: 396, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(trabajoMadre || "", { x: 139, y: 396, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 92, y: 382, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(direccionMadre || "", { x: 92, y: 382, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 436, y: 382, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoMadre || "", { x: 436, y: 382, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 390, y: 396, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoMadre || "", { x: 390, y: 396, size: fontSize, font, color: rgb(0, 0, 0) });

    // ------------------------ Apoderado principal ------------------------

    page.drawRectangle({ x: 154, y: 318, width: 130, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nombreApoderado || "", { x: 152, y: 318, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 398, y: 318, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(parentescoApoderado || "", { x: 398, y: 318, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 70, y: 303, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(rutApoderado || "", { x: 70, y: 303, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 290, y: 303, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(fechaNacimiento_apoderado || "", { x: 290, y: 303, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 100, y: 290, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado || "", { x: 100, y: 290, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 330, y: 290, width: 150, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado || "", { x: 330, y: 290, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 139, y: 275, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(trabajoApoderado || "", { x: 139, y: 275, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 350, y: 275, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nivelEducacional_apoderado || "", { x: 350, y: 275, size: fontSize, font, color: rgb(0, 0, 0) });

    // ------------------------ Apoderado suplente ------------------------

    page.drawRectangle({ x: 154, y: 235, width: 130, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nombreApoderado2 || "", { x: 154, y: 235, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 387, y: 235, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(parentescoApoderado2 || "", { x: 387, y: 235, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 70, y: 219, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(rutApoderado2 || "", { x: 70, y: 219, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 290, y: 219, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(fechaNacimiento_apoderado2 || "", { x: 290, y: 219, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 100, y: 205, width: 80, height: 11, color: rgb(1, 1, 1) });
    page.drawText(telefonoApoderado2 || "", { x: 100, y: 205, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 330, y: 205, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(correoApoderado2 || "", { x: 330, y: 205, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 139, y: 190, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(trabajoApoderado2 || "", { x: 139, y: 190, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 350, y: 190, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nivelEducacional_apoderado2 || "", { x: 350, y: 190, size: fontSize, font, color: rgb(0, 0, 0) });

    // ------------------------ Retiro ------------------------

    page.drawRectangle({ x: 300, y: 164, width: 120, height: 11, color: rgb(1, 1, 1) });
    page.drawText(nombreRetiro || "", { x: 300, y: 164, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 70, y: 148, width: 90, height: 11, color: rgb(1, 1, 1) });
    page.drawText(rutRetiro || "", { x: 70, y: 148, size: fontSize, font, color: rgb(0, 0, 0) });

    page.drawRectangle({ x: 280, y: 148, width: 100, height: 11, color: rgb(1, 1, 1) });
    page.drawText(parentescoRetiro || "", { x: 280, y: 148, size: fontSize, font, color: rgb(0, 0, 0) });

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