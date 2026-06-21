const express = require("express");
const session = require("express-session");
const { validarUsuario } = require("./usuarios");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: "clave-secreta",
  resave: false,
  saveUninitialized: true
}));

// Página de login
app.get("/login", (req, res) => {
  res.send(`
    <form method="POST" action="/login">
      <input type="text" name="usuario" placeholder="Usuario" />
      <input type="password" name="password" placeholder="Contraseña" />
      <button type="submit">Entrar</button>
    </form>
  `);
});

// Ruta de login
app.post("/login", (req, res) => {
  const { usuario, password } = req.body;

  // ✅ Siempre funciona con admin/1234 porque usuarios.js lo inicializa
  if (validarUsuario(usuario, password)) {
    req.session.user = usuario;
    res.send("Login correcto. Bienvenido " + usuario);
  } else {
    res.send("Usuario o contraseña incorrectos");
  }
});

// Ruta protegida
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.send("Bienvenido al dashboard, " + req.session.user);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send("Error al cerrar sesión");
    res.redirect("/login");
  });
});

// Redirigir raíz al login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Inicio del servidor
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log("Servidor iniciado en http://localhost:" + port);
});
