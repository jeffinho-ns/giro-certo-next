'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { User, UserRole, UserType } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/protected-route';

const LOJISTA_ACCESS = 'LOJISTA';
const RIDER_TYPE_PLACEHOLDER = 'SEM_TIPO';

type UserAccessType = UserRole | typeof LOJISTA_ACCESS;

const USER_ACCESS_OPTIONS: Array<{ value: UserAccessType; label: string }> = [
  { value: LOJISTA_ACCESS, label: 'Lojista' },
  { value: UserRole.MODERATOR, label: 'Moderador' },
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.USER, label: 'Usuário' },
];

const RIDER_TYPE_OPTIONS = [
  { value: UserType.CASUAL, label: 'Casual' },
  { value: UserType.DIARIO, label: 'Diário' },
  { value: UserType.RACING, label: 'Racing' },
  { value: UserType.DELIVERY, label: 'Delivery' },
] as const;

const USER_TYPE_OPTIONS = [
  ...RIDER_TYPE_OPTIONS,
  { value: UserType.LOJISTA, label: 'Lojista' },
] as const;

const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.CASUAL]: 'Casual',
  [UserType.DIARIO]: 'Diário',
  [UserType.RACING]: 'Racing',
  [UserType.DELIVERY]: 'Delivery',
  [UserType.LOJISTA]: 'Lojista',
};

const isUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

const isUserType = (value: string): value is UserType => {
  return Object.values(UserType).includes(value as UserType);
};

const isRiderType = (value: string): value is UserType => {
  return RIDER_TYPE_OPTIONS.some((option) => option.value === value);
};

const resolveUserType = (user: User): UserType | null => {
  if (user.userType && isUserType(user.userType)) {
    return user.userType;
  }

  switch (user.pilotProfile?.toUpperCase()) {
    case 'FIM_DE_SEMANA':
      return UserType.CASUAL;
    case 'URBANO':
      return UserType.DIARIO;
    case 'PISTA':
      return UserType.RACING;
    case 'TRABALHO':
      return UserType.DELIVERY;
    default:
      return null;
  }
};

const resolveUserAccess = (user: User): UserAccessType => {
  if (user.role === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }

  if (user.role === UserRole.MODERATOR) {
    return UserRole.MODERATOR;
  }

  return resolveUserType(user) === UserType.LOJISTA ? LOJISTA_ACCESS : UserRole.USER;
};

const getLegacyPilotProfileFromUserType = (userType: UserType): string | null => {
  switch (userType) {
    case UserType.CASUAL:
      return 'FIM_DE_SEMANA';
    case UserType.DIARIO:
      return 'URBANO';
    case UserType.RACING:
      return 'PISTA';
    case UserType.DELIVERY:
      return 'TRABALHO';
    default:
      return null;
  }
};

