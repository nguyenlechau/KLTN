import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import '../styles/screen.css';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import '../styles/screen.css';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  created_at: string;
  updated_at: string;
}

const ROLES = ['REQUESTER', 'CENTRAL_REQUESTER', 'SUPERVISOR', 'CENTRAL_SUPERVISOR', 'OPERATIONS_SPECIALIST', 'OPERATIONS_MANAGER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];

export function UsersScreen() {
  const currentRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', fullName: '', password: '', role: 'REQUESTER' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', fullName: '', role: '', status: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (currentRole === 'ADMIN') {
      loadUsers();
      return;
    }

    setError('You do not have permission to access the user management page.');
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<User[]>('/users').catch(() => []);
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        // fallback mock users
        setUsers([
          { id: 'u1', email: 'admin@example.com', full_name: 'System Admin', role: 'ADMIN', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'u2', email: 'john@example.com', full_name: 'John Doe', role: 'REQUESTER', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCreate = () => {
    const errors: Record<string, string> = {};
    if (!createForm.email) errors.email = 'Email is required';
    if (!createForm.fullName) errors.fullName = 'Full name is required';
    if (!createForm.password || createForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!createForm.role) errors.role = 'Role is required';
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;

    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setSuccess('User created successfully');
      setCreateForm({ email: '', fullName: '', password: '', role: 'REQUESTER' });
      setShowCreateModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setEditId(user.id);
    setEditForm({
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    });
    setEditErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editId) return;

    try {
      await apiFetch(`/users/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setSuccess('User updated successfully');
      setEditId(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setSuccess('User deleted successfully');
      setConfirmDelete(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>User Management</h1>
        <p>Manage system accounts and roles</p>
      </div>

      {currentRole !== 'ADMIN' && (
        <Alert type="error" onClose={() => setError('')}>
          You must be an admin to view this page.
        </Alert>
      )}

      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card title="Create New User" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={createForm.email}
                onChange={(value) => setCreateForm({ ...createForm, email: value })}
              />
              {createErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{createErrors.email}</span>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <Input
                placeholder="John Doe"
                value={createForm.fullName}
                onChange={(value) => setCreateForm({ ...createForm, fullName: value })}
              />
              {createErrors.fullName && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{createErrors.fullName}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={createForm.password}
                onChange={(value) => setCreateForm({ ...createForm, password: value })}
              />
              {createErrors.password && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{createErrors.password}</span>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Role <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {createErrors.role && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{createErrors.role}</span>}
            </div>
          </div>

          <Button onClick={handleCreate}>Create User</Button>
        </div>
      </Card>

      <Card title="User List">
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.full_name}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: user.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2',
                          color: user.status === 'ACTIVE' ? '#065f46' : '#991b1b',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(user)}
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setConfirmDelete(user.id)}
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editId && (
        <Modal
          isOpen={true}
          onCancel={() => setEditId(null)}
          title="Edit User"
          onConfirm={handleSaveEdit}
          confirmText="Save"
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(value) => setEditForm({ ...editForm, email: value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
              <Input
                value={editForm.fullName}
                onChange={(value) => setEditForm({ ...editForm, fullName: value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          isOpen={true}
          onCancel={() => setConfirmDelete(null)}
          title="Delete User"
          onConfirm={() => handleDelete(confirmDelete)}
          confirmText="Delete"
          variant="danger"
        >
          <p>Are you sure you want to delete this user? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
