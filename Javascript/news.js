const GNEWS_API_KEY = '69fbe89d28214fdca5e0ca186e10ed10';
const CACHE_KEY = 'marsad_news_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 دقيقة

// كلمات مفتاحية موسعة لكل قسم
const keywords = {
    'sports-news': [
        'رياضة', 'كرة', 'منتخب', 'نادي', 'دوري', 'كأس', 'أولمبي', 
        'تنس', 'سباحة', 'مباراة', 'لاعب', 'مدرب', 'بطولة', 'كورة'
    ],
    'entertainment-news': [
        'فن', 'فيلم', 'مسلسل', 'ممثل', 'مغني', 'أغنية', 'حفل', 
        'دراما', 'سينما', 'فنان', 'نجمة', 'عرض', 'مسرح', 'موسيقى'
    ],
    'health-news': [
        'صحة', 'طبيب', 'مستشفى', 'علاج', 'دواء', 'مرض', 'وباء', 
        'تطعيم', 'غذاء', 'تغذية', 'صحي', 'عافية', 'وقاية', 'حمية'
    ],
    'business-news': [
        'اقتصاد', 'بورصة', 'سعر', 'دولار', 'استثمار', 'شركة', 
        'تجارة', 'بنك', 'عملة', 'مال', 'سوق', 'تجارة', 'أعمال'
    ]
};

async function getNewsData() {
    console.log('🚀 بدء جلب الأخبار المصرية من GNews...');
    
    // التحقق من Cache أولاً
    const cached = getCachedNews();
    if (cached) {
        console.log('✅ استخدام الأخبار من Cache (توفّر طلب API)');
        distributeNews(cached);
        return;
    }

    // طلب الأخبار من API
    const url = `https://gnews.io/api/v4/search?q=مصر&lang=ar&country=eg&max=30&apikey=${GNEWS_API_KEY}`;
    
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Total articles:', data.articles?.length);

        if (response.status !== 200) {
            throw new Error(`API Error: ${data.errors?.[0] || response.status}`);
        }

        if (!data.articles || data.articles.length === 0) {
            console.log('⚠️ لا توجد أخبار لـ "مصر"، نجرب أخبار عامة...');
            await fetchGeneralNews();
            return;
        }

        // حفظ في Cache
        saveToCache(data.articles);
        
        // توزيع الأخبار
        distributeNews(data.articles);

    } catch (error) {
        console.error(' فشل جلب الأخبار:', error);
        
        // لو فيه Cache قديم، استخدميه
        const oldCache = localStorage.getItem(CACHE_KEY);
        if (oldCache) {
            console.log('⚠️ استخدام Cache قديم بسبب خطأ API');
            distributeNews(JSON.parse(oldCache).articles);
        } else {
            showErrorMessage();
        }
    }
}

