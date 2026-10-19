import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile, UserRole } from '../types';
import { useCorporateAuth } from '../context/CorporateAuthContext';
import { CorporateUserService, isSuperAdminEmail } from '../services/corporateUserService';
import { getUserInitials } from '../utils/userFormatters';
import { sendWhitelistInvitationEmail } from '../services/corporateEmailService';
import {
  UserPlus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Send,
  AlertCircle
} from 'lucide-react';

export interface CorporateWhitelistManagerProps {
  db: any;
  superAdmins: string[];
}

export const CorporateWhitelistManager: React.FC<CorporateWhitelistManagerProps> = ({
  db,
  superAdmins
}) => {
  const { currentUser, tenantConfig } = useCorporateAuth();
  const userService = useMemo(() => new CorporateUserService(db, superAdmins, tenantConfig), [db, superAdmins, tenantConfig]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Alta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Operations');
  const [newCompany, setNewCompany] = useState(tenantConfig.companyName);
  const [newDepartment, setNewDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Edición
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Operations');
  const [editCompany, setEditCompany] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'rejected'>('approved');
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = userService.subscribeAllUsers((userList) => {
      setUsers(userList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userService]);

  const handleResendInvite = async (u: UserProfile) => {
    setSendingEmailFor(u.id);
    setFeedback(null);
    try {
      const success = await sendWhitelistInvitationEmail({
        recipientEmail: u.email,
        recipientName: u.name,
        assignedRole: u.role,
        companyName: u.companyName || tenantConfig.companyName,
        appName: tenantConfig.appName,
        adminEmail: tenantConfig.adminEmail,
        appUrl: tenantConfig.appUrl
      });
      if (success) {
        setFeedback({ type: 'success', text: `Correo de invitación enviado exitosamente a ${u.email}!` });
      } else {
        setFeedback({ type: 'error', text: `No se pudo enviar el correo a ${u.email}.` });
      }
    } catch (err: any) {
      console.error('Error sending invite email:', err);
      setFeedback({ type: 'error', text: `Error al enviar correo: ${err?.message || 'Error de red'}` });
    } finally {
      setSendingEmailFor(null);
    }
  };

  const handleAddUserToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await userService.addToWhitelist({
        email: newEmail.trim(),
        name: newName.trim(),
        role: newRole,
        companyName: newCompany.trim(),
        department: newDepartment.trim(),
        approvedBy: currentUser?.email || 'Admin',
        sendNotification: true
      });

      setFeedback({ type: 'success', text: `Usuario ${newEmail} añadido a la Whitelist y correo enviado.` });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewRole('Operations');
      setNewDepartment('');
    } catch (err: any) {
      console.error('Error adding user to whitelist:', err);
      setFeedback({ type: 'error', text: `Error: ${err?.message || 'No se pudo agregar el usuario'}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditRole(u.role);
    setEditCompany(u.companyName || tenantConfig.companyName);
    setEditStatus(u.status === 'approved' ? 'approved' : 'rejected');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setFeedback(null);

    try {
      await userService.updateUser(editingUser.id, {
        name: editName.trim(),
        role: editRole,
        companyName: editCompany.trim(),
        status: editStatus,
        customNameEdited: true
      });

      setFeedback({ type: 'success', text: `Perfil de ${editingUser.email} actualizado.` });
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setFeedback({ type: 'error', text: `Error al actualizar: ${err?.message || 'Error desconocido'}` });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (isSuperAdminEmail(u.email, superAdmins)) {
      alert('No se puede eliminar a un Super Administrador del sistema.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar el acceso de ${u.email}?`)) {
      return;
    }
    try {
      await userService.deleteUser(u.id);
      setFeedback({ type: 'success', text: `Acceso eliminado para ${u.email}.` });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setFeedback({ type: 'error', text: `Error al eliminar: ${err?.message || 'Error desconocido'}` });
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term)) ||
      (u.companyName && u.companyName.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ink, #10201d)', margin: 0 }}>
            Gestión de Usuarios & Lista Blanca
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted, #60706c)', margin: '4px 0 0 0' }}>
            Control de acceso corporativo mediante Google Workspace y Microsoft 365 con pre-alta segura.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--teal, #00bfa8)',
            color: 'var(--ink, #10201d)',
            fontWeight: 800,
            fontSize: '13.5px',
            padding: '10px 18px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 191, 168, 0.25)'
          }}
        >
          <UserPlus size={16} /> Añadir a Lista Blanca
        </button>
      </div>

      {feedback && (
        <div style={{
          backgroundColor: feedback.type === 'success' ? 'rgba(16, 166, 109, 0.08)' : 'rgba(223, 63, 69, 0.08)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 166, 109, 0.3)' : 'rgba(223, 63, 69, 0.3)'}`,
          color: feedback.type === 'success' ? 'var(--green, #10a66d)' : 'var(--red, #df3f45)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} style={{ fontWeight: 800, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--line, #dbe6e3)',
        borderRadius: '10px',
        padding: '8px 16px',
        marginBottom: '20px'
      }}>
        <Search size={18} color="var(--muted, #60706c)" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            padding: '6px 0',
            fontSize: '14px',
            outline: 'none',
            width: '100%',
            backgroundColor: 'transparent'
          }}
        />
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--line, #dbe6e3)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(16, 32, 29, 0.04)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--paper-2, #f1f5f4)', borderBottom: '1px solid var(--line, #dbe6e3)', color: 'var(--muted, #60706c)', fontWeight: 800, textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 20px' }}>Usuario</th>
              <th style={{ padding: '14px 20px' }}>Empresa / Dept</th>
              <th style={{ padding: '14px 20px' }}>Rol</th>
              <th style={{ padding: '14px 20px' }}>Estado</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted, #60706c)' }}>
                  Cargando lista de usuarios...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted, #60706c)' }}>
                  No se encontraron usuarios en la lista blanca.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSuper = isSuperAdminEmail(u.email, superAdmins);
                const isApproved = u.status === 'approved';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--line, #dbe6e3)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isSuper ? 'var(--ink, #10201d)' : 'var(--paper-2, #f1f5f4)',
                          color: isSuper ? 'var(--teal, #00bfa8)' : 'var(--ink, #10201d)',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: '13px',
                          border: '1px solid var(--line, #dbe6e3)'
                        }}>
                          {getUserInitials(u.name, u.email)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--ink, #10201d)' }}>
                            {u.name || 'Sin Nombre Registrado'} {isSuper && <span style={{ fontSize: '10px', background: 'var(--ink)', color: 'var(--teal)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>SUPER ADMIN</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted, #60706c)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--ink, #10201d)' }}>
                      <div>{u.companyName || tenantConfig.companyName}</div>
                      {u.department && <div style={{ fontSize: '11.5px', color: 'var(--muted, #60706c)' }}>{u.department}</div>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        backgroundColor: u.role === 'Admin' ? 'rgba(0, 191, 168, 0.15)' : 'var(--paper-2, #f1f5f4)',
                        color: u.role === 'Admin' ? 'var(--teal-dark, #008b7e)' : 'var(--ink, #10201d)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        backgroundColor: isApproved ? 'rgba(16, 166, 109, 0.12)' : 'rgba(223, 63, 69, 0.12)',
                        color: isApproved ? 'var(--green, #10a66d)' : 'var(--red, #df3f45)'
                      }}>
                        {isApproved ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {isApproved ? 'Autorizado' : 'Rechazado'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleResendInvite(u)}
                          disabled={sendingEmailFor === u.id}
                          title="Reenviar correo de invitación / bienvenida"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--line, #dbe6e3)',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--teal-dark, #008b7e)'
                          }}
                        >
                          <Send size={13} /> {sendingEmailFor === u.id ? 'Enviando...' : 'Reenviar'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar usuario"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--line, #dbe6e3)',
                            color: 'var(--ink, #10201d)'
                          }}
                        >
                          <Edit3 size={14} />
                        </button>

                        {!isSuper && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Eliminar de lista blanca"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(223, 63, 69, 0.3)',
                              color: 'var(--red, #df3f45)'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(16, 32, 29, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(16, 32, 29, 0.2)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink, #10201d)', marginTop: 0, marginBottom: '6px' }}>
              Pre-alta en Lista Blanca
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted, #60706c)', marginBottom: '18px' }}>
              El usuario podrá autenticarse inmediatamente con su cuenta institucional de Google o Microsoft.
            </p>

            <form onSubmit={handleAddUserToWhitelist}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                  Correo Corporativo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@npr.cl o @empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                  Nombre y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre Apellido"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                    Rol Asignado *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="Operations">Operations</option>
                    <option value="Management">Management</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                  Departamento / Área
                </label>
                <input
                  type="text"
                  placeholder="ej: Operaciones Portuarias, Finanzas"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #dbe6e3)',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--teal, #00bfa8)',
                    color: 'var(--ink, #10201d)',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Guardando...' : 'Añadir y Enviar Notificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(16, 32, 29, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(16, 32, 29, 0.2)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink, #10201d)', marginTop: 0, marginBottom: '6px' }}>
              Editar Usuario
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted, #60706c)', marginBottom: '18px' }}>
              {editingUser.email}
            </p>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                    Rol
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={isSuperAdminEmail(editingUser.email, superAdmins)}
                  >
                    <option value="Operations">Operations</option>
                    <option value="Management">Management</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                    Estado de Acceso
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'approved' | 'rejected')}
                    disabled={isSuperAdminEmail(editingUser.email, superAdmins)}
                  >
                    <option value="approved">Autorizado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px', color: 'var(--ink, #10201d)' }}>
                  Empresa
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #dbe6e3)',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--teal, #00bfa8)',
                    color: 'var(--ink, #10201d)',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: savingEdit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingEdit ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
