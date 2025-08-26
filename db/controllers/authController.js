const bcrypt = require('bcryptjs');
const conn = require('../conexion');

// Login
exports.login = async (req, res) => {
    const { correo_admin, contrasena_admin } = req.body;

    if (!correo_admin || !contrasena_admin) {
        return res.redirect('/InicioSeccion?error=Campos%20obligatorios');
    }

    try {
        const [resultado] = await conn.execute(
            'SELECT * FROM admin WHERE correo_admin = ?',
            [correo_admin]
        );

        if (resultado.length === 0) {
            return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
        }

        const admin = resultado[0];
        const isMatch = await bcrypt.compare(contrasena_admin, admin.contrasena_admin);
        if (!isMatch) {
            return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
        }

        req.session.adminId = admin.id;
        req.session.nombre_admin = admin.nombre_admin;

        res.redirect('/');

    } catch (err) {
        console.error('Error en el Login:', err);
        res.redirect('/InicioSeccion?error=Error%20en%20el%20servidor');
    }
};

// Registrar
exports.registrar = async (req, res) => {
    const { rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(contrasena_admin, 10);

        const [result] = await conn.execute(
            'INSERT INTO admin (rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
            [rut_admin, nombre_admin, correo_admin, hashedPassword, telefono, direccion]
        );

        req.session.adminId = result.insertId;
        req.session.nombre_admin = nombre_admin;

        res.status(200).json({
            success: true,
            redirect: '/'
        });

    } catch (err) {
        console.error('Error al registrar:', err);
        const errorMsg = err.code === 'ER_DUP_ENTRY'
            ? 'El correo ya está registrado'
            : 'Error al registrar al Admin';
        res.status(500).json({ error: errorMsg });
    }
};