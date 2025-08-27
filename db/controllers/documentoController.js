const path = require('path');

// Subir PDF de matrícula
exports.subirDocumento = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Aquí podrías guardar en DB (ejemplo: nombre archivo + rut alumno)
    // Por ahora solo confirmamos subida
    res.status(200).json({
        success: true,
        mensaje: 'Archivo subido correctamente',
        archivo: req.file.filename
    });
};