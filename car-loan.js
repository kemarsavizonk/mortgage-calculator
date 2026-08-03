  const carElement = id => document.getElementById(id);

  function carNumericValue(value){
    return parseFloat(String(value).replace(/,/g, '')) || 0;
  }

  function carMoney(value, decimals = 2){
    const amount = Number.isFinite(value) ? value : 0;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function formatCarCurrencyWhileTyping(input){
    const cleaned = input.value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const hasDecimal = cleaned.includes('.');
    const [wholePart = '0', ...decimalParts] = cleaned.split('.');
    const whole = wholePart.replace(/^0+(?=\d)/, '') || '0';
    const decimals = decimalParts.join('').slice(0, 2);
    input.value = Number(whole).toLocaleString('en-US') + (hasDecimal ? '.' + decimals : '');
  }

  function formatCarCurrency(input){
    const value = Math.max(0, carNumericValue(input.value));
    input.value = carMoney(value, Number.isInteger(value) ? 0 : 2);
  }

  function monthlyCarPayment(principal, annualRate, months){
    if(principal <= 0 || months <= 0) return 0;
    const monthlyRate = annualRate / 100 / 12;
    if(monthlyRate === 0) return principal / months;
    const factor = Math.pow(1 + monthlyRate, months);
    return principal * monthlyRate * factor / (factor - 1);
  }

  function populateVehicleYears(){
    const currentYear = new Date().getFullYear();
    const yearSelect = carElement('vehicleYear');
    yearSelect.innerHTML = '';

    for(let year = currentYear + 1; year >= currentYear - 7; year--){
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year === currentYear + 1
        ? `${year} (upcoming)`
        : year === currentYear ? `${year} (current)` : String(year);
      option.selected = year === currentYear;
      yearSelect.appendChild(option);
    }
  }

  function applyYearRate(){
    const currentYear = new Date().getFullYear();
    const selectedYear = Number(carElement('vehicleYear').value);
    const isPastYear = selectedYear < currentYear;
    carElement('interestRate').value = isPastYear ? '12' : '8.5';
    carElement('yearRule').textContent = isPastYear ? 'Past vehicle · 12% starting rate' : 'Current/new vehicle · 8.5% starting rate';
    carElement('rateNote').textContent = isPastYear
      ? 'Past-year vehicles start at 12%. You can edit the rate to match your bank’s offer.'
      : 'Current and future-year vehicles start at 8.5%. You can edit the rate to match your bank’s offer.';
    recalculateCarLoan();
  }

  function recalculateCarLoan(){
    const price = Math.max(0, carNumericValue(carElement('carPrice').value));
    const downPayment = Math.max(0, carNumericValue(carElement('downPayment').value));
    const annualRate = Math.max(0, parseFloat(carElement('interestRate').value) || 0);
    const months = Math.max(0, parseInt(carElement('loanMonths').value, 10) || 0);
    const principal = Math.max(0, price - downPayment);
    const monthlyPayment = monthlyCarPayment(principal, annualRate, months);
    const totalPayments = monthlyPayment * months;
    const interest = Math.max(0, totalPayments - principal);

    carElement('carMonthlyPayment').textContent = carMoney(monthlyPayment);
    carElement('amountFinanced').textContent = 'J$' + carMoney(principal);
    carElement('totalLoanPayments').textContent = 'J$' + carMoney(totalPayments);
    carElement('totalInterest').textContent = 'J$' + carMoney(interest);

    const status = carElement('carStatus');
    if(price <= 0){
      status.className = 'car-status warning';
      status.textContent = 'Enter a car price to calculate the loan.';
    } else if(downPayment > price){
      status.className = 'car-status warning';
      status.textContent = 'The down payment is greater than the car price.';
    } else if(months <= 0){
      status.className = 'car-status warning';
      status.textContent = 'Enter a loan length of at least one month.';
    } else {
      status.className = 'car-status ready';
      status.textContent = `${months} monthly payments at ${annualRate.toFixed(2)}% per year.`;
    }
  }

  populateVehicleYears();
  carElement('vehicleYear').addEventListener('change', applyYearRate);
  carElement('interestRate').addEventListener('input', recalculateCarLoan);
  carElement('loanMonths').addEventListener('input', recalculateCarLoan);

  document.querySelectorAll('[data-car-currency]').forEach(input => {
    input.addEventListener('input', () => {
      formatCarCurrencyWhileTyping(input);
      recalculateCarLoan();
    });
    input.addEventListener('blur', () => formatCarCurrency(input));
  });

  applyYearRate();
