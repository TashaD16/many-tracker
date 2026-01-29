const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCurrencyRates() {
  try {
    const apiUrl = process.env.MYFIN_API_URL || 'https://api.myfin.by/bank/kursExchange';
    
    // Try to fetch rates from MyFin API
    // Note: This is a placeholder - adjust based on actual API structure
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'MoneyTracker/1.0'
      }
    });

    const rates = response.data;
    const baseCurrency = 'BYN';
    const currencies = ['USD', 'EUR', 'RUB'];

    const rateUpdates = [];

    for (const currency of currencies) {
      try {
        // Adjust parsing based on actual API response structure
        // Example structures:
        // 1. { USD: { buy: 3.25, sell: 3.30 } }
        // 2. [{ code: 'USD', buy: 3.25, sell: 3.30 }]
        // 3. { rates: { USD: 3.25 } }

        let currencyRate = null;
        if (rates[currency]) {
          currencyRate = rates[currency];
        } else if (Array.isArray(rates)) {
          currencyRate = rates.find(r => r.code === currency || r.currency === currency);
        } else if (rates.rates && rates.rates[currency]) {
          currencyRate = { rate: rates.rates[currency] };
        }

        if (currencyRate) {
          const buyRate = currencyRate.buy || currencyRate.rate_buy || currencyRate.rate;
          const sellRate = currencyRate.sell || currencyRate.rate_sell || currencyRate.rate;
          
          // Use average of buy and sell, or just buy if sell not available
          const avgRate = buyRate && sellRate ? (buyRate + sellRate) / 2 : buyRate;

          if (avgRate && avgRate > 0) {
            // Store rate as BYN to foreign currency (1 BYN = X USD)
            // If API gives foreign to BYN, invert it
            const rate = avgRate > 1 ? 1 / avgRate : avgRate;

            rateUpdates.push(
              prisma.currencyRate.upsert({
                where: {
                  fromCurrency_toCurrency_source: {
                    fromCurrency: baseCurrency,
                    toCurrency: currency,
                    source: 'myfin.by'
                  }
                },
                update: { rate },
                create: {
                  fromCurrency: baseCurrency,
                  toCurrency: currency,
                  rate,
                  source: 'myfin.by'
                }
              })
            );

            // Also create reverse rate
            rateUpdates.push(
              prisma.currencyRate.upsert({
                where: {
                  fromCurrency_toCurrency_source: {
                    fromCurrency: currency,
                    toCurrency: baseCurrency,
                    source: 'myfin.by'
                  }
                },
                update: { rate: 1 / rate },
                create: {
                  fromCurrency: currency,
                  toCurrency: baseCurrency,
                  rate: 1 / rate,
                  source: 'myfin.by'
                }
              })
            );
          }
        }
      } catch (error) {
        console.error(`Error updating rate for ${currency}:`, error.message);
      }
    }

    await Promise.all(rateUpdates);
    console.log('Currency rates updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating currency rates:', error.message);
    
    // Fallback: Set default rates if API fails
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('Using fallback rates');
      await setFallbackRates();
    }
    
    return false;
  }
}

async function setFallbackRates() {
  // Default rates (approximate, should be updated manually)
  const defaultRates = {
    'USD': 3.25,
    'EUR': 3.50,
    'RUB': 0.035
  };

  const baseCurrency = 'BYN';
  const rateUpdates = [];

  for (const [currency, rate] of Object.entries(defaultRates)) {
    rateUpdates.push(
      prisma.currencyRate.upsert({
        where: {
          fromCurrency_toCurrency_source: {
            fromCurrency: baseCurrency,
            toCurrency: currency,
            source: 'myfin.by'
          }
        },
        update: { rate: 1 / rate },
        create: {
          fromCurrency: baseCurrency,
          toCurrency: currency,
          rate: 1 / rate,
          source: 'myfin.by'
        }
      })
    );

    rateUpdates.push(
      prisma.currencyRate.upsert({
        where: {
          fromCurrency_toCurrency_source: {
            fromCurrency: currency,
            toCurrency: baseCurrency,
            source: 'myfin.by'
          }
        },
        update: { rate },
        create: {
          fromCurrency: currency,
          toCurrency: baseCurrency,
          rate,
          source: 'myfin.by'
        }
      })
    );
  }

  await Promise.all(rateUpdates);
}

module.exports = { updateCurrencyRates, setFallbackRates };
