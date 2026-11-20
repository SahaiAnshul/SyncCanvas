const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'synccanvas_super_secret_jwt_key_anshul_2026_collaborate', {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
