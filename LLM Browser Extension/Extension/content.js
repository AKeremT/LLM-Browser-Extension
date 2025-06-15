chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "scan_page") {
        let termsAndConditionsText = '';
        let websiteUrl = window.location.href;
        let foundContent = false;

        // 1. Belirli CSS seçicileriyle arama
        const specificContentSelectors = [
            '#terms-of-service', '#privacy-policy', '#cookie-policy',
            '.terms-content', '.privacy-text', '.policy-content',
            'div[class*="terms"]', 'div[class*="privacy"]',
            'article.legal-text', 'section.privacy-section',
            'div#legal-notice', 'div[itemprop="description"]',
            'main', 'div[role="main"]',
            '#kullanım-koşulları', '#gizlilik-politikası',
            '.kvkk-metni', '.cerez-politikasi-icerik'
        ];

        for (const selector of specificContentSelectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText && element.innerText.length > 500) {
                termsAndConditionsText += element.innerText.trim() + "\n\n";
                foundContent = true;
                console.log(`✅ İçerik bulundu (spesifik): ${selector}`);
            }
        }

        // 2. Anahtar kelime tabanlı dinamik arama
        if (!foundContent) {
            const keywordRegex = /terms|privacy|policy|kullanım|gizlilik|koşul|kvkk|çerez/i;
            const elements = document.querySelectorAll('section, article, div, footer');

            elements.forEach(el => {
                const text = el.innerText?.trim();
                if (text && text.length > 300 && keywordRegex.test(text.toLowerCase())) {
                    termsAndConditionsText += text + "\n\n";
                    foundContent = true;
                }
            });

            if (foundContent) {
                console.log("✅ Dinamik olarak içerik bulundu (anahtar kelimelerle).");
            }
        }

        // 3. Hiçbir şey bulunamazsa fallback: body.innerText
        if (!foundContent) {
            console.warn("⚠️ Spesifik ya da anahtar kelime eşleşmesi yok. Sayfa geneli analiz edilecek.");
            termsAndConditionsText = document.body.innerText.trim();

            if (termsAndConditionsText.length < 100) {
                console.warn("⚠️ Sayfa içeriği çok kısa. Gerçekten anlamlı veri olmayabilir.");
                termsAndConditionsText = "No identifiable 'Terms and Conditions', 'Privacy Policy', or related legal content was found. Analyzing full page as fallback.";
            }
        }

        // 4. LLM'e gönderim
        chrome.runtime.sendMessage({
            type: "analyze_text",
            text: termsAndConditionsText,
            websiteUrl: websiteUrl
        }, (response) => {
            if (response && response.analysis) {
                alert("⚠️ Risk Analysis:\n" + response.analysis);
                if (response.message) {
                    console.log("📄 Kaydetme Mesajı:", response.message);
                }
            } else if (response && response.error) {
                console.error("❌ LLM analizinde hata oluştu:", response.error);
                alert("❌ LLM analizinde hata oluştu:\n" + response.error);
            } else {
                alert("❌ LLM analiz başarısız oldu veya beklenmedik bir hata oluştu.");
            }
        });
    }
});
