// refreshTokenRoute.js
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Refresh token required',
      code: 'NO_REFRESH_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const newAccessToken = jwt.sign(
      { 
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
        email: decoded.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { 
        id: decoded.id,
        role: decoded.role 
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

export default router;