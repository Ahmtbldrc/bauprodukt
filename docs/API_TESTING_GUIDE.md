# 🧪 API Testing Guide - Cart, Order & Banner Management

Bu rehber, Cart, Order ve Banner API endpoint'lerini test etmek için Postman collection'ını nasıl kullanacağınızı gösterir. Özellikle Banner image upload özellikleri dahil olmak üzere tüm API'lerin nasıl test edileceği açıklanmıştır.

## 📋 **Ön Hazırlık**

### 1. **Postman Collection'ını İçe Aktar**
```bash
# 1. Postman'i açın
# 2. Import butonuna tıklayın  
# 3. docs/bauprodukt-api.postman_collection.json dosyasını seçin
# 4. docs/bauprodukt-api.postman_environment.json dosyasını da import edin
```

### 2. **Environment'ı Aktif Et**
- Sağ üst köşedeki dropdown'dan "Bauprodukt Demo Environment" seçin
- `base_url` değerini kontrol edin: `http://localhost:3000`

### 3. **Database Migration'ını Uygula**
```bash
# Terminal'de proje klasöründe:
npx supabase migration up
```

## 🛒 **Cart API Test Akışı**

### **Adım 1: Cart Oluştur**
```
POST {{base_url}}/api/cart/{{session_id}}
```
- Session ID otomatik olarak environment'ta ayarlı: `test-session-123`
- Response'dan `cart_id` otomatik olarak environment'a kaydedilir

### **Adım 2: Ürün Ekle**
```
POST {{base_url}}/api/cart/{{session_id}}/items
Body: {
  "product_id": "{{product_id}}",
  "quantity": 2
}
```
⚠️ **Dikkat:** Önce "Example Workflow" section'ından ürün oluşturmanız gerekiyor.

### **Adım 3: Sepeti Görüntüle**
```
GET {{base_url}}/api/cart/{{session_id}}
```

### **Adım 4: Miktar Güncelle**
```
PUT {{base_url}}/api/cart/{{session_id}}/items/{{cart_item_id}}
Body: {
  "quantity": 5
}
```

### **Adım 5: Ürün Sil**
```
DELETE {{base_url}}/api/cart/{{session_id}}/items/{{cart_item_id}}
```

## 📦 **Order API Test Akışı**

### **Adım 1: Sepete Ürün Ekle**
Önce cart API'leri ile sepete ürün ekleyin.

### **Adım 2: Sipariş Oluştur**
```
POST {{base_url}}/api/orders
Body: {
  "session_id": "test-session-123",
  "customer_name": "Test User",
  "customer_email": "test@example.com",
  "customer_phone": "5551234567",
  "shipping_province": "İstanbul",
  "shipping_district": "Kadıköy",
  "shipping_postal_code": "34710",
  "shipping_address": "Test Address 123"
}
```

### **Adım 3: Sipariş Listele**
```
GET {{base_url}}/api/orders?page=1&limit=10
```

**Filtreleme Seçenekleri:**
- `?status=pending` - Durum filtresi
- `?search=john` - Müşteri arama
- `?order_number=BP123456` - Sipariş numarası

### **Adım 4: Sipariş Detayı**
```
GET {{base_url}}/api/orders/{{order_id}}
```

### **Adım 5: Durum Güncelle**
```
PUT {{base_url}}/api/orders/{{order_id}}
Body: {
  "status": "confirmed"
}
```

**Durum Seçenekleri:**
- `pending` (varsayılan)
- `confirmed` 
- `processing`
- `shipped`
- `delivered`
- `cancelled`

## 🖼️ **Banner API Test Akışı**

### **Yöntem 1: JSON ile Banner Oluştur (Klasik)**
```
POST {{base_url}}/api/banners
Content-Type: application/json
Body: {
  "title": "Yaz İndirimleri",
  "image_url": "https://example.com/banner.jpg",
  "link": "https://example.com/sale",
  "order_index": 1,
  "is_active": true
}
```

