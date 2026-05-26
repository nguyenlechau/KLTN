import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
export function signAccessToken(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        channelIds: user.channelIds ?? [],
    };
    const options = {
        expiresIn: JWT_EXPIRES_IN,
    };
    return jwt.sign(payload, JWT_SECRET, options);
}
export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
