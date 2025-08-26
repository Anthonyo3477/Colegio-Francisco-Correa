const conn = require('../conexion');

// Muestra el formulario
exports.mostrarFormularioLogin = (req, res) => {
    if (req.session.adminId) {
        return res.redirect('/');
    }

    const { error, returnto } = req.query;
    res.render('InicioSeccion', {
        title: 'Inicio de Sesión',
        error,
        returnto: returnto || '/'
    });
};

// Inicio Sesión
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

        // Verificar contraseña
        const isMatch = await bcrypt.compare(contrasena_admin, admin.contrasena_admin);
        if (!isMatch) {
            return res.redirect('/InicioSeccion?error=Credenciales%20incorrectas');
        }

        // Guardar datos en la sesión
        req.session.adminId = admin.id;
        req.session.rut_admin = admin.rut_admin;
        req.session.nombre_admin = admin.nombre_admin;
        req.session.telefono = admin.telefono;
        req.session.direccion = admin.direccion;

        res.redirect('/');

    } catch (err) {
        console.error('Error en el Login:', err);
        res.redirect('/InicioSeccion?error=Error%20en%20el%20servidor');
    }
};

// Registrar Nuevo admin
exports.registrar = async (req, res) => {
    const { rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion } = req.body;

    const camposRequeridos = { rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion };
    for (const [campo, valor] of Object.entries(camposRequeridos)) {
        if (!valor) return res.status(400).json({ error: `Falta el campo: ${campo}` });
    }

    try {
        const [result] = await conn.execute(
            'INSERT INTO admin (rut_admin, nombre_admin, correo_admin, contrasena_admin, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)',
            [rut_admin, nombre_admin, correo_admin, hashedPassword, telefono, direccion]
        );

        const admin = { id: result.insertId, rut_admin, nombre_admin, correo_admin, telefono, direccion };

        req.session.adminId = admin.id;
        req.session.rut_admin = admin.rut_admin;
        req.session.nombre_admin = admin.nombre_admin;
        req.session.telefono = admin.telefono;
        req.session.direccion = admin.direccion;

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