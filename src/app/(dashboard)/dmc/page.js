'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function DmcPage() {
  const [dmcs, setDmcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDmc, setEditingDmc] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDmcs = async () => {
    try {
      const res = await axios.get('/api/dmcs');
      setDmcs(res.data);
    } catch (error) {
      toast.error('Failed to load DMCs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await axios.get('/api/dmcs');
        if (isMounted) setDmcs(res.data);
      } catch (error) {
        if (isMounted) toast.error('Failed to load DMCs');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleOpenModal = (dmc = null) => {
    if (dmc) {
      setEditingDmc(dmc);
      setFormData({ name: dmc.name, phone: dmc.phone || '', email: dmc.email || '', location: dmc.location || '' });
    } else {
      setEditingDmc(null);
      setFormData({ name: '', phone: '', email: '', location: '' });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDmc(null);
    setFormData({ name: '', phone: '', email: '', location: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('DMC name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingDmc) {
        await axios.put(`/api/dmcs/${editingDmc.id}`, formData);
        toast.success('DMC updated');
      } else {
        await axios.post('/api/dmcs', formData);
        toast.success('DMC created');
      }
      await fetchDmcs();   // ✅ refresh the list
      handleCloseModal();  // ✅ close modal after success
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this DMC? It may affect existing quotations.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/dmcs/${id}`);
      toast.success('Deleted');
      await fetchDmcs();   // ✅ refresh the list
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-4 text-sm text-gray-500">
      <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading DMCs...
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">DMC Master</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
        >
          + Add DMC
        </button>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {dmcs.map((dmc) => (
                <tr key={dmc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{dmc.name}</td>
                  <td className="px-4 py-2 text-gray-500">{dmc.phone || '-'}</td>
                  <td className="px-4 py-2 text-gray-500">{dmc.email || '-'}</td>
                  <td className="px-4 py-2 text-gray-500">{dmc.location || '-'}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(dmc)}
                      disabled={deletingId === dmc.id}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dmc.id)}
                      disabled={deletingId === dmc.id}
                      className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {deletingId === dmc.id ? (
                        <svg className="animate-spin h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : null}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {dmcs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-400 text-sm">
                    No DMCs added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingDmc ? 'Edit DMC' : 'Add DMC'}
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Name *"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={saving}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={saving}
              />
              <input
                type="text"
                placeholder="Location"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {saving ? (editingDmc ? 'Updating...' : 'Saving...') : (editingDmc ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}