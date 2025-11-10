exports.mostrarHome = (req, res) => {
    const Home = [];

    res.render('home', {
        title: 'Colegio Manuel Francisco Correa - Inicio',
        Home,
        nombre: req.session?.nombre_usuario || null,
        rol: req.session?.rol || null,
        error: req.query.error || null,
        success: req.query.success || null
    });
};