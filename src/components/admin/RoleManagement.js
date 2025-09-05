import React, { useState } from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  StarIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  KeyIcon,
  UserIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const RoleManagement = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'admin',
      status: 'active',
      joinedDate: '2024-01-15',
      lastActive: '2024-09-05',
      permissions: ['all']
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      role: 'moderator',
      status: 'active',
      joinedDate: '2024-02-10',
      lastActive: '2024-09-04',
      permissions: ['manage_meetings', 'moderate_users']
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.w@company.com',
      role: 'host',
      status: 'active',
      joinedDate: '2024-03-05',
      lastActive: '2024-09-03',
      permissions: ['create_meetings', 'manage_participants']
    },
    {
      id: 4,
      name: 'Lisa Chen',
      email: 'lisa.chen@company.com',
      role: 'participant',
      status: 'suspended',
      joinedDate: '2024-04-01',
      lastActive: '2024-08-28',
      permissions: ['join_meetings']
    }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'participant',
    permissions: []
  });

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      icon: ShieldCheckIcon,
      color: 'red',
      description: 'Full system access and control',
      permissions: [
        'all_permissions',
        'manage_users',
        'manage_roles',
        'system_settings',
        'view_analytics',
        'manage_meetings',
        'moderate_users',
        'create_meetings',
        'manage_participants',
        'join_meetings'
      ]
    },
    {
      id: 'moderator',
      name: 'Moderator',
      icon: StarIcon,
      color: 'purple',
      description: 'Can manage meetings and moderate users',
      permissions: [
        'manage_meetings',
        'moderate_users',
        'create_meetings',
        'manage_participants',
        'join_meetings',
        'view_reports'
      ]
    },
    {
      id: 'host',
      name: 'Meeting Host',
      icon: UserIcon,
      color: 'blue',
      description: 'Can create and manage their own meetings',
      permissions: [
        'create_meetings',
        'manage_participants',
        'join_meetings',
        'screen_share',
        'record_meetings'
      ]
    },
    {
      id: 'participant',
      name: 'Participant',
      icon: UserGroupIcon,
      color: 'green',
      description: 'Basic meeting participation',
      permissions: [
        'join_meetings',
        'chat_messages',
        'reactions',
        'raise_hand'
      ]
    }
  ];

  const permissions = [
    { id: 'all_permissions', name: 'All Permissions', category: 'System' },
    { id: 'manage_users', name: 'Manage Users', category: 'User Management' },
    { id: 'manage_roles', name: 'Manage Roles', category: 'User Management' },
    { id: 'system_settings', name: 'System Settings', category: 'System' },
    { id: 'view_analytics', name: 'View Analytics', category: 'Reports' },
    { id: 'view_reports', name: 'View Reports', category: 'Reports' },
    { id: 'manage_meetings', name: 'Manage All Meetings', category: 'Meetings' },
    { id: 'moderate_users', name: 'Moderate Users', category: 'Meetings' },
    { id: 'create_meetings', name: 'Create Meetings', category: 'Meetings' },
    { id: 'manage_participants', name: 'Manage Participants', category: 'Meetings' },
    { id: 'join_meetings', name: 'Join Meetings', category: 'Meetings' },
    { id: 'screen_share', name: 'Screen Share', category: 'Features' },
    { id: 'record_meetings', name: 'Record Meetings', category: 'Features' },
    { id: 'chat_messages', name: 'Send Messages', category: 'Features' },
    { id: 'reactions', name: 'Send Reactions', category: 'Features' },
    { id: 'raise_hand', name: 'Raise Hand', category: 'Features' }
  ];

  const handleAddUser = () => {
    const role = roles.find(r => r.id === newUser.role);
    const user = {
      id: users.length + 1,
      ...newUser,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      permissions: role?.permissions || []
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'participant', permissions: [] });
    setShowAddUser(false);
  };

  const handleUpdateUser = (userId, updates) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const getRoleColor = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.color || 'gray';
  };

  const getRoleIcon = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.icon || UserIcon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <KeyIcon className="h-7 w-7 text-blue-600" />
              <span>Role Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage user roles and permissions for ALFA MEET</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition duration-200 shadow-lg"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Role Definitions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CogIcon className="h-5 w-5" />
          <span>Role Definitions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.id} className={`border-2 border-${role.color}-200 rounded-lg p-4 hover:shadow-md transition duration-200`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 bg-${role.color}-100 rounded-lg`}>
                    <Icon className={`h-6 w-6 text-${role.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{role.name}</h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Permissions:</p>
                  <div className="text-xs text-gray-600">
                    {role.permissions.slice(0, 3).map(perm => (
                      <span key={perm} className="block">• {permissions.find(p => p.id === perm)?.name || perm}</span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-gray-500">+{role.permissions.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5" />
            <span>Users ({users.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const roleColor = getRoleColor(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <RoleIcon className={`h-4 w-4 text-${roleColor}-600`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleColor}-100 text-${roleColor}-800 capitalize`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' ? (
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircleIcon className="h-3 w-3 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit User"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateUser(user.id, { 
                          status: user.status === 'active' ? 'suspended' : 'active' 
                        })}
                        className={`p-1 rounded ${user.status === 'active' ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                        title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                      >
                        {user.status === 'active' ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
