const conn = require('../conexion');
const bcrypt = require('bcryptjs');

// ========================
// Login de usuario
// ========================
exports.login = async (req, res) => {
    const { correo_usuario, contrasena_usuario } = req.body;

    if (!correo_usuario || !contrasena_usuario) {
        return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
    }

    try {
        const [resultado] = await conn.execute(
            'SELECT * FROM usuario WHERE correo_usuario = ?',
            [correo_usuario]
        );

        if (resultado.length === 0) {
            return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
        }

        const usuario = resultado[0];
        const isMatch = await bcrypt.compare(contrasena_usuario, usuario.contrasena_usuario);

        if (!isMatch) {
            return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
        }

        // Crear sesión
        req.session.usuarioId = usuario.id;
        req.session.nombre_usuario = usuario.nombre_usuario;
        req.session.rol = usuario.rol;

        // Redirigir con mensaje de éxito
        return res.redirect('/home?success=Inicio%20de%20sesión%20correcto');

    } catch (err) {
        console.error('Error en el Login:', err);
        return res.redirect('/InicioSeccion?error=Error%20en%20el%20servidor');
    }
};

// ========================
// Registrar usuario
// ========================
exports.registrar = async (req, res) => {
    let { rut_usuario, nombre_usuario, correo_usuario, contrasena_usuario, telefono, direccion, rol } = req.body;

    if (!rut_usuario || !nombre_usuario || !correo_usuario || !contrasena_usuario) {
        return res.redirect('/registro?error=Campos%20obligatorios');
    }

    telefono = telefono || null;
    direccion = direccion || null;
    rol = rol || 'Usuario';

    try {
        const hashedPassword = await bcrypt.hash(contrasena_usuario, 10);

        const [result] = await conn.execute(
            'INSERT INTO usuario (rut_usuario, nombre_usuario, correo_usuario, contrasena_usuario, telefono, direccion, rol) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [rut_usuario, nombre_usuario, correo_usuario, hashedPassword, telefono, direccion, rol]
        );

        req.session.usuarioId = result.insertId;
        req.session.nombre_usuario = nombre_usuario;
        req.session.rol = rol;

        return res.redirect('/home?success=Usuario%20registrado%20correctamente');

    } catch (err) {
        console.error('Error al registrar:', err);
        const errorMsg = err.code === 'ER_DUP_ENTRY'
            ? 'El correo o rut ya está registrado'
            : 'Error al registrar al usuario';

        return res.redirect(`/registro?error=${encodeURIComponent(errorMsg)}`);
    }
};

// ========================
// Logout de usuario
// ========================
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/home?error=No%20se%20pudo%20cerrar%20la%20sesion');
        }
        res.clearCookie('connect.sid');
        return res.redirect('/InicioSeccion?success=Cerraste%20sesion%20correctamente');
    });
};