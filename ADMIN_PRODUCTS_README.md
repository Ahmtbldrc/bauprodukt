# Admin Ürün Detay Sayfası Kullanım Kılavuzu

## Genel Bakış

Admin panelindeki ürün detay sayfası (`/admin/products/[id]`) artık gelişmiş özelliklerle güncellenmiştir. Bu sayfa ürünleri düzenlemek, varyantları yönetmek ve resimleri organize etmek için kullanılır.

## Özellikler

### 1. Sekme Sistemi
Sayfa 4 ana sekmeye ayrılmıştır:

- **Genel Bilgiler**: Temel ürün bilgileri (ad, slug, fiyat, stok, vb.)
- **Varyantlar**: Ürün varyantlarını yönetme (renk, boyut, fiyat farkları)
- **Resimler**: Ürün resimlerini yönetme ve kapak resmi belirleme
- **Gelişmiş**: SEO ayarları ve meta veriler (gelecekte kullanılacak)

### 2. Varyant Yönetimi

#### Varyant Ekleme
- "Varyant Ekle" butonuna tıklayarak yeni varyant ekleyebilirsiniz
- Her varyant için şu bilgileri girebilirsiniz:
  - **SKU**: Benzersiz stok kodu (zorunlu)
  - **Başlık**: Varyant açıklaması (örn: "Kırmızı, Büyük")
  - **Fiyat**: Varyant fiyatı (zorunlu)
  - **Karşılaştırma Fiyatı**: İndirim öncesi fiyat
  - **Stok Miktarı**: Varyant stok miktarı (zorunlu)
  - **Pozisyon**: Sıralama için pozisyon numarası

#### Varyant Ayarları
- **Stok takibi yap**: Varyant stok miktarını takip et
- **Stok bittiğinde satmaya devam et**: Stok bittiğinde satışa devam et
- **Aktif**: Varyantı aktif/pasif yap

#### Varyant Silme
- Her varyantın yanındaki çöp kutusu ikonuna tıklayarak silebilirsiniz

### 3. Resim Yönetimi

#### Resim Ekleme
- "Resim Ekle" butonuna tıklayarak yeni resim ekleyebilirsiniz
- Her resim için URL girmeniz gerekir
- Resimler otomatik olarak önizlenir

#### Kapak Resmi Belirleme
- Her resmin yanında "Kapak Yap" butonu bulunur
- Kapak resmi olarak işaretlenen resim ürünün ana resmi olur
- Sadece bir resim kapak resmi olabilir

#### Resim Silme
- Her resmin yanındaki çöp kutusu ikonuna tıklayarak silebilirsiniz
- Kapak resmi silinirse, ilk kalan resim otomatik olarak kapak resmi olur

### 4. Form Validasyonu

#### Zorunlu Alanlar
- Ürün Adı
- Slug (sadece küçük harf, rakam ve tire)
- Fiyat (0'dan büyük olmalı)
- Stok (0'dan büyük veya eşit olmalı)

#### Varyant Validasyonu
- SKU (zorunlu)
- Fiyat (0'dan büyük olmalı)
- Stok Miktarı (0'dan büyük veya eşit olmalı)

#### Resim Validasyonu
- Resim URL (geçerli URL formatında olmalı)

### 5. Kaydetme İşlemi

#### Toplu Güncelleme
- Tüm değişiklikler tek seferde kaydedilir
- Ana ürün bilgileri, varyantlar ve resimler ayrı ayrı güncellenir
- Hata durumunda detaylı hata mesajları gösterilir

#### Başarılı Kaydetme
- Tüm veriler başarıyla kaydedildikten sonra ürün listesine yönlendirilir
- Kaydetme sırasında "Kaydediliyor..." mesajı gösterilir

## API Endpoint'leri

### Ürün Güncelleme
- `PUT /api/products/[id]` - Ana ürün bilgilerini günceller

### Varyant Yönetimi
- `GET /api/products/[id]/variants` - Mevcut varyantları getirir
- `POST /api/products/[id]/variants` - Yeni varyant ekler
- `PUT /api/products/[id]/variants` - Tüm varyantları günceller

### Resim Yönetimi
- `GET /api/products/[id]/images` - Mevcut resimleri getirir
- `POST /api/products/[id]/images` - Yeni resim ekler
- `PUT /api/products/[id]/images` - Tüm resimleri günceller
- `DELETE /api/products/[id]/images` - Tüm resimleri siler

## Kullanım Örnekleri

### Yeni Ürün Varyantı Ekleme
1. "Varyantlar" sekmesine gidin
2. "Varyant Ekle" butonuna tıklayın
3. SKU, başlık, fiyat ve stok bilgilerini girin
4. Gerekli ayarları yapın
5. "Kaydet" butonuna tıklayın

### Ürün Resmi Ekleme
1. "Resimler" sekmesine gidin
2. "Resim Ekle" butonuna tıklayın
3. Resim URL'sini girin
4. İsterseniz "Kapak Yap" butonuna tıklayarak kapak resmi yapın
5. "Kaydet" butonuna tıklayın

### Varyant Fiyat Güncelleme
1. "Varyantlar" sekmesine gidin
2. İlgili varyantın fiyat alanını düzenleyin
3. "Kaydet" butonuna tıklayın

## Notlar

- Tüm değişiklikler tek seferde kaydedilir
- Varyantlar ve resimler silinip yeniden oluşturulur (bulk update)
- Hata durumunda detaylı hata mesajları gösterilir
- Loading state'ler tüm veriler yüklenene kadar devam eder
- Form validasyonu hem client-side hem de server-side yapılır

## Gelecek Özellikler

- SEO meta verileri yönetimi
- Ürün özellikleri (attributes) yönetimi
- Toplu varyant import/export
- Resim sıkıştırma ve optimizasyon
- Gelişmiş stok yönetimi
- Fiyat geçmişi takibi
