exports.mostrarHome = (req, res) => {
    const Home = []; // o tus datos reales
    res.render('home', { title: 'Colegio Manuel Francisco Correa - Inicio 222', Home });
};