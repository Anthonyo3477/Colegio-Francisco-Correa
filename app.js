const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// ==========================
// Configuración de Sesiones
// ==========================
app.use(session({
    secret: 'unSecretoMuySeguro12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hora de sesion
}));

// Middleware para pasar la sesión a las vistas
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// ==========================
// Configuración General
// ==========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================
// Middleware de autenticación
// ==========================
function requireLogin(req, res, next) {
    if (!req.session.usuarioId) {
        return res.redirect('/InicioSeccion?error=No%20has%20iniciado%20sesion');
    }
    next();
}

// ==========================
// Rutas
// ==========================
const home = require('./routes/apis/home.routes');
const alumnoRoutes = require('./routes/apis/alumno.routes');
const authRoutes = require('./routes/apis/auth.routes');
const documentoRoutes = require('./routes/apis/documento.routes');
const matriculaRoutes = require('./routes/apis/documento.routes');
const apoderadoRoutes = require('./routes/apis/apoderado.routes');
const nuevoPDFRoutes = require('./routes/apis/nuevoPDF.routes');

app.use('/', home);
app.use('/', alumnoRoutes);
app.use('/', authRoutes);
app.use('/', documentoRoutes);
app.use('/', matriculaRoutes);
app.use('/', apoderadoRoutes);
app.use('/', nuevoPDFRoutes);

// Vista de documentos
app.get('/documentosAlumnos', (req, res) => {
    res.render('documentosAlumnos');
});

// Vista de matricula
app.get('/DocMatricula', (req, res) => {
    res.render('DocMatricula');
});

// Vista de inicio de sesión
app.get('/InicioSeccion', (req, res) => {
    res.render('InicioSeccion', { error: null });
});

// ==========================
// Vista Home (protegida)
// ==========================
app.get('/home', requireLogin, (req, res) => {
    res.render('home', {
        nombre: req.session.nombre_usuario,
        rol: req.session.rol,
        success: req.query.success || null
    });
});

// ==========================
// Manejo de errores
// ==========================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor!');
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// ==========================
// Iniciar servidor
// ==========================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
