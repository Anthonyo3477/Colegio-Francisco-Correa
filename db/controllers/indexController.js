exports.mostrarHome = (req, res) => {
    const Home = []; // o tus datos reales
    res.render('home', { title: 'Colegio San Francisco Carrasco - Inicio 222', Home });
};