const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <title>Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72, #2a5298); /* azul degradado */
        }
        .card { border-radius: 12px; }
        footer { margin-top: 40px; padding: 15px; background: #212529; color: #fff; text-align: center; }
        .chart-container { position: relative; width: 100%; overflow-x: auto; }
        canvas { min-width: 400px; }
      </style>
    </head>
    <body class="container-fluid p-0">

      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="/dashboard"><i class="bi bi-speedometer2"></i> Mi Panel</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuDashboard">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="menuDashboard">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item"><a class="nav-link" href="/dashboard"><i class="bi bi-house"></i> Inicio</a></li>
              <li class="nav-item"><a class="nav-link" href="/clientes"><i class="bi bi-plus-circle"></i> Nuevo Pedido</a></li>
              <li class="nav-item"><a class="nav-link" href="/clientes"><i class="bi bi-people-fill"></i> Clientes</a></li>
              <li class="nav-item"><a class="nav-link" href="/admin/usuarios"><i class="bi bi-person-gear"></i> Usuarios</a></li>
              <li class="nav-item"><a class="nav-link text-danger" href="/logout"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</a></li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Título -->
      <div class="container mt-4">
        <h2 class="text-center mb-4 text-white"><i class="bi bi-speedometer2"></i> Panel de Control</h2>

        <!-- Tarjetas -->
        <div class="row g-3">
          <div class="col-12 col-md-3">
            <div class="card text-center shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">Pedidos</h5>
                <p class="card-text fs-5">Total: 25</p>
                <a href="/clientes" class="btn btn-primary w-100"><i class="bi bi-plus-circle"></i> Nuevo Pedido</a>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="card text-center shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">Clientes</h5>
                <p class="card-text fs-5">Activos: 10</p>
                <a href="/clientes" class="btn btn-success w-100"><i class="bi bi-people-fill"></i> Seleccionar Cliente</a>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="card text-center shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">Totales</h5>
                <p class="card-text fs-5">Ventas: $12.500</p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="card text-center shadow-sm h-100">
              <div class="card-body">
                <h5 class="card-title">Usuarios</h5>
                <p class="card-text fs-5">Administrar cuentas</p>
                <a href="/admin/usuarios" class="btn btn-info w-100"><i class="bi bi-person-gear"></i> Gestionar Usuarios</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráfico -->
        <h3 class="mt-5 text-white">Ventas por Cliente</h3>
        <div class="chart-container bg-light p-3 rounded shadow-sm">
          <canvas id="graficoClientes"></canvas>
        </div>
      </div>

      <!-- Footer -->
      <footer>
        <p>&copy; 2026 Mi Empresa - Panel de Control</p>
      </footer>

      <script>
        const ctx = document.getElementById('graficoClientes');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Cliente 204', 'Cliente 205', 'Cliente 206'],
            datasets: [{
              label: 'Ventas ($)',
              data: [5000, 4500, 3000],
              backgroundColor: ['#0d6efd','#198754','#dc3545']
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      </script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `);
});

module.exports = router;
