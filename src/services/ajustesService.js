const pool = require('../config/database');
const axios = require('axios');
require('dotenv').config();

const ajustesService = {
  AjustesService: {
    AjustesPort: {
      GetAllAjustes: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          // Extraer filtros
          const filtros = {
            desde: args.desde,
            hasta: args.hasta,
            productoId: args.productoId,
            ubicacionId: args.ubicacionId
          };
          
          let query = `
            SELECT a.*, u.nombre as ubicacion_nombre
            FROM ajustes a
            JOIN ubicaciones u ON a.ubicacion_id = u.id
            WHERE 1=1
          `;
          
          const params = [];
          
          // Aplicar filtros
          if (filtros.desde) {
            query += ' AND a.fecha_ajuste >= ?';
            params.push(filtros.desde);
          }
          
          if (filtros.hasta) {
            query += ' AND a.fecha_ajuste <= ?';
            params.push(filtros.hasta);
          }
          
          if (filtros.productoId) {
            query += ' AND a.producto_id = ?';
            params.push(filtros.productoId);
          }
          
          if (filtros.ubicacionId) {
            query += ' AND a.ubicacion_id = ?';
            params.push(filtros.ubicacionId);
          }
          
          query += ' ORDER BY a.fecha_ajuste DESC LIMIT ? OFFSET ?';
          params.push(limit, offset);
          
          const [rows] = await pool.query(query, params);
          
          // Construir query para el conteo
          let countQuery = `
            SELECT COUNT(*) as total 
            FROM ajustes a
            WHERE 1=1
          `;
          
          const countParams = [];
          
          // Aplicar filtros para el conteo
          if (filtros.desde) {
            countQuery += ' AND a.fecha_ajuste >= ?';
            countParams.push(filtros.desde);
          }
          
          if (filtros.hasta) {
            countQuery += ' AND a.fecha_ajuste <= ?';
            countParams.push(filtros.hasta);
          }
          
          if (filtros.productoId) {
            countQuery += ' AND a.producto_id = ?';
            countParams.push(filtros.productoId);
          }
          
          if (filtros.ubicacionId) {
            countQuery += ' AND a.ubicacion_id = ?';
            countParams.push(filtros.ubicacionId);
          }
          
          const [countResult] = await pool.query(countQuery, countParams);
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
            ajustes: { ajuste: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener ajustes' };
        }
      },
      
      GetAjusteById: async function(args) {
        try {
          const [rows] = await pool.query(
            `SELECT a.*, u.nombre as ubicacion_nombre
             FROM ajustes a
             JOIN ubicaciones u ON a.ubicacion_id = u.id
             WHERE a.id = ?`,
            [args.id]
          );
          
          if (rows.length === 0) return { error: 'Ajuste no encontrado' };
          
          // Enriquecer con datos del producto
          try {
            const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${rows[0].producto_id}`);
            rows[0].producto = response.data;
          } catch (error) {
            console.error(`Error al obtener producto ID ${rows[0].producto_id}: ${error.message}`);
            rows[0].producto = { nombre: 'Producto no disponible' };
          }
          
          return { ajuste: rows[0] };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener el ajuste' };
        }
      },
      
      GetAjustesByProducto: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [rows] = await pool.query(
            `SELECT a.*, u.nombre as ubicacion_nombre
             FROM ajustes a
             JOIN ubicaciones u ON a.ubicacion_id = u.id
             WHERE a.producto_id = ?
             ORDER BY a.fecha_ajuste DESC
             LIMIT ? OFFSET ?`,
            [args.productoId, limit, offset]
          );
          
          const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM ajustes WHERE producto_id = ?',
            [args.productoId]
          );
          const total = countResult[0].total;
          
          // Obtener información del producto
          let producto = null;
          try {
            const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${args.productoId}`);
            producto = response.data;
          } catch (error) {
            console.error(`Error al obtener producto ID ${args.productoId}: ${error.message}`);
            producto = { id: args.productoId, nombre: 'Producto no disponible' };
          }
          
          return {
            producto,
            ajustes: { ajuste: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener ajustes del producto' };
        }
      },
      
      RegistrarAjuste: async function(args) {
        try {
          const ajuste = args.ajuste;
          
          // Validación básica
          if (!ajuste.productoId || !ajuste.ubicacionId || 
              ajuste.cantidadNueva === undefined || !ajuste.motivoAjuste) {
            return { error: 'El producto, ubicación, cantidad nueva y motivo son obligatorios' };
          }
          
          if (parseInt(ajuste.cantidadNueva) < 0) {
            return { error: 'La cantidad nueva no puede ser negativa' };
          }
          
          const connection = await pool.getConnection();
          
          try {
            // Iniciar transacción
            await connection.beginTransaction();
            
            
            // Obtener stock actual
            const [stockActual] = await connection.query(
              'SELECT * FROM stock WHERE producto_id = ? AND ubicacion_id = ?',
              [ajuste.productoId, ajuste.ubicacionId]
            );

            let cantidadAnterior = 0;

            if (stockActual.length === 0) {
              // No existe stock, crear uno nuevo
              console.log('Creando nuevo registro de stock para producto ID:', ajuste.productoId, 'en ubicación ID:', ajuste.ubicacionId);
              
              await connection.query(
                `INSERT INTO stock 
                  (producto_id, ubicacion_id, cantidad, stock_minimo, stock_maximo, ultima_actualizacion) 
                VALUES (?, ?, 0, 0, 0, CURRENT_TIMESTAMP)`,
                [ajuste.productoId, ajuste.ubicacionId]
              );
            } else {
              cantidadAnterior = stockActual[0].cantidad;
            }
            
            // Registrar el ajuste
            const [resultAjuste] = await connection.query(
              `INSERT INTO ajustes
                (producto_id, ubicacion_id, cantidad_anterior, cantidad_nueva, motivo_ajuste, descripcion, usuario_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                ajuste.productoId,
                ajuste.ubicacionId,
                cantidadAnterior,
                ajuste.cantidadNueva,
                ajuste.motivoAjuste,
                ajuste.descripcion || null,
                ajuste.usuarioId || null
              ]
            );
            
            const ajusteId = resultAjuste.insertId;
            
            // Actualizar el stock
            await connection.query(
              'UPDATE stock SET cantidad = ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE producto_id = ? AND ubicacion_id = ?',
              [ajuste.cantidadNueva, ajuste.productoId, ajuste.ubicacionId]
            );
            
            // Confirmar transacción
            await connection.commit();
            
            return { 
              message: 'Ajuste registrado correctamente',
              id: ajusteId
            };
          } catch (error) {
            // Revertir los cambios si hay error
            await connection.rollback();
            throw error;
          } finally {
            // Liberar la conexión
            connection.release();
          }
        } catch (error) {
          console.error(error);
          return { error: `Error al registrar el ajuste: ${error.message}` };
        }
      }
    }
  }
};

module.exports = ajustesService;