### **Yöntem 2: Resim ile Banner Oluştur (Ayrı Endpoint)**
```
POST {{base_url}}/api/banners/upload
Content-Type: multipart/form-data
Form Data:
- title: "Kış İndirimleri"
- link: "https://example.com/winter-sale"
- order_index: 0
- is_active: true
- file: (resim dosyası seç - ZORUNLU)
```

### **Yöntem 3: Resim Olmadan Banner Oluştur + Sonra Resim Ekle**

**Adım 1:** Banner oluştur
```
POST {{base_url}}/api/banners
Body: {
  "title": "Özel Kampanya",
  "link": "https://example.com/special"
}
```

**Adım 2:** Resim yükle
```
POST {{base_url}}/api/banners/{{banner_id}}/images
Content-Type: multipart/form-data
Form Data:
- file: (resim dosyası seç)
```

### **Banner Resmi Güncelle**
```
POST {{base_url}}/api/banners/{{banner_id}}/images
Content-Type: multipart/form-data
Form Data:
- file: (yeni resim dosyası)
```
⚠️ **Not:** Eski resim otomatik olarak silinir.

### **Banner Resmini Sil**
```
DELETE {{base_url}}/api/banners/{{banner_id}}/images
```
Banner'ın `image_url` alanı `null` olur, dosya storage'dan silinir.

### **Banner Listele ve Görüntüle**
```
GET {{base_url}}/api/banners?page=1&limit=10
GET {{base_url}}/api/banners?is_active=true  # Sadece aktifler
GET {{base_url}}/api/banners/{{banner_id}}   # Detay görüntüle
```

## 🔄 **Complete Workflow Testi**

Postman collection'ında "Cart & Order Workflow" section'ı tam bir test akışı içerir:

1. **Create/Get Cart** - Sepet oluştur
2. **Add Product to Cart** - Ürün ekle
3. **Add Another Product** - Miktar artır
4. **Update Cart Item Quantity** - Miktar değiştir
5. **View Cart** - Sepeti görüntüle
6. **Create Order from Cart** - Sipariş oluştur
7. **View Created Order** - Siparişi görüntüle
8. **Update Order Status** - Durumu güncelle

Bu workflow'u sırasıyla çalıştırarak tüm sistemi test edebilirsiniz.

## 🛡️ **Hata Senaryoları**

### **Stok Hatası Test Et:**
```
POST {{base_url}}/api/cart/{{session_id}}/items
Body: {
  "product_id": "{{product_id}}",
  "quantity": 9999  // Stoktan fazla
}
```
**Beklenen:** `400 Bad Request` - "Not enough stock"

### **Geçersiz Product ID:**
```
POST {{base_url}}/api/cart/{{session_id}}/items
Body: {
  "product_id": "invalid-uuid",
  "quantity": 1
}
```
**Beklenen:** `400 Bad Request` - Validation error

### **Boş Sepet Sipariş:**
```
POST {{base_url}}/api/orders
Body: {
  "session_id": "empty-cart-session",
  "customer_name": "Test",
  ...
}
```
**Beklenen:** `400 Bad Request` - "Cart is empty"

### **Banner Hata Senaryoları:**

**Geçersiz dosya formatı:**
```
POST {{base_url}}/api/banners/upload
Form Data:
- title: "Test Banner"
- file: (PDF veya TXT dosyası seç)
```
**Beklenen:** `400 Bad Request` - "Invalid file type"

**Çok büyük dosya:**
```
POST {{base_url}}/api/banners/upload
Form Data:
- title: "Test Banner"  
- file: (5MB'dan büyük resim)
```
**Beklenen:** `400 Bad Request` - "File size too large"

**Resim olmadan upload endpoint'i kullanma:**
```
POST {{base_url}}/api/banners/upload
Form Data:
- title: "Test Banner"
- (file yok)
```
**Beklenen:** `400 Bad Request` - "File is required for banner upload"

