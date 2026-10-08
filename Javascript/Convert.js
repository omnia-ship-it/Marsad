// Currency converter — uses the same free API as currency.js (no key needed)
async function convertCurrency() {
    var from = document.querySelector('#from').value
    var to = document.querySelector('#to').value
    var amount = parseFloat(document.querySelector('#amount').value)
    var resultBox = document.querySelector('#convertResult')
    var rateInfo = document.querySelector('#rateInfo')
    var button = document.querySelector('#convertBtn')

    if (!amount || amount <= 0) {
        resultBox.textContent = '—'
        rateInfo.textContent = 'Please enter a valid amount.'
        return
    }

    button.disabled = true
    button.textContent = 'Converting...'

    try {
        var response = await fetch(`https://open.er-api.com/v6/latest/${from}`)
        var data = await response.json()

        if (data.result !== 'success' || !data.rates[to]) {
            throw new Error('Rate not available')
        }

        var rate = data.rates[to]
        var converted = amount * rate

        resultBox.textContent = `${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`
        rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`
    } catch (error) {
        console.error('Conversion failed:', error)
        resultBox.textContent = '—'
        rateInfo.textContent = 'Could not load the exchange rate. Try again in a moment.'
    } finally {
        button.disabled = false
        button.textContent = 'Convert'
    }
}

function swapCurrencies() {
    var from = document.querySelector('#from')
    var to = document.querySelector('#to')
    var temp = from.value
    from.value = to.value
    to.value = temp
    if (document.querySelector('#amount').value) convertCurrency()
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#convertBtn').addEventListener('click', convertCurrency)
    document.querySelector('#swapBtn').addEventListener('click', swapCurrencies)
    document.querySelector('#amount').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') convertCurrency()
    })
})