"use client";

import React, { useState } from 'react';

// Mock data based on SRS requirements
const initialOrganizations = [
  { id: 1, name: 'Harvard University', email: 'admin@harvard.edu', status: 'Active', joined: '2025-08-12' },
  { id: 2, name: 'MIT', email: 'contact@mit.edu', status: 'Pending', joined: '2026-07-14' },
  { id: 3, name: 'Stanford University', email: 'it@stanford.edu', status: 'Suspended', joined: '2024-03-22' },
  { id: 4, name: 'Oxford Academy', email: 'hello@oxford.edu', status: 'Active', joined: '2026-01-05' },
];

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [search, setSearch] = useState('');

  // Handle Organization Actions (Approve, Suspend, Delete)
  const handleAction = (id: number, action: string) => {
    if (action === 'Delete') {
      setOrganizations(organizations.filter(org => org.id !== id));
      return;
    }
    
    setOrganizations(organizations.map(org => {
      if (org.id === id) {
        if (action === 'Approve') return { ...org, status: 'Active' };
        if (action === 'Suspend') return { ...org, status: 'Suspended' };
        if (action === 'Activate') return { ...org, status: 'Active' };
      }
      return org;
    }));
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Organizations</h2>
          <p className="text-gray-500 mt-1 text-sm">Approve, suspend, or remove educational institutions.</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Organization Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Contact Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date Joined</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{org.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{org.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${org.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        org.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{org.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      onChange={(e) => handleAction(org.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                      defaultValue=""
                    >
                      <option value="" disabled>Actions</option>
                      {org.status === 'Pending' && <option value="Approve">Approve</option>}
                      {org.status === 'Suspended' && <option value="Activate">Activate</option>}
                      {org.status === 'Active' && <option value="Suspend">Suspend</option>}
                      <option value="Delete">Delete</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No organizations found.
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