export const MOCK_CHEFS = [
  {
    chef_id: 'chef-1', user_id: 'user-1', full_name: 'Fatma Hanım', avatar_url: null,
    location_approx: 'Seyhan, Adana', avg_rating: 4.9, total_reviews: 127, total_orders: 843,
    badge: 'master', is_open: true, delivery_types: ['pickup', 'delivery'],
    distance_km: 1.2, min_price: 25, menu_count: 4, lat: 37.002, lng: 35.321,
    preview_items: [
      { id: 'mi-1', name: 'Kuru Fasulye & Pilav', price: 55, category: 'main', remaining_stock: 5, stock_status: 'low', photos: [] },
      { id: 'mi-2', name: 'Sütlaç', price: 35, category: 'dessert', remaining_stock: 8, stock_status: 'ok', photos: [] },
      { id: 'mi-3', name: 'Mercimek Çorbası', price: 25, category: 'soup', remaining_stock: 10, stock_status: 'ok', photos: [] },
    ],
  },
  {
    chef_id: 'chef-2', user_id: 'user-2', full_name: 'Zeynep Arslan', avatar_url: null,
    location_approx: 'Yüreğir, Adana', avg_rating: 5.0, total_reviews: 203, total_orders: 1241,
    badge: 'chef', is_open: true, delivery_types: ['delivery'],
    distance_km: 0.9, min_price: 30, menu_count: 5, lat: 37.008, lng: 35.318,
    preview_items: [
      { id: 'mi-4', name: 'Peynirli Börek', price: 40, category: 'pastry', remaining_stock: 12, stock_status: 'ok', photos: [] },
      { id: 'mi-5', name: 'Ispanak Böreği', price: 38, category: 'pastry', remaining_stock: 7, stock_status: 'low', photos: [] },
      { id: 'mi-6', name: 'Baklava', price: 60, category: 'dessert', remaining_stock: 3, stock_status: 'critical', photos: [] },
    ],
  },
  {
    chef_id: 'chef-3', user_id: 'user-3', full_name: 'Ayşe Kaya', avatar_url: null,
    location_approx: 'Çukurova, Adana', avg_rating: 4.7, total_reviews: 58, total_orders: 312,
    badge: 'trusted', is_open: true, delivery_types: ['pickup'],
    distance_km: 2.8, min_price: 30, menu_count: 3, lat: 36.996, lng: 35.328,
    preview_items: [
      { id: 'mi-7', name: 'Zeytinyağlı Taze Fasulye', price: 45, category: 'main', remaining_stock: 6, stock_status: 'ok', photos: [] },
      { id: 'mi-8', name: 'Vegan Mercimek Köfte', price: 35, category: 'main', remaining_stock: 9, stock_status: 'ok', photos: [] },
    ],
  },
  {
    chef_id: 'chef-4', user_id: 'user-4', full_name: 'Elif Demirci', avatar_url: null,
    location_approx: 'Sarıçam, Adana', avg_rating: 4.5, total_reviews: 12, total_orders: 47,
    badge: 'new', is_open: false, delivery_types: ['pickup'],
    distance_km: 4.1, min_price: 25, menu_count: 2, lat: 37.012, lng: 35.335,
    preview_items: [
      { id: 'mi-9', name: 'Pasta', price: 70, category: 'dessert', remaining_stock: 2, stock_status: 'critical', photos: [] },
    ],
  },
]

