const express = require("express");
const XLSX = require("xlsx");
const router = express.Router();

// Función para limpiar y convertir valores numéricos
function limpiarNumero(valor) {
  if (!valor) return 0;
  return parseFloat(
    String(valor).replace(",", ".").replace(/[^0-9.-]/g, "")
  ) || 0;
}

function leerExcel(ruta, hoja = 0) {
  const workbook = XLSX.readFile(ruta);
  const sheet = workbook.Sheets[workbook.SheetNames[hoja]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

const productosExcel = leerExcel("./productos.xlsx");

const productosDisponibles = productosExcel.map(p => ({
  codigo: p["Cod Proveedor"],
  nombre: p["Descripción"],
  marca: p["Marca"],
  costo: limpiarNumero(p["Venta NETO final"]),
  precio: limpiarNumero(p["TOTAL (venta)"]),
  listaPrecio: p["Lista"] ? String(p["Lista"]).trim() : "" // normalizado
}));

// Listas de precio únicas
const listasPrecio = [...new Set(productosDisponibles
  .map(p => p.listaPrecio)
  .filter(lp => lp !== "")
)];

// Marcas únicas
const marcas = [...new Set(productosDisponibles
  .map(p => p.marca)
  .filter(m => m !== "")
)];

router.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const numcliente = req.session.numcliente || "";
  const nrovendedor = req.session.nrovendedor || "";

 
const opcionesListas = listasPrecio.map(lp => `<option value="${lp}">${lp}</option>`).join("");
  const opcionesSelectListas = listasPrecio.map(lp => `<option value="${lp}">${lp}</option>`).join("");
  const opcionesMarcas = marcas.map(m => `<option value="${m}">${m}</option>`).join("");

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Generar Pedido</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body class="container mt-3">
  <h2 class="text-center mb-3">Cabecera del Pedido</h2>

  <form method="POST" action="/pedido" onsubmit="return prepararEnvio()">
    <!-- campos cabecera -->
    <div class="row mb-2">
      <div class="col-md-2"><input class="form-control" name="nrovendedor" value="${nrovendedor}" readonly></div>
      <div class="col-md-2"><input class="form-control" type="number" name="pv" value="3" readonly></div>
      <div class="col-md-2"><input class="form-control" type="number" name="numcliente" value="${numcliente}"></div>
      <div class="col-md-3"><input class="form-control" type="number" name="nroflete" value="0" readonly></div>
      <div class="col-md-3"><input class="form-control" name="formaPago" value="EFECTIVO" readonly></div>
    </div>
    <div class="row mb-2">
      <div class="col-md-2"><input class="form-control" name="usuarioCreador" value="MOVIL" readonly></div>
      <div class="col-md-2"><input class="form-control" name="vencimiento" value="30 DIAS" readonly></div>
      <div class="col-md-2"><input class="form-control" name="tipoComprobante" value="FV" readonly></div>
      <div class="col-md-3">
        <select id="listaPrecios" class="form-select" name="listaPrecioCabecera">
          ${opcionesListas}
        </select>
      </div>
      <div class="col-md-3">
        <select id="marcas" class="form-select" name="marcaCabecera">
          <option value="">Todas las marcas</option>
          ${opcionesMarcas}
        </select>
      </div>
    </div>

    <h3 class="mt-4">Buscar Producto</h3>
    <input type="text" id="busquedaProducto" class="form-control mb-2" placeholder="Código, nombre o marca...">
    <select id="listaProductos" class="form-select mb-3" size="5" onchange="seleccionarProducto(this)">
      <!-- opciones se cargan dinámicamente -->
    </select>

    <h3>Detalle</h3>
    <table class="table" id="tablaProductos">
      <thead>
        <tr>
          <th>Código</th><th>Nombre</th><th>Marca</th><th>Cantidad</th>
          <th>Costo</th><th>Precio</th><th>Depósito</th>
          <th>Lista de Precio</th><th>Estado</th><th>Acción</th>
        </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td colspan="10" class="text-end">
            Totales → Cantidad: <span id="totalCantidad">0.00</span> | Precio Total: $<span id="totalPrecio">0.00</span>
          </td>
        </tr>
      </tfoot>
    </table>

    <button type="submit" class="btn btn-success w-100">
      <i class="bi bi-check-circle"></i> Confirmar Pedido
    </button>
    <input type="hidden" id="productos" name="productos">
  </form>
<script>
    const productosDisponibles = ${JSON.stringify(productosDisponibles)};
    const opcionesSelectListas = \`${opcionesSelectListas}\`;

    function mostrarProductos(listaSeleccionada, marcaSeleccionada) {
      const select = document.getElementById("listaProductos");
      select.innerHTML = "";
      const busqueda = document.getElementById("busquedaProducto").value.toLowerCase();

      productosDisponibles
        .filter(p => 
          (listaSeleccionada === "" || p.listaPrecio === listaSeleccionada) &&
          (marcaSeleccionada === "" || p.marca === marcaSeleccionada) &&
          (p.codigo.toLowerCase().includes(busqueda) ||
           p.nombre.toLowerCase().includes(busqueda) ||
           p.marca.toLowerCase().includes(busqueda))
        )
        .forEach(p => {
          const option = document.createElement("option");
          option.value = p.codigo;
          option.textContent = p.codigo + " - " + p.nombre + " (" + p.marca + ") | Costo: " + p.costo.toFixed(2) + " | Precio: " + p.precio.toFixed(2);
          option.dataset.nombre = p.nombre;
          option.dataset.marca = p.marca;
          option.dataset.costo = p.costo;
          option.dataset.precio = p.precio;
          option.dataset.lista = p.listaPrecio;
          select.appendChild(option);
        });
    }

    document.getElementById("listaPrecios").addEventListener("change", () => {
      const listaSeleccionada = document.getElementById("listaPrecios").value;
      const marcaSeleccionada = document.getElementById("marcas").value;
      mostrarProductos(listaSeleccionada, marcaSeleccionada);
    });

    document.getElementById("marcas").addEventListener("change", () => {
      const listaSeleccionada = document.getElementById("listaPrecios").value;
      const marcaSeleccionada = document.getElementById("marcas").value;
      mostrarProductos(listaSeleccionada, marcaSeleccionada);
    });

    // Debounce para la búsqueda
    let timeoutBusqueda;
    document.getElementById("busquedaProducto").addEventListener("keyup", () => {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(() => {
        const listaSeleccionada = document.getElementById("listaPrecios").value;
        const marcaSeleccionada = document.getElementById("marcas").value;
        mostrarProductos(listaSeleccionada, marcaSeleccionada);
      }, 300);
    });
    function seleccionarProducto(select) {
      const opcion = select.options[select.selectedIndex];
      if (!opcion) return;

      const codigo = opcion.value;
      const nombre = opcion.dataset.nombre;
      const marca = opcion.dataset.marca;
      const costo = parseFloat(opcion.dataset.costo) || 0;
      const precio = parseFloat(opcion.dataset.precio) || 0;

      const listaPrecioSeleccionada = document.getElementById("listaPrecios").value;
      const tabla = document.getElementById("tablaProductos").getElementsByTagName("tbody")[0];
      const fila = tabla.insertRow();

      const opcionesConSelected = opcionesSelectListas.replace(
        '<option value="' + listaPrecioSeleccionada + '">',
        '<option value="' + listaPrecioSeleccionada + '" selected>'
      );

      fila.innerHTML =
        '<td>' + codigo + '</td>' +
        '<td>' + nombre + '</td>' +
        '<td>' + marca + '</td>' +
        '<td><input class="form-control" type="number" min="0" step="0.01" value="1" oninput="calcularTotales()"></td>' +
        '<td><input class="form-control" type="number" step="0.01" min="0" value="' + costo.toFixed(2) + '" oninput="calcularTotales()"></td>' +
        '<td><input class="form-control" type="number" step="0.01" min="0" value="' + precio.toFixed(2) + '" oninput="calcularTotales()"></td>' +
        '<td><input class="form-control" value="Deposito1"></td>' +
        '<td><select class="form-select">' + opcionesConSelected + '</select></td>' +
        '<td><select class="form-select">' +
          '<option value="PENDIENTE">PENDIENTE</option>' +
          '<option value="ENTREGADO">ENTREGADO</option>' +
          '<option value="CANCELADO">CANCELADO</option>' +
        '</select></td>' +
        '<td><button type="button" class="btn btn-outline-danger btn-sm" onclick="this.closest(\\'tr\\').remove(); calcularTotales();"><i class="bi bi-trash"></i></button></td>';

      calcularTotales();
    }
    function calcularTotales() {
      let totalCantidad = 0;
      let totalPrecio = 0;
      const filas = document.querySelectorAll("#tablaProductos tbody tr");
      filas.forEach(fila => {
        const cantidad = parseFloat(fila.cells[3].querySelector("input").value) || 0;
        const precio = parseFloat(fila.cells[5].querySelector("input").value) || 0;
        totalCantidad += cantidad;
        totalPrecio += cantidad * precio;
      });
      document.getElementById("totalCantidad").textContent = totalCantidad.toFixed(2);
      document.getElementById("totalPrecio").textContent = totalPrecio.toFixed(2);
    }

    function prepararEnvio() {
      const filas = document.querySelectorAll("#tablaProductos tbody tr");
      if (filas.length === 0) {
        alert("Debe agregar al menos un producto al pedido.");
        return false;
      }

      const productos = [];
      filas.forEach(fila => {
        productos.push({
          codigo: fila.cells[0].textContent,
          nombre: fila.cells[1].textContent,
          marca: fila.cells[2].textContent,
          cantidad: (parseFloat(fila.cells[3].querySelector("input").value) || 0).toFixed(2),
          costo: (parseFloat(fila.cells[4].querySelector("input").value) || 0).toFixed(2),
          precio: (parseFloat(fila.cells[5].querySelector("input").value) || 0).toFixed(2),
          deposito: fila.cells[6].querySelector("input").value,
          listaPrecio: fila.cells[7].querySelector("select").value,
          estado: fila.cells[8].querySelector("select").value
        });
      });

      document.getElementById("productos").value = JSON.stringify(productos);
      return true;
    }
  </script>
</body>
</html>
  `); // 👈 cierre correcto del template string y del res.send
});

module.exports = router;