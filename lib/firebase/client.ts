// Firebase web push - devre dışı (mobil push Expo üzerinden çalışıyor)
export async function requestNotificationPermission(): Promise<string | null> {
  return null
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  // devre dışı
}