**Olmayan banner'a resim yükleme:**
```
POST {{base_url}}/api/banners/invalid-uuid/images
Form Data:
- file: (geçerli resim)
```
**Beklenen:** `404 Not Found` - "Banner not found"

**Resmi olmayan banner'ın resmini silme:**
```
DELETE {{base_url}}/api/banners/{{banner_id_without_image}}/images
```
**Beklenen:** `400 Bad Request` - "Banner has no image to delete"

## 📊 **Environment Variables**

Collection otomatik olarak şu değişkenleri yönetir:

| Değişken | Açıklama | Otomatik Set? |
|----------|----------|---------------|
| `session_id` | Cart session ID | ✅ Sabit |
| `cart_id` | Aktif cart ID | ✅ Response'dan |
| `cart_item_id` | Cart item ID | ✅ Response'dan |
| `order_id` | Oluşturulan order ID | ✅ Response'dan |
| `order_number` | Sipariş numarası | ✅ Response'dan |
| `banner_id` | Oluşturulan banner ID | ✅ Response'dan |
| `product_id` | Test için ürün ID | ❌ Manuel |

⚠️ **Önemli:** `product_id` değişkenini manuel olarak ayarlamanız gerekiyor. Bunun için önce "Example Workflow" section'ından ürün oluşturun.

## 🎯 **Test Stratejisi**

### **1. Happy Path Test:**
```
# Önce Example Workflow ile temel data oluştur
# Sonra Cart & Order Workflow'u çalıştır
# Banner API'leri ile farklı yöntemleri test et
```

### **2. Edge Cases:**
- Boş sepet ile sipariş deneme
- Aşırı stok talebi
- Geçersiz session ID
- Geçersiz order status
- Banner'a geçersiz dosya upload
- Olmayan banner'a resim yükleme

### **3. Performance Test:**
- Aynı anda çoklu cart item ekleme
- Büyük sayfalama testleri
- Concurrent order oluşturma
- Çoklu banner resim upload

### **4. Banner Specific Tests:**
- JSON endpoint (/api/banners) testi
- File upload endpoint (/api/banners/upload) testi  
- Resim değiştirme workflow'u
- File validation testleri
- Storage cleanup testleri

## 🐛 **Debug İpuçları**

### **Console Log'ları:**
API response'larında `console.error` ile log'lar mevcut:
```javascript
// Browser console'da görmek için
console.log('API Errors:', localStorage.getItem('api_errors'))
```

### **Database Kontrolü:**
```sql
-- Supabase dashboard'da çalıştır
SELECT * FROM carts WHERE session_id = 'test-session-123';
SELECT * FROM cart_items ci 
  JOIN products p ON ci.product_id = p.id;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

### **Yaygın Hatalar:**

| Hata | Çözüm |
|------|-------|
| `404 Product not found` | Önce product oluşturun |
| `400 Session ID required` | Environment'ta session_id kontrol edin |
| `500 Internal server error` | Server log'larını kontrol edin |
| `Migration error` | `npx supabase migration up` çalıştırın |

## 📝 **Sample Responses**

### **Cart Response:**
```json
{
  "cart_id": "uuid",
  "session_id": "test-session-123", 
  "items": [
    {
      "id": "item-uuid",
      "product_id": "product-uuid",
      "quantity": 2,
      "price": 899.99,
      "total_price": 1799.98,
      "product": {
        "name": "Bosch GSB 18V-55",
        "stock": 23
      }
    }
  ],
  "total_amount": 1799.98,
  "total_items": 2
}
```

### **Order Response:**
```json
{
  "id": "order-uuid",
  "order_number": "BP342567",
  "customer_name": "Test User",
  "status": "pending",
  "total_amount": 1799.98,
  "items": [
    {
      "product_name": "Bosch GSB 18V-55",
      "quantity": 2,
      "unit_price": 899.99
    }
  ]
}
```

Happy Testing! 🚀 