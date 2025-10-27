exports.mostrarHome = (req, res) => {
    const Home = [];
    res.render('home', { title: 'Colegio Manuel Francisco Correa - Inicio 222', Home });
};