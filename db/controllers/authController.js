const conn = require('../conexion');
const bcrypt = require('bcryptjs');


// Login de administrador

exports.login = async (req, res) => {
    const { correo_admin, contrasena_admin } = req.body;

    if (!correo_admin || !contrasena_admin) {
        return res.render('InicioSeccion', { error: 'Credenciales incorrectas' });
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

        // Crear sesión
        req.session.adminId = admin.id_admin; // asegúrate de que tu PK en tabla sea id_admin
        req.session.nombre_admin = admin.nombre_admin;

        res.redirect('/home');

    } catch (err) {
        console.error('Error en el Login:', err);
        res.redirect('/InicioSeccion?error=Error%20en%20el%20servidor');
    }
};

//Registrar administrador

exports.registrar = async (req, res) => {
    const { rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion } = req.body;

    // Validaciones básicas
    if (!rut_admin || !nombre_admin || !correo_admin || !contrasena_admin) {
        return res.redirect('/registro?error=Campos%20obligatorios');
    }

    try {
        const hashedPassword = await bcrypt.hash(contrasena_admin, 10);

        const [result] = await conn.execute(
            'INSERT INTO admin (rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
            [rut_admin, nombre_admin, correo_admin, hashedPassword, telefono, direccion]
        );

        // Crear sesión después de registrar
        req.session.adminId = result.insertId;
        req.session.nombre_admin = nombre_admin;

        res.redirect('/home');

    } catch (err) {
        console.error('Error al registrar:', err);
        const errorMsg = err.code === 'ER_DUP_ENTRY'
            ? 'El correo ya está registrado'
            : 'Error al registrar al Admin';

        res.redirect(`/registro?error=${encodeURIComponent(errorMsg)}`);
    }
};

// Logout de administrador
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/home?error=No%20se%20pudo%20cerrar%20la%20sesion');
        }
        res.clearCookie('connect.sid');
        res.redirect('/InicioSeccion');
    });
};