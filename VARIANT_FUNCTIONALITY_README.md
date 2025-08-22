# Varyant Ekleme Fonksiyonu - Admin Ürün Detay Sayfası

## 🎯 Genel Bakış

Admin ürün detay sayfasında varyant ekleme fonksiyonu başarıyla aktif hale getirildi. Bu fonksiyon sayesinde admin kullanıcılar ürünlere farklı varyantlar (renk, boyut, malzeme vb.) ekleyebilir, düzenleyebilir ve silebilir.

## ✨ Özellikler

### 🔧 Varyant Yönetimi
- **Varyant Ekleme**: Yeni varyant oluşturma
- **Varyant Düzenleme**: Mevcut varyantları güncelleme
- **Varyant Silme**: Gereksiz varyantları kaldırma
- **Toplu Kaydetme**: Tüm varyant değişikliklerini tek seferde kaydetme

### 🎨 Özellik Sistemi
- **Renk Özellikleri**: Hex kod ile renk seçimi
- **Boyut Özellikleri**: Standart boyut seçenekleri
- **Malzeme Özellikleri**: Malzeme türü seçimi
- **Stil Özellikleri**: Tasarım stili seçimi
- **Özel Özellikler**: Manuel giriş ile özel değerler

### 💰 Fiyat Yönetimi
- **Varyant Fiyatı**: Her varyant için ayrı fiyat
- **Karşılaştırma Fiyatı**: İndirim öncesi orijinal fiyat
- **Stok Yönetimi**: Varyant bazında stok takibi

## 🚀 Kullanım

### 1. Varyant Ekleme
1. Admin panelinde ürün detay sayfasına gidin
2. "Varyantlar" sekmesine tıklayın
3. "Varyant Ekle" butonuna tıklayın
4. Gerekli bilgileri doldurun:
   - **SKU**: Benzersiz stok kodu
   - **Fiyat**: Varyant fiyatı
   - **Stok**: Stok miktarı
   - **Özellikler**: Renk, boyut, malzeme vb.

### 2. Özellik Ekleme
1. Varyant ekleme/düzenleme dialogunda "Özellikler" bölümünde
2. İstediğiniz özellik türünü seçin:
   - 🎨 **Farbe** (Renk)
   - 📏 **Größe** (Boyut)
   - 🔨 **Material** (Malzeme)
   - 🏷️ **Stil** (Stil)
   - 📐 **Size** (Boyut - İngilizce)

### 3. Varyant Kaydetme
1. Tüm varyantları düzenledikten sonra
2. "Varyantları Kaydet" butonuna tıklayın
3. Sistem tüm değişiklikleri veritabanına kaydeder

## 🗄️ Veritabanı Yapısı

### Ana Tablolar
- **`product_variants`**: Varyant ana bilgileri
- **`product_attributes`**: Özellik türleri
- **`product_attribute_values`**: Özellik değerleri
- **`variant_attribute_values`**: Varyant-özellik ilişkileri

### Görünümler (Views)
- **`product_variants_detailed`**: Detaylı varyant bilgileri
- **`product_attributes_summary`**: Özellik özeti

## 🔍 Teknik Detaylar

### API Endpoints
- **GET** `/api/products/[id]/variants` - Varyantları getir
- **POST** `/api/products/[id]/variants` - Yeni varyant oluştur
- **PUT** `/api/products/[id]/variants` - Varyantları güncelle

### Bileşen Yapısı
- **`VariantsTab.tsx`**: Ana varyant yönetim bileşeni
- **`ProductDetailView.tsx`**: Ürün detay sayfası
- **`route.ts`**: API endpoint'leri

## 🧪 Test

Varyant fonksiyonunu test etmek için:

```bash
# Varyant tablolarını kontrol et
node scripts/check-variant-tables.js

# Varyant API'sini test et
node scripts/test-variant-api.js
```

## ⚠️ Önemli Notlar

1. **SKU Benzersizliği**: Her varyant için benzersiz SKU gerekli
2. **Fiyat Zorunluluğu**: Varyant fiyatı boş bırakılamaz
3. **Stok Takibi**: Stok miktarı 0'dan küçük olamaz
4. **Özellik Sıralaması**: Özellikler sıra numarasına göre sıralanır

## 🎨 Özelleştirme

### Yeni Özellik Türleri Ekleme
1. `product_attributes` tablosuna yeni kayıt ekleyin
2. `product_attribute_values` tablosuna değerler ekleyin
3. `VariantsTab.tsx`'de `PREDEFINED_ATTRIBUTES` listesini güncelleyin

### Özellik Değerleri Ekleme
1. `product_attribute_values` tablosuna yeni değerler ekleyin
2. `VariantsTab.tsx`'de `PREDEFINED_VALUES` objesini güncelleyin

## 🔧 Sorun Giderme

### Yaygın Sorunlar
1. **Varyant Kaydedilemiyor**: Veritabanı bağlantısını kontrol edin
2. **Özellik Görünmüyor**: `product_attributes` tablosunda kayıt var mı kontrol edin
3. **SKU Hatası**: Benzersiz SKU kullandığınızdan emin olun

### Log Kontrolü
- Browser console'da hata mesajlarını kontrol edin
- Network tab'da API çağrılarını izleyin
- Veritabanı loglarını kontrol edin

## 📚 Ek Kaynaklar

- [Database Schema](./docs/database-schema.md)
- [Database Views](./docs/database-views.md)
- [Admin Products README](./ADMIN_PRODUCTS_README.md)

---

**Son Güncelleme**: 22 Ağustos 2025  
**Versiyon**: 1.0.0  
**Durum**: ✅ Aktif ve Çalışıyor
