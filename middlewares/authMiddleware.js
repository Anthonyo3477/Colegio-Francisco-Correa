module.exports = {
  // Verifica si hay sesión activa
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.usuarioId) {
      return next();
    }
    req.session.error = "Debes iniciar sesión para acceder a esta página.";
    return res.redirect('/InicioSeccion');
  },

  // Solo permite acceso a administradores
  isAdmin: (req, res, next) => {
    if (req.session && req.session.rol === 'Administrador') {
      return next();
    }
    return res.redirect('/home?error=No%20tienes%20permiso%20para%20acceder%20a%20esta%20sección%2C%20solo%20los%20administradores%20pueden%20ingresar');


    // Guarda un mensaje y redirige al home (o donde prefieras)
    req.session.error = "Acceso denegado: No tienes permisos de administrador.";
    return res.redirect('/home');
  },

  // Solo permite acceso a usuarios comunes
  isUser: (req, res, next) => {
    if (req.session && req.session.rol === 'Usuario') {
      return next();
    }
    return res.redirect('/home?error=Acceso%20denegado%3A%20solo%20usuarios%20comunes%20pueden%20entrar%20a%20esta%20sección');

    req.session.error = "Acceso denegado: No tienes permisos de usuario normal.";
    return res.redirect('/home');
  }
};
