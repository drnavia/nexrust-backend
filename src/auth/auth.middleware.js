/**
 * @file auth.middleware.js
 * @description Middleware para verificar la validez del token JWT de sesión 
 * y permitir control de roles (ej. superadmin, resident, admin).
 * @location /nexrust-backend/src/auth/auth.middleware.js
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware estándar para verificar el token de autorización (Bearer Token).
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado. Token no proveído.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'nexrust_secret_key_temporal';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Inyecta { id, email, role, country_id } en la petición
    next();
  } catch (err) {
    console.error('Error al verificar el token JWT:', err);
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware para restringir rutas a un rol específico (ej. 'superadmin').
 */
const verifyRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere el rol '${requiredRole}'. Tu rol actual es '${req.user?.role || 'desconocido'}'` 
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  verifyRole
};