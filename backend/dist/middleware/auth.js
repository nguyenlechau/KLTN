import { verifyAccessToken } from '../auth/jwt.js';
import { ROLE_PERMISSION_MATRIX, CENTRAL_ROLES } from '../config/rbac.js';
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid authorization header' });
        return;
    }
    const token = authHeader.slice('Bearer '.length);
    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            channelIds: payload.channelIds ?? [],
        };
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
export function requirePermission(permission) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const permissions = ROLE_PERMISSION_MATRIX[user.role] ?? [];
        if (!permissions.includes(permission)) {
            res.status(403).json({ message: `Missing permission: ${permission}` });
            return;
        }
        next();
    };
}
const editableStates = new Set(['DRAFT', 'REVISION_REQUIRED']);
const stateActionAllow = {
    EDIT: ['DRAFT', 'REVISION_REQUIRED'],
    SUBMIT: ['DRAFT', 'REVISION_REQUIRED'],
    REVIEW: ['SUPERVISOR_REVIEW', 'CENTRAL_OPS_REVIEW'],
    APPROVE: ['MANAGER_APPROVAL'],
    DEPLOY: ['APPROVED'],
    ACCEPT: ['DEPLOYMENT_PREP'],
    COMPLETE: ['FINAL_ACCEPTANCE'],
};
export function guardRegistrationState(context) {
    return stateActionAllow[context.action].includes(context.state);
}
export function requireRoles(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Role not allowed' });
            return;
        }
        next();
    };
}
export function enforceRowOwnership(ownerField, channelField = 'channel_id') {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const row = (res.locals.entity ?? {});
        const isCentral = CENTRAL_ROLES.has(user.role);
        if (isCentral) {
            next();
            return;
        }
        const ownerId = row[ownerField];
        if (ownerId && ownerId === user.id) {
            next();
            return;
        }
        const rowChannelId = row[channelField];
        if (rowChannelId && user.channelIds?.includes(String(rowChannelId))) {
            next();
            return;
        }
        res.status(403).json({ message: 'Row-level access denied' });
    };
}
export function canEditRegistrationState(state) {
    return editableStates.has(state);
}
