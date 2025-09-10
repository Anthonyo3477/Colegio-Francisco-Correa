// Este middleware lo que hace, es validar si eres admin o usuario comun, y al momento de verificar
// te da los permisos correspondiente de cada rol

module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.usuarioId) {
            return next();
        }
        return res.redirect('/InicioSeccion?error=Debes%20iniciar%20sesión');
    },

    isAdmin: (req, res, next) => {
        if (req.session && req.session.rol === 'Administrador') {
            return next();
        }
        return res.status(403).send('Acceso denegado: No eres administrador');
    },

    isUser: (req, res, next) => {
        if (req.session && req.session.rol === 'Usuario') {
            return next();
        }
        return res.status(403).send('Acceso denegado: No eres usuario normal');
    }
};