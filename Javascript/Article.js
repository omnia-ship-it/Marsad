// Shows the article the visitor clicked on the home page.
// news.js saves the clicked article in sessionStorage before navigating here.
function loadArticle() {
    var raw = sessionStorage.getItem('marsad_current_article')
    var box = document.querySelector('#articleBox')

    if (!raw) {
        box.innerHTML = `
            <h1>Article not found</h1>
            <p>Open an article from the <a href="index.html">home page</a> to read it here.</p>
        `
        return
    }

    var article = JSON.parse(raw)

    document.title = `${article.title} - مرصد`

    var title = document.querySelector('#articleTitle')
    title.textContent = article.title
    title.setAttribute('dir', 'auto')

    document.querySelector('#articleDate').textContent = new Date(article.publishedAt).toLocaleDateString('ar-EG', {
        day: 'numeric', month: 'long', year: 'numeric'
    })

    var img = document.querySelector('#articleImg')
    if (article.image) {
        img.style.backgroundImage = `url('${article.image}')`
        img.style.backgroundSize = 'cover'
        img.style.backgroundPosition = 'center'
    }

    var desc = document.querySelector('#articleDesc')
    desc.textContent = article.description || ''
    desc.setAttribute('dir', 'auto')

    // GNews's free plan cuts the content short and ends it with "... [1234 chars]"
    var content = (article.content || '').replace(/\s*\[\d+ chars\]$/, '')
    var contentEl = document.querySelector('#articleContent')
    if (content && content !== article.description) {
        contentEl.textContent = content
        contentEl.setAttribute('dir', 'auto')
    } else {
        contentEl.remove()
    }

    var sourceName = (article.source && article.source.name) ? article.source.name : 'Unknown source'
    document.querySelector('#articleSource').textContent = sourceName
    document.querySelector('#articleLink').href = article.url
}

document.addEventListener('DOMContentLoaded', loadArticle)