export const MOCK_MENU: Record<string, any[]> = {
  'chef-1': [
    { id: 'mi-1', chef_id: 'chef-1', name: 'Kuru Fasulye & Pilav', price: 55, category: 'main', description: 'Tereyağlı, domatesli kuru fasulye yanında tereyağlı pilav.', allergens: [], prep_time_min: 30, remaining_stock: 5, stock_status: 'low', is_active: true, photos: [] },
    { id: 'mi-2', chef_id: 'chef-1', name: 'Sütlaç', price: 35, category: 'dessert', description: 'Fırında pişirilmiş geleneksel Türk sütlacı. Günlük taze.', allergens: ['milk'], prep_time_min: 0, remaining_stock: 8, stock_status: 'ok', is_active: true, photos: [] },
    { id: 'mi-3', chef_id: 'chef-1', name: 'Mercimek Çorbası', price: 25, category: 'soup', description: 'Kırmızı mercimek, havuç, soğan, limonlu. Ev yapımı.', allergens: [], prep_time_min: 15, remaining_stock: 10, stock_status: 'ok', is_active: true, photos: [] },
    { id: 'mi-10', chef_id: 'chef-1', name: 'İmam Bayıldı', price: 45, category: 'main', description: 'Zeytinyağında pişirilmiş patlıcan dolması. Soğuk servis.', allergens: [], prep_time_min: 20, remaining_stock: 0, stock_status: 'out_of_stock', is_active: true, photos: [] },
  ],
  'chef-2': [
    { id: 'mi-4', chef_id: 'chef-2', name: 'Peynirli Börek', price: 40, category: 'pastry', description: 'İnce yufka, beyaz peynir, maydanoz. Her sabah taze.', allergens: ['gluten', 'milk'], prep_time_min: 10, remaining_stock: 12, stock_status: 'ok', is_active: true, photos: [] },
    { id: 'mi-5', chef_id: 'chef-2', name: 'Ispanak Böreği', price: 38, category: 'pastry', description: 'Ispanak, lor peyniri ile hazırlanan el açması börek.', allergens: ['gluten', 'milk', 'egg'], prep_time_min: 10, remaining_stock: 7, stock_status: 'low', is_active: true, photos: [] },
    { id: 'mi-6', chef_id: 'chef-2', name: 'Baklava', price: 60, category: 'dessert', description: 'Antep fıstıklı ev baklavası. Son 3 porsiyon!', allergens: ['gluten', 'nuts'], prep_time_min: 0, remaining_stock: 3, stock_status: 'critical', is_active: true, photos: [] },
    { id: 'mi-11', chef_id: 'chef-2', name: 'Tarhana Çorbası', price: 30, category: 'soup', description: 'Ev yapımı tarhana, yoğurtlu. Kış klasiği.', allergens: ['gluten', 'milk'], prep_time_min: 15, remaining_stock: 8, stock_status: 'ok', is_active: true, photos: [] },
    { id: 'mi-12', chef_id: 'chef-2', name: 'Sigara Böreği (6 adet)', price: 35, category: 'pastry', description: 'Kızarmış peynirli sigara böreği. Çıtır çıtır.', allergens: ['gluten', 'milk'], prep_time_min: 15, remaining_stock: 10, stock_status: 'ok', is_active: true, photos: [] },
  ],
  'chef-3': [
    { id: 'mi-7', chef_id: 'chef-3', name: 'Zeytinyağlı Taze Fasulye', price: 45, category: 'main', description: 'Mevsim fasulyesi, domates, zeytinyağı. Vegan.', allergens: [], prep_time_min: 25, remaining_stock: 6, stock_status: 'ok', is_active: true, photos: [] },
    { id: 'mi-8', chef_id: 'chef-3', name: 'Vegan Mercimek Köfte', price: 35, category: 'main', description: 'Kırmızı mercimek, bulgur, baharatlar. 12 adet.', allergens: ['gluten'], prep_time_min: 10, remaining_stock: 9, stock_status: 'ok', is_active: true, photos: [] },
  ],
  'chef-4': [
    { id: 'mi-9', chef_id: 'chef-4', name: 'Pasta', price: 70, category: 'dessert', description: 'Çikolatalı yaş pasta. Önceden sipariş gerekir.', allergens: ['gluten', 'milk', 'egg'], prep_time_min: 60, remaining_stock: 2, stock_status: 'critical', is_active: false, photos: [] },
  ],
}

export const MOCK_REVIEWS: Record<string, any[]> = {
  'chef-1': [
    { id: 'r1', reviewer_name: 'Mehmet Y.', rating: 5, comment: 'Tam annemin yaptığı gibi. Fasulye mükemmeldi!', item_name: 'Kuru Fasulye', created_at: '2025-02-14' },
    { id: 'r2', reviewer_name: 'Selin K.', rating: 5, comment: 'Sütlaç harika! Çocuklarım çok sevdi.', item_name: 'Sütlaç', created_at: '2025-02-10' },
    { id: 'r3', reviewer_name: 'Ali R.', rating: 5, comment: 'Çok temiz ve lezzetli. Tavsiye ederim.', item_name: 'Mercimek Çorbası', created_at: '2025-02-08' },
  ],
  'chef-2': [
    { id: 'r4', reviewer_name: 'Hande M.', rating: 5, comment: 'Börekler inanılmaz! Her sabah sipariş veriyorum.', item_name: 'Peynirli Börek', created_at: '2025-02-13' },
    { id: 'r5', reviewer_name: 'Kaan T.', rating: 5, comment: 'Baklava gerçekten ev yapımı tadında.', item_name: 'Baklava', created_at: '2025-02-11' },
  ],
  'chef-3': [
    { id: 'r6', reviewer_name: 'Deniz A.', rating: 5, comment: 'Vegan seçenekler harika, çok sağlıklı.', item_name: 'Mercimek Köfte', created_at: '2025-02-09' },
  ],
}