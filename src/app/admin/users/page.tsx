"use client";

import React, { useState } from 'react';

const initialUsers = [
  { id: 1, name: 'Dr. Alan Grant', email: 'agrant@university.edu', role: 'Teacher', status: 'Active', lastLogin: '2026-07-15 08:30 AM' },
  { id: 2, name: 'Sarah Harding', email: 'sharding@school.org', role: 'Teacher', status: 'Active', lastLogin: '2026-07-15 09:15 AM' },
  { id: 3, name: 'Ian Malcolm', email: 'imalcolm@institute.edu', role: 'Organization Admin', status: 'Suspended', lastLogin: '2026-07-10 14:20 PM' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');

  const handleAction = (id: number, action: string) => {
    if (action === 'Delete') {
      setUsers(users.filter(user => user.id !== id));
      return;
    }
    if (action === 'Force Logout') {
      alert(`Forced logout for user ID: ${id}`);
      return;
    }
    
    setUsers(users.map(user => {
      if (user.id === id) {
        if (action === 'Activate') return { ...user, status: 'Active' };
        if (action === 'Deactivate') return { ...user, status: 'Deactivated' };
        if (action === 'Suspend') return { ...user, status: 'Suspended' };
      }
      return user;
    }));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <p className="text-gray-500 mt-1 text-sm">Control access for teachers and organization admins.</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Name & Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Last Login</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'Suspended' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      onChange={(e) => handleAction(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                      defaultValue=""
                    >
                      <option value="" disabled>Actions</option>
                      {user.status !== 'Active' && <option value="Activate">Activate</option>}
                      {user.status === 'Active' && <option value="Deactivate">Deactivate</option>}
                      {user.status === 'Active' && <option value="Suspend">Suspend</option>}
                      {user.status === 'Active' && <option value="Force Logout">Force Logout</option>}
                      <option value="Delete">Delete</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}