const { PDFDocument } = require('pdf-lib');
const conn = require('../conexion');

// Mostrar formulario de edición
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

    res.render('editarPDF', {
      documentoId,
      datos: rows[0]
    });
  } catch (error) {
    console.error('Error al cargar el formulario:', error);
    res.status(500).send('Error al cargar el formulario');
  }
};

// Procesar edición
exports.editarPDF = async (req, res) => {
  try {
    const {documentoId, nombreCompleto, sexoAlumno, rutAlumnos, fechaNacimientoAlumno, domicilioAlumno,
      edadAlumno, comunaAlumno, viviendaAlumno, nacionalidadAlumno, ingresoChile, puebloOriginario,
      quePuebloOriginario, cualEnfermedad, cualesAlergias, recibeMedicamentos, pesoAlumno, tallaAlumno,
      UltimoCurso, añoCursado, colegioProcedencia, cursoReprobado, cualBeca, perteneceProgramaProteccionInfantil,
      nombrePadre, rutPadre, fechaNacimientoPadre, nacionalidadPadre, nivelEducacional, trabajoPadre,
      correoPadre, direccionPadre, telefonoPadre, nombreMadre, rutMadre, fechaNacimientoMadre,
      nacionalidadMadre, trabajoMadre, correoMadre, direccionMadre, telefonoMadre, nombreApoderado,
      parentescoApoderado, rutApoderado, fechaNacimientoApoderado, telefonoApoderado, correoApoderado, trabajoApoderado,
      nivelEducacionalApoderado, nombreApoderado2, parentescoApoderado2, rutApoderado2, fechaNacimientoApoderado2,
      telefonoApoderado2, correoApoderado2, trabajoApoderado2, nivelEducacionalApoderado2,nombreRetiro,
      rutRetirado, parentescoRetiro } = req.body;

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
    form.getTextField('nacionalidadAlumno').setText(nacionalidadAlumno || '');
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
    form.getTextField('nacionalidadPadre').setText(nacionalidadPadre || '');
    form.getTextField('nivelEducacional').setText(nivelEducacional || '');
    form.getTextField('trabajoPadre').setText(trabajoPadre || '');
    form.getTextField('correoPadre').setText(correoPadre || '');
    form.getTextField('direccionPadre').setText(direccionPadre || '');
    form.getTextField('telefonoPadre').setText(telefonoPadre || '');

    form.getTextField('nombreMadre').setText(nombreMadre || '');
    form.getTextField('rutMadre').setText(rutMadre || '');
    form.getTextField('fechaNacimientoMadre').setText(fechaNacimientoMadre || '');
    form.getTextField('nacionalidadMadre').setText(nacionalidadMadre || '');
    form.getTextField('trabajoMadre').setText(trabajoMadre || '');
    form.getTextField('correoMadre').setText(correoMadre || '');
    form.getTextField('direccionMadre').setText(direccionMadre || '');
    form.getTextField('telefonoMadre').setText(telefonoMadre || '');

    // ================= Datos del Apoderado =================
    form.getTextField('nombreApoderado').setText(nombreApoderado || '');
    form.getTextField('parentescoApoderado').setText(parentescoApoderado || '');
    form.getTextField('rutApoderado').setText(rutApoderado || '');
    form.getTextField('fechaNacimientoApoderado').setText(fechaNacimientoApoderado || '');
    form.getTextField('telefonoApoderado').setText(telefonoApoderado || '');
    form.getTextField('correoApoderado').setText(correoApoderado || '');
    form.getTextField('trabajoApoderado').setText(trabajoApoderado || '');
    form.getTextField('nivelEducacionalApoderado').setText(nivelEducacionalApoderado || '');

    form.getTextField('nombreApoderado2').setText(nombreApoderado2 || '');
    form.getTextField('parentescoApoderado2').setText(parentescoApoderado2 || '');
    form.getTextField('rutApoderado2').setText(rutApoderado2 || '');
    form.getTextField('fechaNacimientoApoderado2').setText(fechaNacimientoApoderado2 || '');
    form.getTextField('telefonoApoderado2').setText(telefonoApoderado2 || '');
    form.getTextField('correoApoderado2').setText(correoApoderado2 || '');
    form.getTextField('trabajoApoderado2').setText(trabajoApoderado2 || '');
    form.getTextField('nivelEducacionalApoderado2').setText(nivelEducacionalApoderado2 || '');

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
