'use client';
import { format } from 'date-fns';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Edit } from 'lucide-react';

export default function EnquiryTable({ enquiries, onSelectEnquiry, onUpdateStatus }) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
  const [updatingId, setUpdatingId] = useState(null);

  const statusColors = {
    WORKING: 'bg-yellow-100 text-yellow-800',
    SHARED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    DROPPED: 'bg-gray-100 text-red-600',
  };

  const updateStatus = async (enqId, newStatus) => {
    setUpdatingId(enqId);
    try {
      await onUpdateStatus(enqId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEdit = (e, enqId) => {
    e.stopPropagation();
    router.push(`/dashboard?edit=${enqId}`);
  };

  if (!enquiries.length) {
    return <div className="text-center py-8 text-gray-500 text-sm">No enquiries found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Dest</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Travel</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">PAX</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Created</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Status</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {enquiries.map((enq) => {
            const isCreator = currentUserId === enq.userId;
            return (
              <tr key={enq.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectEnquiry(enq)}>
                <td className="px-2 py-2 text-gray-900 truncate max-w-[100px]" title={enq.destination}>
                  {enq.destination}
                </td>
                <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                  {format(new Date(enq.travelStart), 'dd/MM')}–{format(new Date(enq.travelEnd), 'dd/MM/yy')}
                </td>
                <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                  A:{enq.adults} K:{enq.kids}
                </td>
                <td className="px-2 py-2 text-gray-500 truncate max-w-[80px]" title={enq.user?.name || enq.user?.email}>
                  {enq.user?.name || enq.user?.email?.split('@')[0] || '?'}
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-xs rounded-md  ${statusColors[enq.status] || 'bg-gray-100'}`}>
                    {enq.status}
                  </span>
                </td>
                <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {isCreator && (
                      <button onClick={(e) => handleEdit(e, enq.id)} className="text-blue-600 hover:text-blue-800">
  <Edit size={16} />
</button>
                    )}
                    {isCreator ? (
                      updatingId === enq.id ? (
                        <div className="flex justify-center">
                          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          
                        </div>
                      ) : (
                        <select
                          value={enq.status}
                          onChange={(e) => updateStatus(enq.id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5 bg-white"
                        >
                          <option value="WORKING">Working</option>
                          <option value="SHARED">Shared</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DROPPED">Dropped</option>
                        </select>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}