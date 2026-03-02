
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, ChevronLeft, ChevronRight, ExternalLink, X, Loader2,
  Calendar as CalendarIcon, Copy, Check, Phone, MessageCircle, Info,
  PanelLeftClose, PanelLeftOpen, Upload
} from 'lucide-react';
import { 
  format, addDays, startOfDay, isSameDay, differenceInDays, 
  eachDayOfInterval, isWeekend, isWithinInterval
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Room } from './types';
import { fetchRooms, addRoom, updateRoomPrice } from './services/api';
import { CALENDAR_DAYS_COUNT, DAY_COLUMN_WIDTH, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './constants';

// Custom WhatsApp Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [filterBuilding, setFilterBuilding] = useState<string>('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{room: Room, date: string} | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchRooms();
    setRooms(data);
    setLoading(false);
  };

  const days = useMemo(() => eachDayOfInterval({
    start: currentDate,
    end: addDays(currentDate, CALENDAR_DAYS_COUNT - 1)
  }), [currentDate]);

  const buildings = useMemo(() => ['Tất cả', ...Array.from(new Set(rooms.map(r => r.building)))], [rooms]);

  const filteredRooms = useMemo(() => rooms.filter(room => {
    const matchesBuilding = filterBuilding === 'Tất cả' || room.building === filterBuilding;
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBuilding && matchesSearch;
  }), [rooms, filterBuilding, searchTerm]);

  const handlePriceChange = async (roomId: string, date: string, price: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, prices: { ...(r.prices || {}), [date]: price } } : r));
    await updateRoomPrice(roomId, date, price);
  };

  const isDayBooked = (room: Room, day: Date) => room.bookings.some(b => {
    const start = startOfDay(new Date(b.start));
    const end = startOfDay(new Date(b.end));
    return isWithinInterval(day, { start, end: addDays(end, -1) });
  });

  const getWhatsAppLink = (room: Room, date: string) => {
    const price = room.prices?.[date] || 'Liên hệ';
    const text = `Phòng: ${room.name}%0A` +
                 `Ngày: ${format(new Date(date), 'dd/MM/yyyy')}%0A` +
                 `Giá: ${price}%0A` +
                 `Xem ảnh: ${room.listingUrl || 'N/A'}`;
    return `https://wa.me/?text=${text}`;
  };

  const currentSidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div className="flex flex-col h-screen bg-[#F7F7F7] overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-[#FF385C]" />
          <h1 className="font-bold text-lg hidden sm:block">Lịch Phòng & Giá</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 ml-2">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input type="text" placeholder="Tìm..." className="bg-transparent text-sm outline-none w-24 sm:w-40" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCsvModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-transform">
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Nhập CSV</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#FF385C] text-white p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm Phòng</span>
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Tòa:</span>
          <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)} className="text-xs border rounded px-2 py-1 outline-none bg-gray-50">
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setCurrentDate(prev => addDays(prev, -7))} className="p-1.5 hover:bg-gray-100 rounded-full border shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCurrentDate(startOfDay(new Date()))} className="px-3 py-1 text-xs font-bold border rounded-full hover:bg-gray-50 shadow-sm">Hôm nay</button>
          <button onClick={() => setCurrentDate(prev => addDays(prev, 7))} className="p-1.5 hover:bg-gray-100 rounded-full border shadow-sm"><ChevronRight className="w-4 h-4" /></button>
          <span className="ml-2 text-xs font-bold text-gray-600 capitalize">{format(days[0], 'MMMM yyyy', { locale: vi })}</span>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {loading ? <div className="flex-1 flex items-center justify-center bg-white/50"><Loader2 className="w-8 h-8 animate-spin text-[#FF385C]" /></div> : (
          <div className="flex h-full w-full overflow-hidden">
            {/* Sidebar Room Names */}
            <div 
              style={{ width: currentSidebarWidth }} 
              className="flex-shrink-0 border-r bg-white z-40 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out"
            >
              <div className="h-16 border-b flex items-center justify-between px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                {!isSidebarCollapsed && <span>Danh sách</span>}
                <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors ml-auto"
                  title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-gray-600" /> : <PanelLeftClose className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
              <div className="overflow-y-auto no-scrollbar h-[calc(100%-64px)]">
                {filteredRooms.map(room => (
                  <div key={room.id} className="h-16 border-b px-3 flex items-center hover:bg-gray-50 group transition-colors relative">
                    {/* Content Logic based on Collapsed State */}
                    {isSidebarCollapsed ? (
                      <div className="w-full flex flex-col items-center justify-center" title={room.name}>
                        <div className="font-bold text-xs text-gray-700 truncate w-full text-center">
                          {room.name.split(' ')[0]}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{room.type}</div>
                      </div>
                    ) : (
                      <div className="w-full min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <a href={room.listingUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold truncate block hover:text-[#FF385C] hover:underline text-gray-800" title={room.name}>
                            {room.name}
                          </a>
                          {room.listingUrl && (
                            <button onClick={() => { navigator.clipboard.writeText(room.listingUrl!); setCopiedId(room.id); setTimeout(() => setCopiedId(null), 1000); }} className="p-1 text-gray-300 hover:text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                               {copiedId === room.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center mt-1 gap-1.5">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">{room.building}</span>
                          <span className="text-[9px] text-gray-400">• {room.type}</span>
                        </div>
                        {room.notes && <div className="text-[9px] text-orange-500 truncate mt-0.5 flex items-center"><Info className="w-2.5 h-2.5 inline mr-1 flex-shrink-0" />{room.notes}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-auto no-scrollbar bg-gray-50">
              <div style={{ width: days.length * DAY_COLUMN_WIDTH }} className="h-full relative">
                {/* Header Timeline */}
                <div className="h-16 border-b bg-white flex flex-col sticky top-0 z-30 shadow-sm">
                  <div className="flex h-full">
                    {days.map(day => (
                      <div key={day.toString()} style={{ width: DAY_COLUMN_WIDTH }} className={`flex-shrink-0 flex flex-col items-center justify-center text-[9px] border-r ${isWeekend(day) ? 'bg-gray-50/80' : ''} ${isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''}`}>
                        <span className="text-gray-400 uppercase font-medium">{format(day, 'EEE', { locale: vi })}</span>
                        <span className={`font-bold mt-1 w-6 h-6 flex items-center justify-center rounded-full text-xs ${isSameDay(day, new Date()) ? 'bg-[#FF385C] text-white shadow-md' : 'text-gray-700'}`}>{format(day, 'd')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid Rows */}
                {filteredRooms.map(room => (
                  <div key={`row-${room.id}`} className="h-16 border-b relative flex items-center bg-white group hover:bg-gray-50/30 transition-colors">
                    {days.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const booked = isDayBooked(room, day);
                      const price = room.prices?.[dateStr];
                      const isSelected = selectedSlot?.room.id === room.id && selectedSlot?.date === dateStr;

                      return (
                        <div 
                          key={`${room.id}-${dateStr}`} 
                          style={{ width: DAY_COLUMN_WIDTH }} 
                          onClick={() => !booked && setSelectedSlot({room, date: dateStr})}
                          className={`h-full border-r relative flex items-center justify-center transition-all cursor-pointer ${booked ? 'bg-gray-100/40 pattern-diagonal-lines' : 'hover:bg-blue-50/30'} ${isSelected ? 'ring-2 ring-inset ring-blue-500 z-20 bg-blue-50' : ''}`}
                        >
                          {!booked && (
                            <div className="flex flex-col items-center w-full h-full justify-center">
                              <input 
                                type="text"
                                placeholder="-"
                                defaultValue={price || ''}
                                onBlur={(e) => handlePriceChange(room.id, dateStr, e.target.value)}
                                className={`w-full h-full text-[11px] text-center bg-transparent border-none outline-none font-medium transition-colors ${price ? 'text-green-600 font-bold' : 'text-gray-200 hover:text-gray-400'}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bookings */}
                    {room.bookings.map((b, idx) => {
                      const startDate = startOfDay(new Date(b.start));
                      const endDate = startOfDay(new Date(b.end));
                      if (endDate < days[0] || startDate > days[days.length - 1]) return null;
                      const startOffset = Math.max(0, differenceInDays(startDate, days[0]));
                      const duration = differenceInDays(endDate > days[days.length - 1] ? addDays(days[days.length - 1], 1) : endDate, startDate < days[0] ? days[0] : startDate);
                      if (duration <= 0) return null;
                      return (
                        <div key={`${room.id}-b-${idx}`} style={{ left: startOffset * DAY_COLUMN_WIDTH + 2, width: duration * DAY_COLUMN_WIDTH - 5, top: '12px', bottom: '12px', height: 'auto' }} className="absolute z-10 bg-gray-200/80 border border-gray-300 text-gray-500 rounded-md flex items-center px-2 text-[10px] font-medium shadow-sm pointer-events-none backdrop-blur-[1px]">
                          <span className="truncate w-full">{b.guestName}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar (Optimized for Mobile/Sales) */}
      {selectedSlot && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-4 z-[60] animate-in slide-in-from-bottom-10 duration-300">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="font-bold text-sm text-gray-800">{selectedSlot.room.name}</h3>
               <p className="text-[10px] text-gray-500 font-medium">Ngày: {format(new Date(selectedSlot.date), 'dd/MM/yyyy')} • <span className="text-green-600 font-bold">Phòng trống</span></p>
             </div>
             <button onClick={() => setSelectedSlot(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
           </div>
           
           <div className="grid grid-cols-4 gap-2">
             <a href={`tel:${selectedSlot.room.contact}`} className="flex flex-col items-center gap-1.5 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-95">
               <Phone className="w-5 h-5" />
               <span className="text-[9px] font-bold">Gọi ngay</span>
             </a>
             <a href={`https://zalo.me/${selectedSlot.room.contact}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 bg-[#0068ff] text-white rounded-xl hover:bg-blue-700 transition-colors active:scale-95 shadow-md shadow-blue-100">
               <MessageCircle className="w-5 h-5" />
               <span className="text-[9px] font-bold">Zalo</span>
             </a>
             <a href={getWhatsAppLink(selectedSlot.room, selectedSlot.date)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition-colors active:scale-95 shadow-md shadow-green-100">
               <WhatsAppIcon className="w-5 h-5" />
               <span className="text-[9px] font-bold">WhatsApp</span>
             </a>
             <a href={selectedSlot.room.listingUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors active:scale-95">
               <ExternalLink className="w-5 h-5" />
               <span className="text-[9px] font-bold">Xem ảnh</span>
             </a>
           </div>
           
           {selectedSlot.room.notes && (
             <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-[10px] text-orange-700 italic flex items-start gap-2">
               <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
               <span>{selectedSlot.room.notes}</span>
             </div>
           )}
        </div>
      )}

      {isCsvModalOpen && (
        <CsvImportModal 
          isOpen={isCsvModalOpen} 
          onClose={() => setIsCsvModalOpen(false)} 
          onImport={async (parsedRooms) => {
            setIsCsvModalOpen(false);
            setLoading(true);
            try {
              for (const room of parsedRooms) {
                await addRoom(room);
              }
              await loadData();
              alert('Nhập dữ liệu thành công!');
            } catch (error) {
              console.error('Lỗi khi nhập CSV:', error);
              alert('Có lỗi xảy ra khi nhập dữ liệu.');
            } finally {
              setLoading(false);
            }
          }} 
        />
      )}

      {isModalOpen && <AddRoomModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); loadData(); }} />}
    </div>
  );
};

const CsvImportModal = ({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (rooms: Omit<Room, 'id' | 'bookings'>[]) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [defaultPhone, setDefaultPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    if (!file) {
      setError('Vui lòng chọn file CSV');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setError('File CSV không hợp lệ hoặc trống');
        return;
      }

      const parsedRooms: Omit<Room, 'id' | 'bookings'>[] = [];
      // Assuming headers: Ten_Phong,Toa_nha,Link_Airbnb,Link_iCal,Gia_Phong,Lien_He,Khu_Vuc,Tinh_Thanh
      for (let i = 1; i < lines.length; i++) {
        // Split by comma, but handle potential quotes if necessary. 
        // A simple split is used here based on the provided sample.
        const values = lines[i].split(',');
        const name = values[0]?.trim();
        const building = values[1]?.trim();
        let listingUrl = values[2]?.trim();
        const icalUrl = values[3]?.trim();
        const price = values[4]?.trim();
        let contact = values[5]?.trim();
        
        if (!name || !icalUrl) continue;

        if (listingUrl && !listingUrl.startsWith('http')) {
          listingUrl = `https://${listingUrl}`;
        }
        
        if (!contact && defaultPhone) {
          contact = defaultPhone;
        }

        parsedRooms.push({
          name,
          building: building || 'Khác',
          type: 'Phòng',
          icalUrl,
          listingUrl,
          notes: contact ? `SĐT: ${contact}` : '',
        });
      }

      if (parsedRooms.length === 0) {
        setError('Không tìm thấy dữ liệu hợp lệ trong file');
        return;
      }

      onImport(parsedRooms);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Nhập từ CSV</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file CSV</label>
            <input type="file" accept=".csv" onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại mặc định (nếu file thiếu)</label>
            <input type="text" value={defaultPhone} onChange={e => setDefaultPhone(e.target.value)} placeholder="Ví dụ: 0901234567" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Sẽ được áp dụng cho các phòng không có cột Liên Hệ.</p>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
          <button onClick={handleImport} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Nhập dữ liệu</button>
        </div>
      </div>
    </div>
  );
};

const AddRoomModal: React.FC<{ onClose: () => void; onSuccess: () => void; }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', building: '', type: 'Studio', icalLink: '', listingUrl: '', contact: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (await addRoom(formData)) onSuccess();
    else { alert('Lỗi API'); setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50"><h2 className="text-xl font-bold text-gray-800">Thêm Phòng Mới</h2><button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Thông tin cơ bản</label>
            <input required placeholder="Tên phòng (Vd: Avalon 301)" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Tòa nhà" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none transition-colors" value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} />
              <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none bg-white transition-colors" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Studio">Studio</option><option value="1BR">1 PN</option><option value="2BR">2 PN</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Liên hệ & iCal</label>
            <input placeholder="SĐT Liên hệ / Zalo" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none transition-colors" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            <input placeholder="Link Airbnb (Xem ảnh)" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none transition-colors" value={formData.listingUrl} onChange={e => setFormData({...formData, listingUrl: e.target.value})} />
            <input placeholder="Link iCal Airbnb (Sync lịch)" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#FF385C] outline-none transition-colors" value={formData.icalLink} onChange={e => setFormData({...formData, icalLink: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Ghi chú cho Sale</label>
            <textarea placeholder="Vd: Ưu tiên khách ở dài hạn, giảm giá cuối tuần..." className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm h-20 outline-none focus:border-[#FF385C] transition-colors resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Hủy</button>
            <button disabled={submitting} type="submit" className="flex-[2] bg-[#FF385C] text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all">
              {submitting ? 'Đang lưu...' : 'Lưu & Hoàn tất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
