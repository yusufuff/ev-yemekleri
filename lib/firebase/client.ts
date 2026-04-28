// Web FCM devre disi - bildirimler Supabase uzerinden calisıyor
export async function requestNotificationPermission(): Promise<string | null> {
  return null
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  // devre disi
}