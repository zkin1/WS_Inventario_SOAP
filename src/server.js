const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;


//middleware para habilitar CORS
app.use(cors());
// Middleware
app.use(bodyParser.raw({type: function(){return true;}, limit: '5mb'}));

// Servicios SOAP
const stockService = require('./services/stockService');
const ubicacionesService = require('./services/ubicacionesService');
const movimientosService = require('./services/movimientosService');
const ajustesService = require('./services/ajustesService');

// Definición de paths de WSDL
const stockWSDL = path.join(__dirname, 'wsdl', 'stockService.wsdl');
const ubicacionesWSDL = path.join(__dirname, 'wsdl', 'ubicacionesService.wsdl');
const movimientosWSDL = path.join(__dirname, 'wsdl', 'movimientosService.wsdl');
const ajustesWSDL = path.join(__dirname, 'wsdl', 'ajustesService.wsdl');

// Página de inicio
app.get('/', (req, res) => {
  res.send('Servidor SOAP de Inventario funcionando en: <br>' +
    '<ul>' +
    '<li><a href="/wsdl/stock?wsdl">Servicio de Stock</a></li>' +
    '<li><a href="/wsdl/ubicaciones?wsdl">Servicio de Ubicaciones</a></li>' +
    '<li><a href="/wsdl/movimientos?wsdl">Servicio de Movimientos</a></li>' +
    '<li><a href="/wsdl/ajustes?wsdl">Servicio de Ajustes</a></li>' +
    '</ul>');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor SOAP de Inventario corriendo en http://localhost:${port}`);
  
  // Crear servidores SOAP para cada servicio
  soap.listen(app, '/wsdl/stock', stockService, fs.readFileSync(stockWSDL, 'utf8'));
  soap.listen(app, '/wsdl/ubicaciones', ubicacionesService, fs.readFileSync(ubicacionesWSDL, 'utf8'));
  soap.listen(app, '/wsdl/movimientos', movimientosService, fs.readFileSync(movimientosWSDL, 'utf8'));
  soap.listen(app, '/wsdl/ajustes', ajustesService, fs.readFileSync(ajustesWSDL, 'utf8'));
});