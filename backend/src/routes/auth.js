const express = require('express');
const jwt = require('jsonwebtoken');
const Medico = require('../models/medico');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  Medico.getByEmail(email, async (err, medico) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (!medico) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await Medico.verifyPassword(password, medico.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: medico.id, email: medico.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      medico: {
        id: medico.id,
        nombre: medico.nombre,
        apellido: medico.apellido,
        especialidad: medico.especialidad,
        email: medico.email
      }
    });
  });
});

module.exports = router;
