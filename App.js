const express = require("express");
const session = require("express-session");
const { validarUsuario } = require("./usuarios");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "clave", resave: false, saveUninitialized: true }));

app.get("/login", (req, res) => res.send("Login OK"));
app.post("/login", (req, res) => {
  if (validarUsuario("admin", "1234")) res.send("Login correcto");
  else res.send("Error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor iniciado"));