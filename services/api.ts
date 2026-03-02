
import { ApiResponse, Room } from '../types';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxD-c48HOpRyRXzMREKOmL0pELIz6esYf5qKzClqSMnUs5Xe140YcAt4gj6eCT4MYnr/exec'; 

export async function fetchRooms(): Promise<Room[]> {
  try {
    if (GAS_WEB_APP_URL.includes('AKfycbyR')) return getMockData();
    const response = await fetch(GAS_WEB_APP_URL);
    const result: ApiResponse = await response.json();
    return result.status === 'success' && result.data ? result.data : getMockData();
  } catch (error) {
    return getMockData();
  }
}

export async function addRoom(roomData: Partial<Room>): Promise<boolean> {
  try {
    if (GAS_WEB_APP_URL.includes('AKfycbyR')) return true;
    await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(roomData),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'no-cors'
    });
    return true;
  } catch (error) { return false; }
}

export async function updateRoomPrice(roomId: string, date: string, price: string): Promise<boolean> {
  try {
    if (GAS_WEB_APP_URL.includes('AKfycbyR')) {
      console.log(`Cập nhật giá: Phòng ${roomId}, Ngày ${date}, Giá ${price}`);
      return true;
    }
    await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updatePrice', roomId, date, price }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'no-cors'
    });
    return true;
  } catch (error) { return false; }
}

function getMockData(): Room[] {
  const today = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (d: Date, n: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + n);
    return res;
  };
  return [
    {
      id: '1',
      name: 'Avalon - Căn Hộ View Biển 3.3',
      building: 'Avalon',
      type: 'Studio',
      icalLink: '',
      listingUrl: 'https://airbnb.com/h/avalon33',
      bookings: [{ start: format(addDays(today, -2)), end: format(addDays(today, 2)), guestName: 'Nguyễn Văn A' }],
      prices: { [format(addDays(today, 3))]: "450k", [format(addDays(today, 4))]: "450k" }
    },
    {
      id: '2',
      name: 'PVD - Suite 201',
      building: 'PVD',
      type: '1BR',
      icalLink: '',
      listingUrl: 'https://airbnb.com/h/pvd201',
      bookings: [],
      prices: { [format(today)]: "500k" }
    }
  ];
}