const getUserTypeLabel = (userType: UserType | null) => {
  if (!userType) {
    return 'Não definido';
  }

  return USER_TYPE_LABELS[userType] || userType;
};

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [filterUserType, setFilterUserType] = useState<'all' | UserType>('all');
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [updatingTypeUserId, setUpdatingTypeUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ users: User[] }>('/api/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingRoleUserId(userId);
      await apiClient.put(`/api/users/${userId}/role`, { role: newRole });
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      alert('Erro ao atualizar permissão do usuário');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const updateUserType = async (userId: string, newType: UserType) => {
    try {
      setUpdatingTypeUserId(userId);

      // Tentamos contratos diferentes para suportar versões de API em transição.
      const updateAttempts: Array<() => Promise<unknown>> = [
        () => apiClient.put(`/api/users/${userId}/type`, { userType: newType }),
        () => apiClient.put(`/api/users/${userId}/type`, { type: newType }),
        () => apiClient.put(`/api/users/${userId}/user-type`, { userType: newType }),
        () => apiClient.put(`/api/users/${userId}/user-type`, { type: newType }),
        () => apiClient.put(`/api/users/${userId}`, { userType: newType }),
      ];

      const legacyPilotProfile = getLegacyPilotProfileFromUserType(newType);
      if (legacyPilotProfile) {
        updateAttempts.push(
          () => apiClient.put(`/api/users/${userId}/pilot-profile`, { pilotProfile: legacyPilotProfile }),
          () => apiClient.put(`/api/users/${userId}`, { pilotProfile: legacyPilotProfile })
        );
      }

      let lastError: unknown;
      for (const updateAttempt of updateAttempts) {
        try {
          await updateAttempt();
          await loadUsers();
          return;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error('Falha ao atualizar tipo de usuário');
    } catch (error) {
      console.error('Erro ao atualizar tipo de usuário:', error);
      alert('Erro ao atualizar tipo de usuário. Verifique se o endpoint já está disponível na API.');
    } finally {
      setUpdatingTypeUserId(null);
    }
  };

  const updateUserAccess = async (user: User, newAccess: UserAccessType) => {
    const currentAccess = resolveUserAccess(user);
    if (currentAccess === newAccess) {
      return;
    }

    if (newAccess === UserRole.ADMIN || newAccess === UserRole.MODERATOR) {
      await updateUserRole(user.id, newAccess);
      return;
    }

    if (newAccess === LOJISTA_ACCESS) {
      await updateUserRole(user.id, UserRole.USER);
      await updateUserType(user.id, UserType.LOJISTA);
      return;
    }

    await updateUserRole(user.id, UserRole.USER);

    // Se estava marcado como lojista, converte para um tipo padrão de motociclista.
    if (resolveUserType(user) === UserType.LOJISTA) {
      await updateUserType(user.id, UserType.DIARIO);
    }
  };

  const deleteUser = async (user: User) => {
    if (!isAdmin) {
      return;
    }

    if (currentUser?.id === user.id) {
      alert('Você não pode excluir sua própria conta por aqui.');
      return;
    }

    const confirmed = window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      await apiClient.delete(`/api/users/${user.id}`);
      await loadUsers();
      alert('Usuário excluído com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Verifique se o endpoint de exclusão já está disponível na API.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const resolvedUserType = resolveUserType(user);
    const matchesUserType = filterUserType === 'all' || resolvedUserType === filterUserType;
    return matchesSearch && matchesRole && matchesUserType;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case UserRole.MODERATOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getUserTypeBadgeColor = (userType: UserType | null) => {
    switch (userType) {
      case UserType.CASUAL:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
      case UserType.DIARIO:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case UserType.RACING:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case UserType.DELIVERY:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case UserType.LOJISTA:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie permissões, tipo de usuário e níveis de acesso dos usuários do sistema
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filterRole}
            onValueChange={(value) => {
              if (value === 'all') {
                setFilterRole('all');
                return;
              }
              if (isUserRole(value)) {
                setFilterRole(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value={UserRole.ADMIN}>Administradores</SelectItem>
              <SelectItem value={UserRole.MODERATOR}>Moderadores</SelectItem>
              <SelectItem value={UserRole.USER}>Usuários</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterUserType}
            onValueChange={(value) => {
              if (value === 'all') {
                setFilterUserType('all');
                return;
              }
              if (isUserType(value)) {
                setFilterUserType(value);
              }
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {USER_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de usuários */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tipo de Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const resolvedUserType = resolveUserType(user);
                      const isRowLoading =
                        updatingRoleUserId === user.id ||
                        updatingTypeUserId === user.id ||
                        deletingUserId === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-foreground">{user.name}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeColor(
                                resolvedUserType
                              )}`}
                            >
                              {getUserTypeLabel(resolvedUserType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isOnline
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {user.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Select
                                value={resolveUserAccess(user)}
                                onValueChange={(value) => {
                                  if (value === LOJISTA_ACCESS) {
                                    updateUserAccess(user, LOJISTA_ACCESS);
                                    return;
                                  }

                                  if (isUserRole(value)) {
                                    updateUserAccess(user, value);
                                  }
                                }}
                                disabled={!isAdmin || isRowLoading}
                              >
                                <SelectTrigger className="w-[170px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {USER_ACCESS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {resolveUserAccess(user) === UserRole.USER ? (
                                <Select
                                  value={
                                    resolvedUserType && isRiderType(resolvedUserType)
                                      ? resolvedUserType
                                      : RIDER_TYPE_PLACEHOLDER
                                  }
                                  onValueChange={(value) => {
                                    if (isRiderType(value)) {
                                      updateUserType(user.id, value);
                                    }
                                  }}
                                  disabled={!isAdmin || isRowLoading}
                                >
                                  <SelectTrigger className="w-[190px]">
                                    <SelectValue placeholder="Tipo motociclista" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={RIDER_TYPE_PLACEHOLDER}>Selecionar tipo</SelectItem>
                                    {RIDER_TYPE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : null}

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteUser(user)}
                                disabled={!isAdmin || isRowLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingUserId === user.id ? 'Excluindo...' : 'Excluir'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Total: {filteredUsers.length} usuário(s)
        </div>
      </div>
    </ProtectedRoute>
  );
}