async function fetchGeneralNews() {
    const url = `https://gnews.io/api/v4/top-headlines?lang=ar&country=eg&max=30&apikey=${GNEWS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            saveToCache(data.articles);
            distributeNews(data.articles);
        } else {
            showNoNewsMessage();
        }
    } catch (error) {
        console.error('❌ فشل جلب الأخبار العامة:', error);
        showErrorMessage();
    }
}

function distributeNews(articles) {
    const sections = {
        'sports-news': [],
        'entertainment-news': [],
        'health-news': [],
        'business-news': []
    };

    // توزيع المقالات حسب الكلمات المفتاحية
    articles.forEach(article => {
        const title = (article.title || '').toLowerCase();
        const description = (article.description || '').toLowerCase();
        const content = title + ' ' + description;

        let matched = false;
        for (const [sectionId, words] of Object.entries(keywords)) {
            if (words.some(word => content.includes(word))) {
                if (sections[sectionId].length < 3) {
                    sections[sectionId].push(article);
                }
                matched = true;
                break;
            }
        }

        // لو المقال مش متطابق، وزّعيه على الأقسام الفاضية
        if (!matched) {
            for (const sectionId of Object.keys(sections)) {
                if (sections[sectionId].length < 3) {
                    sections[sectionId].push(article);
                    break;
                }
            }
        }
    });

    console.log(' توزيع الأخبار:');
    console.log('Sports:', sections['sports-news'].length);
    console.log('Entertainment:', sections['entertainment-news'].length);
    console.log('Health:', sections['health-news'].length);
    console.log('Business:', sections['business-news'].length);

    // عرض الأخبار
    for (const [sectionId, sectionArticles] of Object.entries(sections)) {
        displayNews(sectionId, sectionArticles);
    }
}

function displayNews(containerId, articles) {
    const container = document.querySelector(`#${containerId}`);
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center py-3">لا توجد أخبار متاحة حالياً في هذا القسم.</p>';
        return;
    }

    container.innerHTML = '';

    articles.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');

        const publishedDate = new Date(item.publishedAt);
        const formattedDate = publishedDate.toLocaleDateString('ar-EG', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });

        // لو مفيش صورة حقيقية، استخدمي نفس تدرجات الألوان المستخدمة في باقي الموقع
        // بدل via.placeholder.com (الخدمة دي بقت متوقفة من 2023 ومش شغالة خالص)
        const thumbClass = `t${(index % 3) + 1}`;
        const thumbStyle = item.image
            ? `background-image: url('${item.image}'); background-size: cover; background-position: center;`
            : '';

        const sourceName = (item.source && item.source.name) ? item.source.name : 'مصدر غير معروف';

        card.innerHTML = `
            <a href="article.html" class="ki-card text-decoration-none">
                <div class="ki-thumb ${thumbClass}" style="${thumbStyle} border-radius: 10px; min-height: 180px;"></div>
                <div class="ki-card-meta d-flex justify-content-between align-items-center mt-2">
                    <span class="ki-source-badge">${sourceName}</span>
                    <time class="text-muted small">${formattedDate}</time>
                </div>
                <h3 class="h5 mt-2" style="color: var(--ki-ink); line-height: 1.4;">${item.title}</h3>
                ${item.description ? `<p class="text-muted small mt-1" style="line-height: 1.5;">${item.description.substring(0, 100)}...</p>` : ''}
            </a>
        `;

        card.querySelector('a').addEventListener('click', function () {
            sessionStorage.setItem('marsad_current_article', JSON.stringify(item));
        });

        container.appendChild(card);
    });

    console.log(`✅ تم عرض ${articles.length} خبر في #${containerId}`);
}

// Cache Functions
function getCachedNews() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { timestamp, articles } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp < CACHE_DURATION) {
        return articles;
    }
    
    // Cache منتهي
    localStorage.removeItem(CACHE_KEY);
    return null;
}

function saveToCache(articles) {
    const data = {
        timestamp: Date.now(),
        articles: articles
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    console.log('💾 تم حفظ الأخبار في Cache');
}

function showNoNewsMessage() {
    const sections = ['sports-news', 'entertainment-news', 'health-news', 'business-news'];
    sections.forEach(id => {
        const container = document.querySelector(`#${id}`);
        if (container) {
            container.innerHTML = '<p class="text-muted small text-center py-3">لا توجد أخبار مصرية متاحة حالياً.</p>';
        }
    });
}

function showErrorMessage() {
    const sections = ['sports-news', 'entertainment-news', 'health-news', 'business-news'];
    sections.forEach(id => {
        const container = document.querySelector(`#${id}`);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <strong>تعذر تحميل الأخبار.</strong>
                    <br><small class="text-muted">تأكدي من الاتصال بالإنترنت.</small>
                </div>
            `;
        }
    });
}

// تشغيل الدالة عند تحميل الصفحة
// (ملحوظة: دي الاستدعاء الوحيد لـ getNewsData الآن، بعد ما شلنا النداء المكرر من app.js)
document.addEventListener('DOMContentLoaded', getNewsData);