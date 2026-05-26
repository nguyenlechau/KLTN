import { db } from '../../db/pool.js';
import crypto from 'crypto';
export async function createUser(payload) {
    const passwordHash = crypto.createHash('sha256').update(payload.password).digest('hex');
    const result = await db.query(`INSERT INTO users (email, full_name, password_hash, role_id, status)
     SELECT $1, $2, $3, r.id, $4
     FROM roles r WHERE r.code = $5
     RETURNING id, email, full_name, status, created_at`, [payload.email.toLowerCase(), payload.fullName, passwordHash, 'ACTIVE', payload.role]);
    if (result.rows.length === 0) {
        throw new Error(`Role not found: ${payload.role}`);
    }
    return result.rows[0];
}
export async function getUserById(id) {
    const result = await db.query(`SELECT u.id, u.email, u.full_name, r.code as role, u.status, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`, [id]);
    return result.rows[0];
}
export async function getUsers() {
    const result = await db.query(`SELECT u.id, u.email, u.full_name, r.code as role, u.status, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.deleted_at IS NULL
     ORDER BY u.created_at DESC`);
    return result.rows;
}
export async function updateUser(id, payload) {
    const updates = [];
    const values = [id];
    let paramCount = 2;
    if (payload.email) {
        updates.push(`email = $${paramCount}`);
        values.push(payload.email.toLowerCase());
        paramCount++;
    }
    if (payload.fullName) {
        updates.push(`full_name = $${paramCount}`);
        values.push(payload.fullName);
        paramCount++;
    }
    if (payload.status) {
        updates.push(`status = $${paramCount}`);
        values.push(payload.status);
        paramCount++;
    }
    if (payload.role) {
        updates.push(`role_id = (SELECT id FROM roles WHERE code = $${paramCount})`);
        values.push(payload.role);
        paramCount++;
    }
    if (updates.length === 0) {
        return getUserById(id);
    }
    const result = await db.query(`UPDATE users
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, email, full_name, status, created_at, updated_at`, values);
    if (result.rows.length === 0) {
        throw new Error('User not found');
    }
    return result.rows[0];
}
export async function deleteUser(id) {
    const result = await db.query(`UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
    if (result.rows.length === 0) {
        throw new Error('User not found');
    }
    return { success: true };
}
export async function authenticateUser(email, password) {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const result = await db.query(`SELECT u.id, u.email, u.full_name, r.code as role, u.status, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE lower(u.email) = lower($1) AND u.password_hash = $2 AND u.deleted_at IS NULL`, [email, passwordHash]);
    if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
    }
    const user = result.rows[0];
    if (user.status !== 'ACTIVE') {
        throw new Error(`Account is ${user.status.toLowerCase()}`);
    }
    return user;
}
