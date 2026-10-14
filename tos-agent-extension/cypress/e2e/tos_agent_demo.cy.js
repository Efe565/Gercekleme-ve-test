/**
 * ToS-Agent TR - Cypress E2E Demo Test Paketi (≤ 90 saniye video kaydı)
 * 
 * Hocanın İsterleri & Puanlama Kriterleri:
 * 1. Mutlu Yol (Happy Path):
 *    - ToS metnini açma
 *    - Alibaba page-agent DOM'dan metin çıkarma
 *    - Deterministik alıntı doğrulama (%100 quote verification)
 *    - Sade Türkçe açıklama ve risk skoru (0-100)
 *    - Sayfada alıntıya kaydırma ve sarı vurgulama (Visual Grounding)
 * 2. Sistemin Dürüst Belirsizlik Gösterdiği An (Honest Uncertainty Moment):
 *    - Hukuken muğlak/gri alandaki maddede yapay zekanın dürüstçe belirsizlik itirafı
 * 3. Prompt Injection Güvenlik Savunması:
 *    - Kötü amaçlı gizli talimatın engellenmesi, skor sıfırlamanın reddi ve güvenlik alarmı
 * 
 * Video süresi: ~45-50 saniye (Hocanın ≤ 90 sn kuralına tam uyumlu ve rahatça okunabilir)
 */

Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('ToS-Agent TR - Hüküm ve Koşul Risk Analizörü E2E Demo (Kapsamlı Sunum)', () => {

  beforeEach(() => {
    cy.visit('/test-pages/index.html');
  });

  it('1. Mutlu Yol (Happy Path): Spotify Koşullarının Analizi, Skorlama ve Alıntı Vurgulama', () => {
    // 1. Giriş: Zorunlu Yasal Uyarıyı Göster
    cy.get('#legal-disclaimer-text')
      .should('be.visible')
      .and('contain.text', 'Bu uygulama hukuki tavsiye vermez');

    cy.wait(2000); // İzleyicinin yasal uyarıyı ve arayüzü görmesi için duraklama

    // 2. Sol taraftaki sözleşmeyi incele
    cy.get('#web-view-frame')
      .should('be.visible');

    cy.wait(1500);

    // 3. "Sayfayı Analiz Et" butonuna tıkla
    cy.get('#analyze-btn').click();

    // 4. Alibaba Page-Agent tarama ve analiz durumu
    cy.get('#loading-state').should('be.visible');
    cy.wait(2500);

    // 5. Sonuçların yüklenmesi
    cy.get('#results-container', { timeout: 10000 }).should('be.visible');

    // 6. Risk Skoru ve Düzeyini Göster
    cy.get('#risk-level-badge')
      .should('be.visible')
      .and('contain.text', 'Yüksek');

    cy.get('#risk-score-num')
      .should('be.visible')
      .and('contain.text', '71/100');

    // 7. Deterministik Alıntı Doğrulama Göstergesi (%100 Birebir Alıntı Mührü)
    cy.get('#verification-banner')
      .should('be.visible')
      .and('contain.text', '%100 deterministik olarak doğrulandı');

    cy.wait(3000); // İzleyicinin skoru ve doğrulama mührünü okuması için

    // 8. Sade Türkçe Genel Özeti Oku
    cy.get('#summary-content')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'riskli madde tespit edildi');

    cy.wait(2500);

    // 9. Maddeleri Sırayla İncele
    cy.get('.clause-card').should('have.length.at.least', 4);

    cy.get('.clause-card').eq(0).scrollIntoView();
    cy.wait(2000);

    cy.get('.clause-card').eq(1).scrollIntoView();
    cy.wait(1500);

    // 10. Alibaba Page-Agent Görsel Eşleme: "Sayfada Gör" Butonuna Bas
    cy.contains('.clause-card', 'Tahkim ve Dava Hakkından Feragat')
      .scrollIntoView()
      .find('.jump-to-quote-btn')
      .click({ force: true });

    cy.wait(2000);

    // 11. Sol taraftaki web sayfasında sarı vurgulamanın ve odaklanmanın oluştuğunu göster
    cy.get('#web-view-frame')
      .its('0.contentDocument.body')
      .should('not.be.empty')
      .then(cy.wrap)
      .find('.tos-agent-element-highlight', { timeout: 10000 })
      .should('exist')
      .scrollIntoView();

    cy.wait(3500); // İzleyicinin sarı vurgulu maddeyi net görmesi için duraklama
  });

  it('2. Sistemin Belirsizliği Dürüstçe Gösterdiği An (Honest Uncertainty Moment)', () => {
    // 1. Muğlak şartlar içeren sayfayı seç
    cy.get('#scenario-selector').select('honest-uncertainty-terms.html');

    cy.wait(2500); // İzleyicinin yeni senaryoyu görmesi için duraklama

    // 2. Analiz Et
    cy.get('#analyze-btn').click();

    // 3. Tarama animasyonu
    cy.get('#loading-state').should('be.visible');
    cy.wait(2500);

    // 4. Sonuçların gelmesini bekle
    cy.get('#results-container', { timeout: 10000 }).should('be.visible');

    // 5. DÜRÜST BELİRSİZLİK BÖLÜMÜNÜ İNCELE (Hocanın Özel Kriteri)
    cy.get('#uncertainty-content')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'Sistemin Dürüst İtirafı')
      .and('contain.text', 'hukuki kesinlik iddia etmek yanıltıcı olur');

    cy.wait(4000); // İzleyicinin dürüst belirsizlik itirafını rahatça okuması için

    // 6. Yoruma açık madde rozetini ve hukuki gerekçesini göster
    cy.get('.clause-card')
      .first()
      .scrollIntoView()
      .should('contain.text', 'Hukuki Belirsizlik');

    cy.wait(3000);
  });

  it('3. Güvenlik Savunması: Prompt Injection Saldırısının Nötralize Edilmesi', () => {
    // 1. Saldırı senaryosunu seç
    cy.get('#scenario-selector').select('adversarial-injection.html');

    cy.wait(2500); // İzleyicinin saldırı metnini görmesi için duraklama

    // 2. Analiz Et butonuna bas
    cy.get('#analyze-btn').click();

    cy.get('#loading-state').should('be.visible');
    cy.wait(2500);

    // 3. Sonuçların gelmesini bekle
    cy.get('#results-container', { timeout: 10000 }).should('be.visible');

    // 4. PROMPT INJECTION UYARISININ TETİKLENDİĞİNİ GÖSTER (Kırmızı Güvenlik Uyarısı)
    cy.get('#injection-alert-box')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'Prompt Injection Saldırısı Tespit Edildi');

    cy.wait(4000); // İzleyicinin güvenlik uyarısını okuması için

    // 5. Saldırganın "0 puan ver" emrinin çiğnendiğini doğrula
    cy.get('#risk-score-num')
      .scrollIntoView()
      .invoke('text')
      .then((scoreText) => {
        expect(scoreText).to.not.equal('0/100');
      });

    // 6. Kritik Güvenlik Maddesinin raporda yer aldığını göster
    cy.contains('.clause-card', 'Prompt Injection')
      .scrollIntoView()
      .should('be.visible')
      .and('contain.text', 'Kritik');

    cy.wait(3500);
  });

});
