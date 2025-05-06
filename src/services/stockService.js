const pool = require('../config/database');
const axios = require('axios');
require('dotenv').config();

const stockService = {
  StockService: {
    StockPort: {
      GetAllStock: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [rows] = await pool.query(
            `SELECT s.*, u.nombre as ubicacion_nombre 
             FROM stock s
             JOIN ubicaciones u ON s.ubicacion_id = u.id
             ORDER BY s.ultima_actualizacion DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
          );
          
          const [countResult] = await pool.query('SELECT COUNT(*) as total FROM stock');
          const total = countResult[0].total;
          
          // Enriquecer con datos de productos desde la API de Productos
          for (let i = 0; i < rows.length; i++) {
            try {
              const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${rows[i].producto_id}`);
              rows[i].producto = response.data;
            } catch (error) {
              console.error(`Error al obtener producto ID ${rows[i].producto_id}: ${error.message}`);
              rows[i].producto = { nombre: 'Producto no disponible' };
            }
          }
          
          return {
            stockItems: { stockItem: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener stock' };
        }
      },
      
      GetStockByProducto: async function(args) {
        try {
          const [rows] = await pool.query(
            `SELECT s.*, u.nombre as ubicacion_nombre, u.codigo as ubicacion_codigo 
             FROM stock s
             JOIN ubicaciones u ON s.ubicacion_id = u.id
             WHERE s.producto_id = ?`,
            [args.productoId]
          );
          
          // Obtener información del producto
          try {
            const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${args.productoId}`);
            return { 
              producto: response.data,
              stockItems: { stockItem: rows }
            };
          } catch (error) {
            console.error(`Error al obtener producto ID ${args.productoId}: ${error.message}`);
            return { 
              producto: { id: args.productoId, nombre: 'Producto no disponible' },
              stockItems: { stockItem: rows }
            };
          }
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener stock del producto' };
        }
      },
      
      GetStockByUbicacion: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [rows] = await pool.query(
            `SELECT s.* FROM stock s WHERE s.ubicacion_id = ? LIMIT ? OFFSET ?`,
            [args.ubicacionId, limit, offset]
          );
          
          const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM stock WHERE ubicacion_id = ?',
            [args.ubicacionId]
          );
          const total = countResult[0].total;
          
          // Enriquecer con datos de productos
          for (let i = 0; i < rows.length; i++) {
            try {
              const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${rows[i].producto_id}`);
              rows[i].producto = response.data;
            } catch (error) {
              console.error(`Error al obtener producto ID ${rows[i].producto_id}: ${error.message}`);
              rows[i].producto = { nombre: 'Producto no disponible' };
            }
          }
          
          // Obtener información de la ubicación
          const [ubicacionResult] = await pool.query('SELECT * FROM ubicaciones WHERE id = ?', [args.ubicacionId]);
          
          return {
            ubicacion: ubicacionResult[0],
            stockItems: { stockItem: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener stock de la ubicación' };
        }
      },
      
      GetStockBajoMinimo: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [rows] = await pool.query(
            `SELECT s.*, u.nombre as ubicacion_nombre 
             FROM stock s
             JOIN ubicaciones u ON s.ubicacion_id = u.id
             WHERE s.cantidad < s.stock_minimo
             ORDER BY s.cantidad ASC
             LIMIT ? OFFSET ?`,
            [limit, offset]
          );
          
          const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM stock WHERE cantidad < stock_minimo'
          );
          const total = countResult[0].total;
          
          // Enriquecer con datos de productos
          for (let i = 0; i < rows.length; i++) {
            try {
              const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${rows[i].producto_id}`);
              rows[i].producto = response.data;
            } catch (error) {
              console.error(`Error al obtener producto ID ${rows[i].producto_id}: ${error.message}`);
              rows[i].producto = { nombre: 'Producto no disponible' };
            }
          }
          
          return {
            stockItems: { stockItem: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener stock bajo mínimo' };
        }
      },
      
      ActualizarStockMinMax: async function(args) {
        try {
          // Validación básica
          if (args.stockMinimo === undefined || args.stockMaximo === undefined) {
            return { error: 'El stock mínimo y máximo son obligatorios' };
          }
          
          if (parseInt(args.stockMinimo) < 0 || parseInt(args.stockMaximo) < 0) {
            return { error: 'Los valores de stock no pueden ser negativos' };
          }
          
          if (parseInt(args.stockMinimo) > parseInt(args.stockMaximo)) {
            return { error: 'El stock mínimo no puede ser mayor al stock máximo' };
          }
          
          const [result] = await pool.query(
            'UPDATE stock SET stock_minimo = ?, stock_maximo = ? WHERE id = ?',
            [args.stockMinimo, args.stockMaximo, args.id]
          );
          
          if (result.affectedRows === 0) {
            return { error: 'Stock no encontrado' };
          }
          
          return { 
            message: 'Stock mínimo y máximo actualizados correctamente',
            id: args.id,
            stockMinimo: args.stockMinimo,
            stockMaximo: args.stockMaximo
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al actualizar stock mínimo y máximo' };
        }
      }
    }
  }
};

module.exports = stockService;