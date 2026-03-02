
export interface Booking {
  start: string;
  end: string;
  guestName?: string;
  status?: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  type: string;
  icalLink: string;
  listingUrl?: string;
  contact?: string; // Số điện thoại liên hệ (Zalo)
  notes?: string;   // Ghi chú nội bộ cho sale
  bookings: Booking[];
  prices: Record<string, string>;
}

export interface ApiResponse {
  status: 'success' | 'error';
  data?: Room[];
  message?: string;
}
