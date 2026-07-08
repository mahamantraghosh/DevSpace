const toCurrency = document.getElementById("to-currency");
const fromCurrency = document.getElementById("from-currency");
const amountInput = document.getElementById("amount");
const converterForm = document.getElementById("converter-form");
const resultDiv = document.getElementById("result");

window.addEventListener("load", () => {
  fetchCurrencies();
  loadPinterestBackground();
});

converterForm.addEventListener("submit", convertCurrency);

const pinterestBackgroundUrl = "https://i.pinimg.com/1200x/35/60/12/3560127cdb373fe2e170004b43ce8bad.jpg";

function loadPinterestBackground() {
  if (!navigator.onLine) {
    return;
  }

  const img = new Image();
  img.onload = () => {
    document.body.style.backgroundImage = `url('${pinterestBackgroundUrl}')`;
  };
  img.onerror = () => {
    console.warn("Pinterest background image not available. Using default background.");
  };
  img.src = pinterestBackgroundUrl;
}

async function fetchCurrencies() {
  const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  const data = await response.json();

  console.log(data);
  const currencyOptions = Object.keys(data.rates);

  currencyOptions.forEach((currency) => {
    const option1 = document.createElement("option");
    option1.value = currency;
    option1.textContent = currency;
    fromCurrency.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = currency;
    option2.textContent = currency;
    toCurrency.appendChild(option2);
  });
}

async function convertCurrency(e) {
  e.preventDefault();

  const amount = parseFloat(amountInput.value);
  const fromCurrencyValue = fromCurrency.value;
  const toCurrencyValue = toCurrency.value;

  if (amount < 0) {
    alert("Please ener a valid amount");
    return;
  }

  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrencyValue}`);
  const data = await response.json();

  const rate = data.rates[toCurrencyValue];
  const convertedAmount = (amount * rate).toFixed(2);

  resultDiv.textContent = `${amount} ${fromCurrencyValue} = ${convertedAmount} ${toCurrencyValue}`;
}
