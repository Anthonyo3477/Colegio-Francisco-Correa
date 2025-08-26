const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Configuración
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// rutas
const home = require('./routes/apis/home.routes');
const alumnoRoutes = require('./routes/apis/alumno.routes');
const authRoutes = require('./routes/apis/auth.routes');

app.use('/', home);
app.use('/', alumnoRoutes);
app.use('/', authRoutes);


app.get('/documentosAlumnos', (req, res) => {
    res.render('documentosAlumnos');
});

app.get('/InicioSeccion', (req, res) => {
    res.render('InicioSeccion');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
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