const pool = require('../config/database');
const axios = require('axios');
require('dotenv').config();

const movimientosService = {
  MovimientosService: {
    MovimientosPort: {
      GetAllMovimientos: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          // Extraer filtros
          const filtros = {
            desde: args.desde,
            hasta: args.hasta,
            tipoMovimientoId: args.tipoMovimientoId,
            productoId: args.productoId,
            ubicacionId: args.ubicacionId
          };
          
          let query = `
            SELECT m.*, tm.nombre as tipo_movimiento_nombre, tm.afecta_stock, 
                  uo.nombre as ubicacion_origen_nombre, ud.nombre as ubicacion_destino_nombre
            FROM movimientos m
            LEFT JOIN tipos_movimiento tm ON m.tipo_movimiento_id = tm.id
            LEFT JOIN ubicaciones uo ON m.ubicacion_origen_id = uo.id
            LEFT JOIN ubicaciones ud ON m.ubicacion_destino_id = ud.id
            WHERE 1=1
          `;
          
          const params = [];
          
          // Aplicar filtros
          if (filtros.desde) {
            query += ' AND m.fecha_movimiento >= ?';
            params.push(filtros.desde);
          }
          
          if (filtros.hasta) {
            query += ' AND m.fecha_movimiento <= ?';
            params.push(filtros.hasta);
          }
          
          if (filtros.tipoMovimientoId) {
            query += ' AND m.tipo_movimiento_id = ?';
            params.push(filtros.tipoMovimientoId);
          }
          
          if (filtros.productoId) {
            query += ' AND m.producto_id = ?';
            params.push(filtros.productoId);
          }
          
          if (filtros.ubicacionId) {
            query += ' AND (m.ubicacion_origen_id = ? OR m.ubicacion_destino_id = ?)';
            params.push(filtros.ubicacionId, filtros.ubicacionId);
          }
          
          query += ' ORDER BY m.fecha_movimiento DESC LIMIT ? OFFSET ?';
          params.push(limit, offset);
          
          const [rows] = await pool.query(query, params);
          
          // Construir query para el conteo
          let countQuery = `
            SELECT COUNT(*) as total 
            FROM movimientos m
            WHERE 1=1
          `;
          
          const countParams = [];
          
          // Aplicar filtros para el conteo
          if (filtros.desde) {
            countQuery += ' AND m.fecha_movimiento >= ?';
            countParams.push(filtros.desde);
          }
          
          if (filtros.hasta) {
            countQuery += ' AND m.fecha_movimiento <= ?';
            countParams.push(filtros.hasta);
          }
          
          if (filtros.tipoMovimientoId) {
            countQuery += ' AND m.tipo_movimiento_id = ?';
            countParams.push(filtros.tipoMovimientoId);
          }
          
          if (filtros.productoId) {
            countQuery += ' AND m.producto_id = ?';
            countParams.push(filtros.productoId);
          }
          
          if (filtros.ubicacionId) {
            countQuery += ' AND (m.ubicacion_origen_id = ? OR m.ubicacion_destino_id = ?)';
            countParams.push(filtros.ubicacionId, filtros.ubicacionId);
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
            movimientos: { movimiento: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener movimientos' };
        }
      },
      
      GetMovimientoById: async function(args) {
        try {
          const [rows] = await pool.query(
            `SELECT m.*, tm.nombre as tipo_movimiento_nombre, tm.afecta_stock, 
                    uo.nombre as ubicacion_origen_nombre, ud.nombre as ubicacion_destino_nombre
             FROM movimientos m
             LEFT JOIN tipos_movimiento tm ON m.tipo_movimiento_id = tm.id
             LEFT JOIN ubicaciones uo ON m.ubicacion_origen_id = uo.id
             LEFT JOIN ubicaciones ud ON m.ubicacion_destino_id = ud.id
             WHERE m.id = ?`,
            [args.id]
          );
          
          if (rows.length === 0) return { error: 'Movimiento no encontrado' };
          
          // Enriquecer con datos del producto
          try {
            const response = await axios.get(`${process.env.API_PRODUCTOS_URL}/productos/${rows[0].producto_id}`);
            rows[0].producto = response.data;
          } catch (error) {
            console.error(`Error al obtener producto ID ${rows[0].producto_id}: ${error.message}`);
            rows[0].producto = { nombre: 'Producto no disponible' };
          }
          
          return { movimiento: rows[0] };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener el movimiento' };
        }
      },
      
      GetMovimientosByProducto: async function(args) {
        try {
          const page = parseInt(args.page) || 1;
          const limit = parseInt(args.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [rows] = await pool.query(
            `SELECT m.*, tm.nombre as tipo_movimiento_nombre, tm.afecta_stock, 
                    uo.nombre as ubicacion_origen_nombre, ud.nombre as ubicacion_destino_nombre
             FROM movimientos m
             LEFT JOIN tipos_movimiento tm ON m.tipo_movimiento_id = tm.id
             LEFT JOIN ubicaciones uo ON m.ubicacion_origen_id = uo.id
             LEFT JOIN ubicaciones ud ON m.ubicacion_destino_id = ud.id
             WHERE m.producto_id = ?
             ORDER BY m.fecha_movimiento DESC
             LIMIT ? OFFSET ?`,
            [args.productoId, limit, offset]
          );
          
          const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM movimientos WHERE producto_id = ?',
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
            movimientos: { movimiento: rows },
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener movimientos del producto' };
        }
      },
      
      GetTiposMovimiento: async function() {
        try {
          const [rows] = await pool.query('SELECT * FROM tipos_movimiento ORDER BY nombre');
          return { tiposMovimiento: { tipoMovimiento: rows } };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener tipos de movimiento' };
        }
      },
      
      RegistrarMovimiento: async function(args) {
        try {
          const movimiento = args.movimiento;
          
          // Validación básica
          if (!movimiento.tipoMovimientoId || !movimiento.productoId || !movimiento.cantidad) {
            return { error: 'El tipo de movimiento, producto y cantidad son obligatorios' };
          }
          
          if (parseInt(movimiento.cantidad) <= 0) {
            return { error: 'La cantidad debe ser mayor a cero' };
          }
          
          // Validaciones específicas según el tipo de movimiento
          const [tiposMovimiento] = await pool.query('SELECT * FROM tipos_movimiento WHERE id = ?', [movimiento.tipoMovimientoId]);
          
          if (tiposMovimiento.length === 0) {
            return { error: 'Tipo de movimiento no válido' };
          }
          
          const tipoMovimiento = tiposMovimiento[0];
          
          // Para entradas, se requiere ubicación destino
          if (tipoMovimiento.afecta_stock === 1 && !movimiento.ubicacionDestinoId) {
            return { error: 'Para este tipo de movimiento se requiere especificar la ubicación destino' };
          }
          
          // Para salidas, se requiere ubicación origen
          if (tipoMovimiento.afecta_stock === -1 && !movimiento.ubicacionOrigenId) {
            return { error: 'Para este tipo de movimiento se requiere especificar la ubicación origen' };
          }
          
          // Para traspasos, se requieren ambas ubicaciones
          if (tipoMovimiento.afecta_stock === 0 && 
              (!movimiento.ubicacionOrigenId || !movimiento.ubicacionDestinoId)) {
            return { error: 'Para traspasos se requiere especificar ubicación origen y destino' };
          }
          
          // Para traspasos, origen y destino deben ser diferentes
          if (tipoMovimiento.afecta_stock === 0 && 
              movimiento.ubicacionOrigenId === movimiento.ubicacionDestinoId) {
            return { error: 'La ubicación origen y destino no pueden ser iguales' };
          }
          
          const connection = await pool.getConnection();
          
          try {
            // Iniciar transacción
            await connection.beginTransaction();
            
            // Insertar el movimiento
            const [resultMovimiento] = await connection.query(
              `INSERT INTO movimientos 
                (tipo_movimiento_id, producto_id, ubicacion_origen_id, ubicacion_destino_id, 
                cantidad, documento_referencia, usuario_id, notas)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                movimiento.tipoMovimientoId,
                movimiento.productoId,
                movimiento.ubicacionOrigenId || null,
                movimiento.ubicacionDestinoId || null,
                movimiento.cantidad,
                movimiento.documentoReferencia || null,
                movimiento.usuarioId || null,
                movimiento.notas || null
              ]
            );
            
            const movimientoId = resultMovimiento.insertId;
            
            // ENTRADA o DEVOLUCIÓN (+1)
            if (tipoMovimiento.afecta_stock === 1 && movimiento.ubicacionDestinoId) {
              // Obtener stock actual
              const [stockActual] = await connection.query(
                'SELECT * FROM stock WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.productoId, movimiento.ubicacionDestinoId]
              );
              
              if (stockActual.length > 0) {
                // Actualizar stock existente
                await connection.query(
                  'UPDATE stock SET cantidad = cantidad + ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE producto_id = ? AND ubicacion_id = ?',
                  [movimiento.cantidad, movimiento.productoId, movimiento.ubicacionDestinoId]
                );
              } else {
                // Crear nuevo registro de stock
                await connection.query(
                  'INSERT INTO stock (producto_id, ubicacion_id, cantidad) VALUES (?, ?, ?)',
                  [movimiento.productoId, movimiento.ubicacionDestinoId, movimiento.cantidad]
                );
              }
            }
            
            // SALIDA o BAJA (-1)
            else if (tipoMovimiento.afecta_stock === -1 && movimiento.ubicacionOrigenId) {
              // Verificar stock disponible
              const [stockActual] = await connection.query(
                'SELECT * FROM stock WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.productoId, movimiento.ubicacionOrigenId]
              );
              
              if (stockActual.length === 0) {
                throw new Error('No hay stock registrado para este producto en esta ubicación');
              }
              
              if (stockActual[0].cantidad < movimiento.cantidad) {
                throw new Error('Stock insuficiente para realizar el movimiento');
              }
              
              // Actualizar stock
              await connection.query(
                'UPDATE stock SET cantidad = cantidad - ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.cantidad, movimiento.productoId, movimiento.ubicacionOrigenId]
              );
            }
            
            // TRASPASO (0) - Manejar origen y destino
            else if (tipoMovimiento.afecta_stock === 0 && movimiento.ubicacionOrigenId && movimiento.ubicacionDestinoId) {
              // Verificar stock disponible en origen
              const [stockOrigen] = await connection.query(
                'SELECT * FROM stock WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.productoId, movimiento.ubicacionOrigenId]
              );
              
              if (stockOrigen.length === 0) {
                throw new Error('No hay stock registrado para este producto en la ubicación de origen');
              }
              
              if (stockOrigen[0].cantidad < movimiento.cantidad) {
                throw new Error('Stock insuficiente en la ubicación de origen para realizar el traspaso');
              }
              
              // Restar del origen
              await connection.query(
                'UPDATE stock SET cantidad = cantidad - ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.cantidad, movimiento.productoId, movimiento.ubicacionOrigenId]
              );
              
              // Verificar si existe stock en destino
              const [stockDestino] = await connection.query(
                'SELECT * FROM stock WHERE producto_id = ? AND ubicacion_id = ?',
                [movimiento.productoId, movimiento.ubicacionDestinoId]
              );
              
              if (stockDestino.length > 0) {
                // Actualizar stock existente en destino
                await connection.query(
                  'UPDATE stock SET cantidad = cantidad + ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE producto_id = ? AND ubicacion_id = ?',
                  [movimiento.cantidad, movimiento.productoId, movimiento.ubicacionDestinoId]
                );
              } else {
                // Crear nuevo registro de stock en destino
                await connection.query(
                  'INSERT INTO stock (producto_id, ubicacion_id, cantidad) VALUES (?, ?, ?)',
                  [movimiento.productoId, movimiento.ubicacionDestinoId, movimiento.cantidad]
                );
              }
            }
            
            // Confirmar transacción
            await connection.commit();
            
            return { 
              message: 'Movimiento registrado correctamente',
              id: movimientoId
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
          return { error: `Error al registrar el movimiento: ${error.message}` };
        }
      }
    }
  }
};

module.exports = movimientosService;