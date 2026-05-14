'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import PreviewPanel from '@/components/PreviewPanel';
import { Toaster, toast } from 'react-hot-toast';
import { useSocket } from '@/lib/socket';
import Image from 'next/image';
import axios from 'axios';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(!!editId);
  const [formData, setFormData] = useState({
    destination: '',
    adults: 0,
    kids: 0,
    travelStart: '',
    travelEnd: '',
    hotelCategory: '3 Star',
    roomSharing: 'Double Sharing',
    extraBedRequired: false,
    isInternational: false,
    dmcQuotations: [],
  });
  const [previewData, setPreviewData] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on('enquiry-created', (newEnquiry) => {
      toast.success(`New enquiry #${newEnquiry.enqNo} created!`);
      if (editId) router.push('/history'); // after creation, go to history
    });
    return () => socket.off('enquiry-created');
  }, [socket, editId, router]);

  // Fetch enquiry if editing
  useEffect(() => {
    if (editId) {
      const fetchEnquiry = async () => {
        try {
          const res = await axios.get(`/api/enquiries/${editId}`);
          const enquiry = res.data;

          
          const hasInternational = enquiry.dmcQuotations.some(dmc => dmc.tcsAmount > 0);
          // Transform API data to form structure
          setFormData({
            destination: enquiry.destination,
            adults: enquiry.adults,
            kids: enquiry.kids,
            travelStart: enquiry.travelStart.split('T')[0],
            travelEnd: enquiry.travelEnd.split('T')[0],
            hotelCategory: enquiry.hotelCategory,
            roomSharing: enquiry.roomSharing,
            extraBedRequired: enquiry.extraBedRequired,
            isInternational: hasInternational,
            
            dmcQuotations: enquiry.dmcQuotations.map(dmc => ({
              id: dmc.id,
              dmcId: dmc.dmcId,
              dmcName: dmc.dmcName || '',
              quotationRef: dmc.quotationRef || '',
              quotationDate: dmc.quotationDate ? dmc.quotationDate.split('T')[0] : '',
              adultCount: dmc.adultCount,
              kidCount: dmc.kidCount,
              adultRate: dmc.adultRate,
              kidRate: dmc.kidRate,
              adultMargin: dmc.adultMargin,
              kidMargin: dmc.kidMargin,
              foc: dmc.foc,
              isSelected: dmc.isSelected || false,
            })),
          });
          setPreviewData(formData);
        } catch (error) {
          toast.error('Failed to load enquiry');
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchEnquiry();
    }
  }, [editId]);

  const updateFormData = (newData) => {
    setFormData(newData);
    setPreviewData(newData);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">
    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
    Loading Data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-xl font-bold mb-4 flex items-center gap-2 ${editId ? 'text-red-600' : 'text-gray-800'}`}>
  <Image src="/images/add-file.gif" alt="Add Icon" width={30} height={30} className="object-contain rounded-full" priority />
  {editId ? 'Edit Enquiry' : 'Create New Enquiry'}
</h1>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/2 bg-white rounded-md shadow-sm border border-gray-200 p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
            <EnquiryForm formData={formData} setFormData={updateFormData} isEdit={!!editId} enquiryId={editId} />
          </div>
          <div className="lg:w-1/2 bg-white rounded-md shadow-sm border border-gray-200 overflow-y-auto max-h-[calc(100vh-100px)]">
            <PreviewPanel data={previewData} />
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}