const conn = require('../conexion');
const PDFDocument = require('pdfkit');

/* =====================================================
   SUBIR PDF MANUAL (desde formulario)
===================================================== */
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

        console.log("Matrícula subida:", nombreArchivo);

        // 🔹 Redirigir de nuevo a la vista de listado
        res.redirect('/DocMatricula');
    } catch (error) {
        console.error("Error al guardar el documento:", error);
        res.status(500).json({ error: 'Error al guardar en la base de datos' });
    }
};

/* =====================================================
   LISTAR MATRÍCULAS
===================================================== */
exports.listarMatriculas = async (req, res) => {
    try {
        const [rows] = await conn.execute(
            'SELECT * FROM matriculas ORDER BY fecha_subida DESC'
        );
        res.render('DocMatricula', { matriculas: rows });
    } catch (error) {
        console.error("Error al listar matrículas:", error);
        res.status(500).send('Error al listar matrículas');
    }
};

/* =====================================================
   DESCARGAR PDF
===================================================== */
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

/* =====================================================
   VISUALIZAR PDF EN EL NAVEGADOR
===================================================== */
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
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${rows[0].nombre_archivo}"`
        );
        res.send(pdfBuffer); // El navegador abre el PDF en una nueva pestaña
    } catch (error) {
        console.error("Error al mostrar PDF:", error);
        res.status(500).send("Error al mostrar PDF");
    }
};

/* =====================================================
   GENERAR PDF (Alumno + Apoderado)
===================================================== */
exports.generarMatriculaPDF = async (req, res) => {
    try {
        const { idAlumno } = req.params;

        //  Buscar alumno
        const [alumnos] = await conn.execute(
            `SELECT * FROM alumno WHERE id = ?`, [idAlumno]
        );
        if (alumnos.length === 0) {
            return res.status(404).send("Alumno no encontrado");
        }
        const alumno = alumnos[0];

        //  Buscar apoderado
        const [apoderados] = await conn.execute(
            `SELECT * FROM apoderados WHERE alumno_id = ?`, [idAlumno]
        );
        const apoderado = apoderados.length > 0 ? apoderados[0] : null;

        //  Crear PDF en memoria
        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);

            const nombreArchivo = `matricula_${alumno.rut_alumnos}.pdf`;

            // Guardar en la tabla `matriculas`
            await conn.execute(
                "INSERT INTO matriculas (nombre_archivo, documento) VALUES (?, ?)",
                [nombreArchivo, pdfData]
            );

            // Enviar el PDF al navegador
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfData);
        });

        //  Escribir contenido en el PDF
        doc.fontSize(20).text("Ficha de Matrícula", { align: "center" });
        doc.moveDown();

        doc.fontSize(14).text("Datos del Alumno");
        doc.fontSize(12).text(`Nombre: ${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}`);
        doc.text(`RUT: ${alumno.rut_alumnos}`);
        doc.text(`Curso: ${alumno.curso}`);
        doc.text(`Fecha ingreso: ${alumno.fecha_ingreso}`);
        doc.text(`Nacionalidad: ${alumno.nacionalidad}`);
        doc.text(`Dirección: ${alumno.direcion}, ${alumno.comuna}`);
        doc.moveDown();

        if (apoderado) {
            doc.fontSize(14).text("Datos del Apoderado");
            doc.fontSize(12).text(`Nombre: ${apoderado.nombre_apoderado} ${apoderado.apellido_paterno} ${apoderado.apellido_materno}`);
            doc.text(`RUT: ${apoderado.rut_apoderado}`);
            doc.text(`Teléfono: ${apoderado.telefono}`);
            doc.text(`Correo: ${apoderado.correo_apoderado}`);
        } else {
            doc.fontSize(14).text("Este alumno aún no tiene apoderado registrado");
        }

        doc.end();

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).send("Error en el servidor");
    }
};