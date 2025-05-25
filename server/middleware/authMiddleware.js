import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        
        // Attach the entire decoded user to the request
        req.user = {
            _id: decoded.id,       // User ID
            role: decoded.role,      // User role
            name: decoded.name,      // User name
            email: decoded.email,    // User email
            // Add any other relevant user data
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired",
                code: "TOKEN_EXPIRED",
                expiredAt: error.expiredAt
            });
        }
        return res.status(401).json({ 
            message: "Invalid token",
            code: "INVALID_TOKEN" 
        });
    }
    
};

// Role-specific middleware
export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }
        next();
    };
};