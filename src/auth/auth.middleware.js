// src/auth/auth.middleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1]; // Formato: "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ error: 'Token malformado.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura_nexrust');
    req.user = verified; // Inyecta id, email, role y country_id
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta acción.' });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };