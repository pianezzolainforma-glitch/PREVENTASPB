const productosRouter = require("./productos");
const dashboardRouter = require("./dashboard");
const express = require("express");
const session = require("express-session");
const XLSX = require("xlsx"); 
const fs = require("fs");
const path = require("path");
const ftp = require("basic-ftp");


// Importar funciones desde usuarios.js



const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SECRET_KEY || "clave-secreta",
  resave: false,
  saveUninitialized: true
}));

// Función para leer Excel
function leerExcel(ruta, hoja = 0) {
  const workbook = XLSX.readFile(ruta);
  const sheet = workbook.Sheets[workbook.SheetNames[hoja]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// 🚀 Leer clientes desde Excel
//const clientesExcel = leerExcel("./clientes.xlsx");
//const clientesDisponibles = clientesExcel.map(c => ({
  //codigo: c["NumCliente"],        
  //nombre: c["Nombre_Cliente"],    
  //apellido: c["Apellido_Cliente"] 
//}));

// Routers
app.use("/dashboard", dashboardRouter);
app.use("/pedido", productosRouter);

const { validarUsuario, agregarUsuario, editarUsuario, leerUsuarios } = require("./usuarios");

// Login
app.get("/login", (req, res) => {
  res.send(`<!DOCTYPE html>
  <html><head>
    <title>Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
  </head>
  <body class="bg-light d-flex align-items-center justify-content-center vh-100">
    <div class="card shadow-lg p-4" style="width: 350px;">
      <h3 class="text-center mb-3"><i class="bi bi-lock-fill"></i> Ingreso</h3>
      <form method="POST" action="/login">
        <div class="mb-3"><label class="form-label">Usuario</label>
          <input type="text" name="usuario" class="form-control" placeholder="Ingrese su usuario">
        </div>
        <div class="mb-3"><label class="form-label">Contraseña</label>
          <input type="password" name="password" class="form-control" placeholder="Ingrese su contraseña">
        </div>
        <button type="submit" class="btn btn-primary w-100">
          <i class="bi bi-box-arrow-in-right"></i> Entrar
        </button>
      </form>
    </div>
  </body></html>`);
});

app.post("/login", (req, res) => {
  const { usuario, password } = req.body;
  if (validarUsuario(usuario, password)) {
    const usuarios = leerUsuarios();
    const user = usuarios.find(u => u.usuario === usuario);
    req.session.user = usuario;
    req.session.nrovendedor = user.nrovendedor; 
    res.redirect("/dashboard");
  } else {
    res.send("Usuario o contraseña incorrectos");
  }
});
// Administración de usuarios
app.get("/admin/usuarios", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const usuarios = leerUsuarios();
  res.send(`<!DOCTYPE html>
  <html><head><title>Administrar Usuarios</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  </head><body class="container mt-5">
    <h2>Administrar Usuarios</h2>
    <h4>Usuarios existentes:</h4>
    <ul class="list-group mb-4">
      ${usuarios.map(u => `<li class="list-group-item">${u.usuario} - Vendedor: ${u.nrovendedor || "N/A"}</li>`).join("")}
    </ul>
    <h4>Agregar Usuario</h4>
    <form method="POST" action="/admin/usuarios/agregar" class="mb-4">
      <input type="text" name="usuario" placeholder="Usuario" class="form-control mb-2" required>
      <input type="password" name="password" placeholder="Contraseña" class="form-control mb-2" required>
      <input type="text" name="nrovendedor" placeholder="Nro de Vendedor" class="form-control mb-2" required>
      <button type="submit" class="btn btn-success">Agregar</button>
    </form>
    <h4>Editar Usuario</h4>
    <form method="POST" action="/admin/usuarios/editar">
      <input type="text" name="usuario" placeholder="Usuario" class="form-control mb-2" required>
      <input type="password" name="password" placeholder="Nueva Contraseña (opcional)" class="form-control mb-2">
      <input type="text" name="nrovendedor" placeholder="Nuevo Nro de Vendedor (opcional)" class="form-control mb-2">
      <button type="submit" class="btn btn-warning">Editar</button>
    </form>
  </body></html>`);
});

app.post("/admin/usuarios/agregar", (req, res) => {
  try {
    agregarUsuario(req.body.usuario, req.body.password, req.body.nrovendedor);
    res.redirect("/admin/usuarios");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

app.post("/admin/usuarios/editar", (req, res) => {
  try {
    editarUsuario(req.body.usuario, req.body.password, req.body.nrovendedor);
    res.redirect("/admin/usuarios");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send("Error al cerrar sesión");
    res.redirect("/login");
  });
});

// Selección de cliente
app.get("/clientes", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  // ✅ Ahora leemos el archivo solo cuando se entra a /clientes
  let clientesDisponibles = [];
  try {
    const clientesExcel = leerExcel("./clientes.xlsx");
    clientesDisponibles = clientesExcel.map(c => ({
      codigo: c["NumCliente"],
      nombre: c["Nombre_Cliente"],
      apellido: c["Apellido_Cliente"]
    }));
  } catch (err) {
    return res.send("Error al cargar clientes: " + err.message);
  }

  const opcionesClientes = clientesDisponibles.map(c =>
    `<option value="${c.codigo}">${c.codigo} - ${c.nombre} ${c.apellido || ""}</option>`
  ).join("");

  res.send(`<!DOCTYPE html>
  <html><head><title>Seleccionar Cliente</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
  </head><body class="bg-light d-flex align-items-center justify-content-center vh-100">
    <div class="card shadow-lg p-4" style="width: 400px;">
      <h3 class="text-center mb-3"><i class="bi bi-people-fill"></i> Selección de Cliente</h3>
      <form method="POST" action="/clientes">
        <div class="mb-3"><label class="form-label">Buscar Cliente</label>
          <input type="text" id="busquedaCliente" class="form-control" placeholder="Nombre o Apellido...">
        </div>
        <div class="mb-3"><label class="form-label">Cliente</label>
          <select id="listaClientes" name="numcliente" class="form-select" size="5">
            ${opcionesClientes}
          </select>
        </div>
        <button type="submit" class="btn btn-success w-100">
          <i class="bi bi-check-circle"></i> Confirmar
        </button>
      </form>
    </div>
    <script>
      const clientes = ${JSON.stringify(clientesDisponibles)};
      const select = document.getElementById("listaClientes");
      const input = document.getElementById("busquedaCliente");
      input.addEventListener("keyup", () => {
        const filtro = input.value.toLowerCase();
        select.innerHTML = "";
        clientes.filter(c => 
          c.nombre.toLowerCase().includes(filtro) || 
          (c.apellido && c.apellido.toLowerCase().includes(filtro))
        ).forEach(c => {
          const option = document.createElement("option");
          option.value = c.codigo;
          option.textContent = c.codigo + " - " + c.nombre + " " + (c.apellido || "");
          select.appendChild(option);
        });
      });
    </script>
  </body></html>`);
});

app.post("/clientes", (req, res) => {
  req.session.numcliente = req.body.numcliente;
  res.redirect("/pedido");
});
// 🚀 Procesar pedido y subir a FTP
app.post("/pedido", async (req, res) => {
  const { nrovendedor, numcliente, productos } = req.body;

  let items = [];
  try {
    const pedido = productos ? JSON.parse(productos) : { productos: [] };
    items = Array.isArray(pedido) ? pedido : pedido.productos || [];
  } catch {
    items = [];
  }

  const nroPedido = "@NroPedido";
  const fechaHora = new Date().toISOString().slice(0,19).replace('T',' ');

  // Cabecera
  let sql = `INSERT INTO PedidosVentas 
    (NroPedido, NombreSucursal, NroVendedor, PV, NumCliente, NroFlete, FechaHoraPedido, FacturaNegativo, NombreFormaPago, UsuarioCreador, NombreVencimiento, TipoComprobante) 
    VALUES (${nroPedido}, 'CASA CENTRAL', '${nrovendedor}', 3, '${numcliente}', 0, #${fechaHora}#, -1, 'EFECTIVO', 'MOVIL', '30 DIAS', 'FV');\n`;

  // Detalle
  items.forEach((prod, index) => {
    sql += `INSERT INTO DetallePedidosVentas 
      (NroPedido, Sucursal, Indice, CodigoProducto, Deposito, CantidadVendida, Estado, ImpC_IVA, ImpC_IngresosBrutos, ImpC_Interno, ComisionVendedor, ListaPrecio, Porcentaje1ListaPrecio, Porcentaje2ListaPrecio, Porcentaje3ListaPrecio, PorcentajeDescuentoIncremento, CostoNeto, PrecioNetoVentaInicial) 
      VALUES (${nroPedido}, 'CASA CENTRAL', ${index+1}, '${prod.codigo}', '${prod.deposito}', '${prod.cantidad}', '${prod.estado}', 21.00, 0, 0, 4, '${prod.listaPrecio}', 12.00, 17.00, 0.00, 0, '${prod.costo}', '${prod.precio}');\n`;
  });

  const filePath = path.join(__dirname, `pedido_${Date.now()}.txt`);
  fs.writeFileSync(filePath, sql);

  const client = new ftp.Client();
  try {
    await client.access({
      host: "c1342049.ferozo.com",
      user: "admin@sgoventas.com",
      password: "Vamport@sgo2026",
      secure: false
    });
    await client.uploadFrom(filePath, "/vaamport/bajada/" + path.basename(filePath));

    res.send(`<!DOCTYPE html>
      <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      </head><body>
        <div class="alert alert-success mt-5 text-center">
          ✅ El pedido se envió con éxito.
          <br><br>
          <a href="/pedido" class="btn btn-primary">Crear otro pedido</a>
        </div>
      </body></html>`);
  } catch (err) {
    res.send("Error al subir al FTP: " + err.message);
  }
  client.close();
});

// 🚀 Redirigir raíz al login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Inicio del servidor
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log("Servidor iniciado en http://localhost:3000");
});
