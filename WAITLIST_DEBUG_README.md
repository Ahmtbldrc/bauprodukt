# Waitlist Debugging - Sorun Giderme Rehberi

## Sorun
Waitlist ürün detay sayfasında "Allgemeine Informationen" ve "Technische Spezifikationen" tab'larında yapılan değişiklikler sayfa yenilendiğinde görünmüyor.

## Yapılan Düzeltmeler

### 1. Refetch Fonksiyonu Eklendi
- `loadWaitlistEntry()` fonksiyonu ayrı bir fonksiyon olarak tanımlandı
- Başarılı kayıt sonrası bu fonksiyon çağrılarak veriler API'den tekrar yükleniyor

### 2. Save Fonksiyonları Güncellendi
- `handleSaveGeneral()` - General tab değişiklikleri kaydedildikten sonra veriler tekrar yükleniyor
- `handleSaveSpecifications()` - Specifications tab değişiklikleri kaydedildikten sonra veriler tekrar yükleniyor
- `confirmSpecificationsDelete()` - Spezifikasyon silindikten sonra veriler tekrar yükleniyor

### 3. State Senkronizasyonu İyileştirildi
- `handleGeneralTechnicalSpecsChange()` fonksiyonu eklendi
- General tab'daki teknik spezifikasyonlar için özel handler
- FormData state'i ile API verisi arasında uyum sağlandı

### 4. Debug Log'ları Eklendi
- Veri yükleme işlemlerinde console.log'lar
- Save işlemlerinde console.log'lar
- API endpoint'inde console.log'lar

## Test Etme

### 1. General Tab Testi
1. Waitlist ürün detay sayfasına git
2. "Allgemeine Informationen" tab'ını seç
3. Herhangi bir alanı değiştir (örn: ürün adı, açıklama)
4. "Speichern" butonuna tıkla
5. Console'da debug log'ları kontrol et
6. Sayfayı yenile (F5)
7. Değişikliklerin korunduğunu doğrula

### 2. Specifications Tab Testi
1. "Technische Spezifikationen" tab'ını seç
2. Yeni bir spezifikasyon ekle
3. "Speichern" butonuna tıkla
4. Console'da debug log'ları kontrol et
5. Sayfayı yenile (F5)
6. Eklenen spezifikasyonun korunduğunu doğrula

### 3. Console Log Kontrolü
Aşağıdaki log'ları console'da görmelisin:

```
Loading waitlist entry: [entry-id]
Loaded entry data: [entry-data]
Setting form data from payload: [payload-data]
General technical specs: [specs-data]
Saving general data: [form-data]
Updated payload: [updated-payload]
Save response: [response-data]
```

## Beklenen Sonuç
- Değişiklikler kaydedildikten sonra sayfa yenilendiğinde korunmalı
- API'den veriler doğru şekilde yüklenmeli
- Local state ile API verisi arasında uyum olmalı

## Hata Durumunda
1. Console'da hata mesajlarını kontrol et
2. Network tab'ında API çağrılarını kontrol et
3. Debug log'larında hangi aşamada sorun olduğunu belirle
4. Supabase veritabanında `waitlist_updates` tablosunu kontrol et

## Not
Bu düzeltmeler waitlist girişlerinin güncellenmesi sırasında veri tutarlılığını sağlamayı amaçlar. Eğer sorun devam ederse, veritabanı şeması ve API endpoint'leri daha detaylı incelenmelidir.
