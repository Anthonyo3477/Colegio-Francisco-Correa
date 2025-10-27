const { PDFDocument } = require('pdf-lib');
const conn = require('../conexion');

// ==========================================================
// MOSTRAR FORMULARIO DE EDICION
// ==========================================================
exports.mostrarFormulario = async (req, res) => {
  try {
    const documentoId = req.params.id;

    const [rows] = await conn.execute(
      'SELECT * FROM matriculas WHERE id = ?',
      [documentoId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Documento no encontrado');
    }

    // Cargar PDF desde DB
    const pdfDoc = await PDFDocument.load(rows[0].documento);
    const form = pdfDoc.getForm();

    // Listar campos en consola
    form.getFields().forEach(f => {
      console.log('Campo encontrado en el PDF:', f.getName());
    });

    // Renderizar vista normalmente
    res.render('editarPDF', {
      documentoId,
      datos: rows[0]
    });
  } catch (error) {
    console.error('Error al cargar el formulario:', error);
    res.status(500).send('Error al cargar el formulario');
  }
};


// ==========================================================
// PROCESAR EDICION
// ==========================================================
exports.editarPDF = async (req, res) => {
  try {
    const {documentoId, nombreCompleto, sexoAlumno, rutAlumnos, fechaNacimientoAlumno, domicilioAlumno,
      edadAlumno, comunaAlumno, viviendaAlumno, nacionalidad, ingresoChile, puebloOriginario,
      quePuebloOriginario, cualEnfermedad, cualesAlergias, recibeMedicamentos, pesoAlumno, tallaAlumno,

      UltimoCurso, añoCursado, colegioProcedencia, cursoReprobado, cualBeca, perteneceProgramaProteccionInfantil,
      nombrePadre, rutPadre, fechaNacimientoPadre, trabajo_apoderadoPadre, nivelEducacional, trabajoPadre,
      correoPadre, direccionPadre, telefonoPadre, nombreMadre, rutMadre, fechaNacimientoMadre,
      trabajo_apoderadoMadre, trabajoMadre, correoMadre, direccionMadre, telefonoMadre, 
      
      nombre_apoderado,parentesco_apoderado, rut_apoderado, fechaNacimiento_apoderado, telefono, correo_apoderado, trabajo_apoderado,
      nivelEducacional_apoderado, nombre_apoderado2, parentesco_apoderado2, rut_apoderado2, fechaNacimiento_apoderado2,
      telefono2, correo_apoderado2, trabajo_apoderado2, nivelEducacional_apoderado2,
      
      nombreRetiro, rutRetirado, parentescoRetiro } = req.body;

    // Recuperamos el PDF de la base de datos
    const [rows] = await conn.execute(
      'SELECT documento FROM matriculas WHERE id = ?',
      [documentoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const existingPdfBytes = rows[0].documento;
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Intentamos obtener los campos del formulario PDF
    const form = pdfDoc.getForm();

    // ================= Datos del Alumno =================
    form.getTextField('nombreCompleto').setText(nombreCompleto || '');
    form.getTextField('sexoAlumno').setText(sexoAlumno || '');
    form.getTextField('rutAlumnos').setText(rutAlumnos || '');
    form.getTextField('fechaNacimientoAlumno').setText(fechaNacimientoAlumno || '');
    form.getTextField('domicilioAlumno').setText(domicilioAlumno || '');
    form.getTextField('edadAlumno').setText(edadAlumno || '');
    form.getTextField('comunaAlumno').setText(comunaAlumno || '');
    form.getTextField('viviendaAlumno').setText(viviendaAlumno || '');
    form.getTextField('nacionalidad').setText(nacionalidad || '');
    form.getTextField('ingresoChile').setText(ingresoChile || '');
    form.getTextField('puebloOriginario').setText(puebloOriginario || '');
    form.getTextField('quePuebloOriginario').setText(quePuebloOriginario || '');
    form.getTextField('cualEnfermedad').setText(cualEnfermedad || '');
    form.getTextField('cualesAlergias').setText(cualesAlergias || '');
    form.getTextField('recibeMedicamentos').setText(recibeMedicamentos || '');
    form.getTextField('pesoAlumno').setText(pesoAlumno || '');
    form.getTextField('tallaAlumno').setText(tallaAlumno || '');

    // ================= Datos Socio-Economicos =================
    form.getTextField('UltimoCurso').setText(UltimoCurso || '');
    form.getTextField('añoCursado').setText(añoCursado || '');
    form.getTextField('colegioProcedencia').setText(colegioProcedencia || '');
    form.getTextField('cursoReprobado').setText(cursoReprobado || '');
    form.getTextField('cualBeca').setText(cualBeca || '');
    form.getTextField('perteneceProgramaProteccionInfantil').setText(perteneceProgramaProteccionInfantil || '');

    // ================= Antecedentes Familiares =================
    form.getTextField('nombrePadre').setText(nombrePadre || '');
    form.getTextField('rutPadre').setText(rutPadre || '');
    form.getTextField('fechaNacimientoPadre').setText(fechaNacimientoPadre || '');
    form.getTextField('trabajo_apoderadoPadre').setText(trabajo_apoderadoPadre || '');
    form.getTextField('nivelEducacional').setText(nivelEducacional || '');
    form.getTextField('trabajoPadre').setText(trabajoPadre || '');
    form.getTextField('correoPadre').setText(correoPadre || '');
    form.getTextField('direccionPadre').setText(direccionPadre || '');
    form.getTextField('telefonoPadre').setText(telefonoPadre || '');

    form.getTextField('nombreMadre').setText(nombreMadre || '');
    form.getTextField('rutMadre').setText(rutMadre || '');
    form.getTextField('fechaNacimientoMadre').setText(fechaNacimientoMadre || '');
    form.getTextField('trabajo_apoderadoMadre').setText(trabajo_apoderadoMadre || '');
    form.getTextField('trabajoMadre').setText(trabajoMadre || '');
    form.getTextField('correoMadre').setText(correoMadre || '');
    form.getTextField('direccionMadre').setText(direccionMadre || '');
    form.getTextField('telefonoMadre').setText(telefonoMadre || '');

    // ================= Datos del Apoderado =================
    form.getTextField('nombre_apoderado').setText(nombre_apoderado || '');
    form.getTextField('parentesco_apoderado').setText(parentesco_apoderado || '');
    form.getTextField('rut_apoderado').setText(rut_apoderado || '');
    form.getTextField('fechaNacimiento_apoderado').setText(fechaNacimiento_apoderado || '');
    form.getTextField('telefono').setText(telefono || '');
    form.getTextField('correo_apoderado').setText(correo_apoderado || '');
    form.getTextField('trabajo_apoderado').setText(trabajo_apoderado || '');
    form.getTextField('nivelEducacional_apoderado').setText(nivelEducacional_apoderado || '');

    form.getTextField('nombre_apoderado2').setText(nombre_apoderado2 || '');
    form.getTextField('parentesco_apoderado2').setText(parentesco_apoderado2 || '');
    form.getTextField('rut_apoderado2').setText(rut_apoderado2 || '');
    form.getTextField('fechaNacimiento_apoderado2').setText(fechaNacimiento_apoderado2 || '');
    form.getTextField('telefono2').setText(telefono2 || '');
    form.getTextField('correo_apoderado2').setText(correo_apoderado2 || '');
    form.getTextField('trabajo_apoderado2').setText(trabajo_apoderado2 || '');
    form.getTextField('nivelEducacional_apoderado2').setText(nivelEducacional_apoderado2 || '');

    form.getTextField('nombreRetiro').setText(nombreRetiro || '');
    form.getTextField('rutRetirado').setText(rutRetirado || '');
    form.getTextField('parentescoRetiro').setText(parentescoRetiro || '');

    // Guardamos PDF editado
    const pdfBytes = await pdfDoc.save();

    // Guardar también en la base de datos
    await conn.execute(
      'UPDATE matriculas SET documento = ? WHERE id = ?',
      [pdfBytes, documentoId]
    );

    res.redirect('/DocMatricula');
  } catch (error) {
    console.error('Error al editar PDF:', error);
    res.status(500).json({ error: 'Error al editar el PDF' });
  }
};