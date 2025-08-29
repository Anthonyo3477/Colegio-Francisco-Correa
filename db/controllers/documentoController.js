const conn = require('../conexion')

// Subir PDF de matrícula
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

        res.status(200).json({
            success: true,
            mensaje: 'Archivo guardado en la base de datos correctamente',
            archivo: nombreArchivo
        });
    } catch (error) {
        console.error("Error al guardar el documento:", error);
        res.status(500).json({ error: 'Error al guardar en la base de datos' });
    }
};

// Listar PDF
exports.listarMatriculas = async (req, res) => {
    try {
        const [rows] = await conn.execute('SELECT * FROM matriculas ORDER BY fecha_subida DESC');
        res.render('DocMatricula', { matriculas: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al listar matrículas');
    }
};

// Descargar PDF
exports.descargarMatricula = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el archivo en la BD
        const [rows] = await conn.execute(
            'SELECT nombre_archivo, documento FROM matriculas WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).send('Archivo no encontrado');
        }

        const { nombre_archivo, documento } = rows[0];

        // Configurar cabeceras para descarga
        res.setHeader('Content-Disposition', `attachment; filename="${nombre_archivo}"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Enviar el contenido binario
        res.send(documento);

    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        res.status(500).send('Error en el servidor');
    }
};