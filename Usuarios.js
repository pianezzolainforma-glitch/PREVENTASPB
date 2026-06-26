const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const filePath = path.join(__dirname, "usuarios.json");

// Leer usuarios desde el archivo JSON
function leerUsuarios() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Guardar usuarios en el archivo JSON
function guardarUsuarios(usuarios) {
  fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2));
}

// Validar usuario y contraseña
function validarUsuario(usuario, password) {
  const usuarios = leerUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  if (!user) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

// Agregar un nuevo usuario
function agregarUsuario(usuario, password, nrovendedor) {
  const usuarios = leerUsuarios();
  if (usuarios.find(u => u.usuario === usuario)) {
    throw new Error("El usuario ya existe");
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  usuarios.push({ usuario, passwordHash, nrovendedor });
  guardarUsuarios(usuarios);
}

// Editar usuario existente
function editarUsuario(usuario, nuevaPassword, nuevoNroVendedor) {
  const usuarios = leerUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  if (!user) throw new Error("Usuario no encontrado");
  if (nuevaPassword) {
    user.passwordHash = bcrypt.hashSync(nuevaPassword, 10);
  }
  if (nuevoNroVendedor) {
    user.nrovendedor = nuevoNroVendedor;
  }
  guardarUsuarios(usuarios);
}

// Inicializar con usuario admin/1234 si no existe usuarios.json
if (!fs.existsSync(filePath)) {
  const usuarioInicial = {
    usuario: "admin",
    passwordHash: bcrypt.hashSync("1234", 10),
    nrovendedor: "001"
  };
  guardarUsuarios([usuarioInicial]);
  console.log("✅ Usuario inicial creado: admin / 1234 con NroVendedor 001");
}

// Exportar todas las funciones
module.exports = {
  validarUsuario,
  agregarUsuario,
  editarUsuario,
  leerUsuarios
};
