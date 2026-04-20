function toAmount(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateCashChange(chargedTotal, cashReceived) {
  const saleTotal = Math.max(toAmount(chargedTotal, 0), 0);
  const received = Math.max(toAmount(cashReceived, 0), 0);
  const shortage = Math.max(Number((saleTotal - received).toFixed(2)), 0);
  const changeDue = Math.max(Number((received - saleTotal).toFixed(2)), 0);

  return {
    saleTotal,
    received,
    shortage,
    changeDue,
    isExact: shortage === 0 && changeDue === 0,
  };
}

export function buildCashTenderSuggestions(chargedTotal) {
  const total = Math.max(Math.ceil(toAmount(chargedTotal, 0)), 0);
  if (!total) {
    return [];
  }

  const baseSuggestions = [total];
  const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

  denominations.forEach((denomination) => {
    if (denomination >= total) {
      baseSuggestions.push(denomination);
      return;
    }

    const rounded = Math.ceil(total / denomination) * denomination;
    if (rounded > total) {
      baseSuggestions.push(rounded);
    }
  });

  return [...new Set(baseSuggestions)].sort((left, right) => left - right).slice(0, 5);
}
