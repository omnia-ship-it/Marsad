async function getCurrencyData($curr) {
    var currencyApiUrl = `https://open.er-api.com/v6/latest/${$curr}`
    var response = await fetch(currencyApiUrl)
    var data = await response.json()

    var currencySection = document.createElement('div')
    currencySection.classList.add('row')
    var currencydetails =
        `
    <h4 class="col-6">${data.base_code}</h4>
    <h4 class="col-6">${data.rates.EGP.toFixed(2)}</h4>
    `
    currencySection.innerHTML = currencydetails
    document.querySelector('#currency').appendChild(currencySection)
    // console.log(data);
}
