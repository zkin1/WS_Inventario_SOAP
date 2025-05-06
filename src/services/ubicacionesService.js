const pool = require('../config/database');

const ubicacionesService = {
  UbicacionesService: {
    UbicacionesPort: {
      GetAllUbicaciones: async function() {
        try {
          const [rows] = await pool.query('SELECT * FROM ubicaciones WHERE activo = TRUE ORDER BY nombre');
          return { ubicaciones: { ubicacion: rows } };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener ubicaciones' };
        }
      },
      
      GetUbicacionById: async function(args) {
        try {
          const [rows] = await pool.query('SELECT * FROM ubicaciones WHERE id = ?', [args.id]);
          return rows[0] ? { ubicacion: rows[0] } : { error: 'Ubicación no encontrada' };
        } catch (error) {
          console.error(error);
          return { error: 'Error al obtener la ubicación' };
        }
      },
      
      CreateUbicacion: async function(args) {
        try {
          if (!args.ubicacion.codigo || !args.ubicacion.nombre) {
            return { error: 'El código y nombre son obligatorios' };
          }
          
          const [result] = await pool.query(
            'INSERT INTO ubicaciones (codigo, nombre, descripcion) VALUES (?, ?, ?)',
            [args.ubicacion.codigo, args.ubicacion.nombre, args.ubicacion.descripcion || '']
          );
          
          return { 
            id: result.insertId,
            codigo: args.ubicacion.codigo,
            nombre: args.ubicacion.nombre,
            descripcion: args.ubicacion.descripcion || ''
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al crear la ubicación' };
        }
      },
      
      UpdateUbicacion: async function(args) {
        try {
          if (!args.ubicacion.codigo || !args.ubicacion.nombre) {
            return { error: 'El código y nombre son obligatorios' };
          }
          
          const [result] = await pool.query(
            'UPDATE ubicaciones SET codigo = ?, nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            [
              args.ubicacion.codigo, 
              args.ubicacion.nombre, 
              args.ubicacion.descripcion || '', 
              args.ubicacion.activo !== undefined ? args.ubicacion.activo : true, 
              args.ubicacion.id
            ]
          );
          
          if (result.affectedRows === 0) {
            return { error: 'Ubicación no encontrada' };
          }
          
          return { 
            id: args.ubicacion.id,
            codigo: args.ubicacion.codigo,
            nombre: args.ubicacion.nombre,
            descripcion: args.ubicacion.descripcion || '',
            activo: args.ubicacion.activo !== undefined ? args.ubicacion.activo : true
          };
        } catch (error) {
          console.error(error);
          return { error: 'Error al actualizar la ubicación' };
        }
      },
      
      DeleteUbicacion: async function(args) {
        try {
          const [result] = await pool.query('DELETE FROM ubicaciones WHERE id = ?', [args.id]);
          
          if (result.affectedRows === 0) {
            return { error: 'Ubicación no encontrada' };
          }
          
          return { message: 'Ubicación eliminada correctamente' };
        } catch (error) {
          console.error(error);
          return { error: 'Error al eliminar la ubicación' };
        }
      }
    }
  }
};

module.exports = ubicacionesService;