// const path = require('path');
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

exports.listarMatriculas = async (req, res) => {
    try {
        const [rows] = await conn.execute('SELECT * FROM matriculas ORDER BY fecha_subida DESC');
        res.render('DocMatricula', { matriculas: rows }); // pasar datos a la vista
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al listar matrículas');
    }
};