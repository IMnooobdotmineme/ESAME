"use client";

import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <span className="text-[10px] font-black tracking-wider text-sky-700 uppercase block mb-1">
            IDENTITY & ACCESS MANAGEMENT
          </span>
          <h2 className="text-2xl font-black text-navy-900 tracking-tight">Manage Users</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Control access for teachers, instructors, and organization admins.</p>
        </div>
        
        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-sky-50/60 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sky-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Name & Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-navy-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-sky-50 text-navy-900 border border-slate-200">
                      {user.role}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    {user.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-50 text-navy-900 border border-sky-200">
                        <CheckCircle2 className="w-3 h-3 text-sky-700" /> Active
                      </span>
                    ) : user.status === 'Suspended' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {user.status}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{user.lastLogin}</td>
                  
                  <td className="px-6 py-4 text-right">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAction(user.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="text-xs font-bold text-navy-900 bg-sky-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer shadow-xs hover:bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled className="text-slate-400 bg-white">Actions</option>
                      {user.status !== 'Active' && <option value="Activate" className="bg-white text-navy-900">Activate</option>}
                      {user.status === 'Active' && <option value="Deactivate" className="bg-white text-navy-900">Deactivate</option>}
                      {user.status === 'Active' && <option value="Suspend" className="bg-white text-rose-600">Suspend</option>}
                      {user.status === 'Active' && <option value="Force Logout" className="bg-white text-navy-900">Force Logout</option>}
                      <option value="Delete" className="bg-white text-rose-600">Delete</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}