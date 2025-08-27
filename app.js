const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const app = express();

// Configuración de Sesiones
app.use(session({
    secret: 'unSecretoMuySeguro12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // expira en 1 hora
}));

// Configuración General
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para pasar la sesión a las vistas
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Configuración de multer (guardar en carpeta 'uploads')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // carpeta donde se guardan los PDFs
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // nombre único
    }
});

// Solo aceptar PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Ruta para subir PDF de matrícula
app.post('/upload-matricula', upload.single('documento'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo.');
    }
    res.send(`Archivo subido correctamente: ${req.file.filename}`);
});

// Rutas
const home = require('./routes/apis/home.routes');
const alumnoRoutes = require('./routes/apis/alumno.routes');
const authRoutes = require('./routes/apis/auth.routes');
const documentoRoutes = require('./routes/apis/documento.routes');

app.use('/', home);
app.use('/', alumnoRoutes);
app.use('/', authRoutes);
app.use('/', documentoRoutes);

// Vista de documentos
app.get('/documentosAlumnos', (req, res) => {
    res.render('documentosAlumnos');
});

// Vista de matricula
app.get('/DocMatricula', (req, res) =>{
    res.render('DocMatricula');
});


// Vista de inicio de sesión
app.get('/InicioSeccion', (req, res) => {
    res.render('InicioSeccion', { error: null });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor!');
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});