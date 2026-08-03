  const $ = id => document.getElementById(id);

  function money(n, decimals){
    n = isFinite(n) ? n : 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals ?? 0, maximumFractionDigits: decimals ?? 0 });
  }

  function numericValue(value){
    return parseFloat(String(value).replace(/,/g, '')) || 0;
  }

  function currencyText(value){
    const amount = Math.max(0, Number(value) || 0);
    return money(amount, Number.isInteger(amount) ? 0 : 2);
  }

  function formatCurrencyInput(input, value = numericValue(input.value)){
    input.value = currencyText(value);
  }

  function formatCurrencyWhileTyping(input){
    const cleaned = input.value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const hasDecimal = cleaned.includes('.');
    const [wholePart = '0', ...decimalParts] = cleaned.split('.');
    const whole = wholePart.replace(/^0+(?=\d)/, '') || '0';
    const decimals = decimalParts.join('').slice(0, 2);
    input.value = money(Number(whole)) + (hasDecimal ? '.' + decimals : '');
  }

  function monthlyPayment(principal, annualRatePct, years){
    const n = Math.round(years * 12);
    if(n <= 0 || principal <= 0) return 0;
    const r = (annualRatePct / 100) / 12;
    if(r === 0) return principal / n;
    const f = Math.pow(1 + r, n);
    return principal * r * f / (f - 1);
  }

  // bind a range input <-> a number input so either can drive the value.
  // The number input is the source of truth (it can go outside the slider's
  // min/max if the person types a bigger number); the slider clamps visually.
  function bindPair(rangeId, numberId, onChange){
    const r = $(rangeId);
    const n = $(numberId);
    const isCurrency = n.hasAttribute('data-currency');
    r.addEventListener('input', () => {
      n.value = isCurrency ? money(numericValue(r.value)) : r.value;
      onChange();
    });
    n.addEventListener('input', () => {
      if(isCurrency) formatCurrencyWhileTyping(n);
      const value = numericValue(n.value);
      r.value = value;
      onChange();
    });
    if(isCurrency) n.addEventListener('blur', () => formatCurrencyInput(n));
    onChange();
  }

  function selectedApplicantCount(){
    return parseInt($('nhtApplicantCount').value, 10) || 0;
  }

  function setApplicantVisibility(){
    const count = selectedApplicantCount();
    document.querySelectorAll('.nht-card').forEach(card => {
      card.classList.toggle('is-hidden', Number(card.dataset.nhtApplicant) > count);
    });
    $('nhtTotalN').disabled = count === 0;
  }

  function setNhtTotalFromApplicants(){
    const count = selectedApplicantCount();
    let total = 0;
    for(let i = 1; i <= count; i++) total += numericValue($(`nht${i}PrincipalN`).value);
    formatCurrencyInput($('nhtTotalN'), total);
  }

  function distributeNhtTotal(preserveTotalText = false){
    const count = selectedApplicantCount();
    const total = count > 0 ? Math.max(0, numericValue($('nhtTotalN').value)) : 0;
    const totalCents = Math.round(total * 100);
    const baseShareCents = count > 0 ? Math.floor(totalCents / count) : 0;
    const remainderCents = count > 0 ? totalCents % count : 0;

    for(let i = 1; i <= 3; i++){
      const amount = i <= count
        ? (baseShareCents + (i <= remainderCents ? 1 : 0)) / 100
        : 0;
      $(`nht${i}PrincipalN`).value = currencyText(amount);
      $(`nht${i}PrincipalR`).value = amount;
    }
    if(!preserveTotalText) formatCurrencyInput($('nhtTotalN'), total);
    recalc();
  }

  function recalc(){
    const housePrice = Math.max(0, numericValue($('housePriceN').value));
    const deposit = Math.max(0, numericValue($('depositN').value));

    const applicantCount = selectedApplicantCount();
    const nht1P = applicantCount >= 1 ? Math.max(0, numericValue($('nht1PrincipalN').value)) : 0;
    const nht1R = parseFloat($('nht1RateN').value) || 0;
    const nht1Y = parseFloat($('nht1YearsN').value) || 0;

    const nht2P = applicantCount >= 2 ? Math.max(0, numericValue($('nht2PrincipalN').value)) : 0;
    const nht2R = parseFloat($('nht2RateN').value) || 0;
    const nht2Y = parseFloat($('nht2YearsN').value) || 0;

    const nht3P = applicantCount >= 3 ? Math.max(0, numericValue($('nht3PrincipalN').value)) : 0;
    const nht3R = parseFloat($('nht3RateN').value) || 0;
    const nht3Y = parseFloat($('nht3YearsN').value) || 0;

    // The bank finances only the remaining balance after the deposit and NHT loans.
    const bankP = Math.max(0, housePrice - deposit - nht1P - nht2P - nht3P);
    formatCurrencyInput($('bankPrincipalN'), bankP);
    const bankR = parseFloat($('bankRateN').value) || 0;
    const bankY = parseFloat($('bankYearsN').value) || 0;

    const m1 = monthlyPayment(nht1P, nht1R, nht1Y);
    const m2 = monthlyPayment(nht2P, nht2R, nht2Y);
    const m3n = monthlyPayment(nht3P, nht3R, nht3Y);
    const m4 = monthlyPayment(bankP, bankR, bankY);
    const total = m1 + m2 + m3n + m4;

    $('nht1Monthly').textContent = 'J$' + money(m1, 2);
    $('nht2Monthly').textContent = 'J$' + money(m2, 2);
    $('nht3Monthly').textContent = 'J$' + money(m3n, 2);
    $('bankMonthly').textContent = 'J$' + money(m4, 2);
    $('totalMonthly').textContent = money(total, 2);

    // ---- funding blueprint bar ----
    const sumFunding = deposit + nht1P + nht2P + nht3P + bankP;
    const scale = Math.max(sumFunding, housePrice, 1);
    const pct = v => (v / scale) * 100;

    $('segDeposit').style.width = pct(deposit) + '%';
    $('segNht1').style.width = pct(nht1P) + '%';
    $('segNht2').style.width = pct(nht2P) + '%';
    $('segNht3').style.width = pct(nht3P) + '%';
    $('segBank').style.width = pct(bankP) + '%';
    $('priceMark').style.left = pct(housePrice) + '%';

    const diff = sumFunding - housePrice;
    const statusEl = $('fundingStatus');
    if(Math.abs(diff) < 1){
      statusEl.className = 'funding-status ok';
      statusEl.textContent = 'Fully funded — deposit + loans match the house price exactly';
    } else if(diff < 0){
      statusEl.className = 'funding-status bad';
      statusEl.textContent = 'Shortfall of J$' + money(Math.abs(diff)) + ' — funding does not yet cover the house price';
    } else {
      statusEl.className = 'funding-status bad';
      statusEl.textContent = 'Surplus of J$' + money(diff) + ' — funding exceeds the house price';
    }

    // ---- payment breakdown stack ----
    const stackRow = $('paymentStackRow');
    const stackLabels = $('paymentStackLabels');
    const parts = [
      { label: 'NHT · App. 1', value: m1, color: 'var(--nht1)' },
      { label: 'NHT · App. 2', value: m2, color: 'var(--nht2)' },
      { label: 'NHT · App. 3', value: m3n, color: 'var(--nht3)' },
      { label: 'Bank loan', value: m4, color: 'var(--bank)' },
    ];
    stackRow.innerHTML = parts.map(p => {
      const w = total > 0 ? (p.value/total*100) : 0;
      return `<div class="stack-seg" style="width:${w}%;background:${p.color}"></div>`;
    }).join('');
    stackLabels.innerHTML = parts.map(p => {
      const w = total > 0 ? (p.value/total*100) : 0;
      return `<div class="row"><span>${p.label}</span><b>${w.toFixed(1)}% · J$${money(p.value)}</b></div>`;
    }).join('');
  }

  // wire every slider to its matching manual-entry number box
  const NHT_GROUPS = ['nht1', 'nht2', 'nht3'];
  NHT_GROUPS.forEach(p => {
    bindPair(p + 'PrincipalR', p + 'PrincipalN', () => {
      setNhtTotalFromApplicants();
      recalc();
    });
    bindPair(p + 'RateR', p + 'RateN', recalc);
    bindPair(p + 'YearsR', p + 'YearsN', recalc);
  });
  ['Rate', 'Years'].forEach(suffix => {
    bindPair('bank' + suffix + 'R', 'bank' + suffix + 'N', recalc);
  });

  ['housePriceN', 'depositN'].forEach(id => {
    $(id).addEventListener('input', () => {
      formatCurrencyWhileTyping($(id));
      recalc();
    });
    $(id).addEventListener('blur', () => formatCurrencyInput($(id)));
  });

  $('nhtApplicantCount').addEventListener('change', () => {
    setApplicantVisibility();
    distributeNhtTotal();
  });

  $('nhtTotalN').addEventListener('input', () => {
    formatCurrencyWhileTyping($('nhtTotalN'));
    distributeNhtTotal(true);
  });
  $('nhtTotalN').addEventListener('blur', () => formatCurrencyInput($('nhtTotalN')));

  const DEFAULTS = {
    housePriceN: 42000000, depositN: 5000000,
    nht1Principal: 0, nht1Rate: 5, nht1Years: 30,
    nht2Principal: 0, nht2Rate: 5, nht2Years: 40,
    nht3Principal: 0, nht3Rate: 5, nht3Years: 30,
    bankRate: 8.25, bankYears: 30,
  };
  $('resetBtn').addEventListener('click', () => {
    formatCurrencyInput($('housePriceN'), DEFAULTS.housePriceN);
    formatCurrencyInput($('depositN'), DEFAULTS.depositN);
    $('nhtApplicantCount').value = '0';
    NHT_GROUPS.forEach(p => {
      ['Principal', 'Rate', 'Years'].forEach(suffix => {
        const v = DEFAULTS[p + suffix];
        $(p + suffix + 'R').value = v;
        const input = $(p + suffix + 'N');
        input.value = input.hasAttribute('data-currency') ? money(v) : v;
      });
    });
    ['Rate', 'Years'].forEach(suffix => {
      const v = DEFAULTS['bank' + suffix];
      $('bank' + suffix + 'R').value = v;
      $('bank' + suffix + 'N').value = v;
    });
    setApplicantVisibility();
    formatCurrencyInput($('nhtTotalN'), 0);
    recalc();
  });

  setApplicantVisibility();
  setNhtTotalFromApplicants();
  recalc();
