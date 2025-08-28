const { Router } = require('express');
const routes = Router();

const indexRoutes = require('./apis/home.routes');
const alumnoRoutes = require('./apis/alumno.routes');
const authRoutes = require('./routes/auth.routes');


// rut_alumnos para la página de inicio
routes.use('/', indexRoutes);
routes.use('/', alumnoRoutes);
app.use('/', authRoutes);

routes.post('/auth/login', auth.login);
routes.post('/auth/registrar', auth.registrar);


module.exports = routes;