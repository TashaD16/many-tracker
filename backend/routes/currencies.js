const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all currency rates
router.get('/rates', auth, async (req, res) => {
  try {
    const rates = await prisma.currencyRate.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    res.json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rate for specific currencies
router.get('/rates/:from/:to', auth, async (req, res) => {
  try {
    const { from, to } = req.params;

    if (from === to) {
      return res.json({ rate: 1, fromCurrency: from, toCurrency: to });
    }

    let rate = await prisma.currencyRate.findFirst({
      where: {
        fromCurrency: from.toUpperCase(),
        toCurrency: to.toUpperCase()
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!rate) {
      // Try reverse
      const reverseRate = await prisma.currencyRate.findFirst({
        where: {
          fromCurrency: to.toUpperCase(),
          toCurrency: from.toUpperCase()
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (reverseRate) {
        rate = {
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          rate: 1 / reverseRate.rate
        };
      }
    }

    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json(rate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update currency rates from MyFin.by API
router.post('/rates/update', auth, async (req, res) => {
  try {
    const apiUrl = process.env.MYFIN_API_URL || 'https://api.myfin.by/bank/kursExchange';
    
    // Fetch rates from MyFin API (example structure - adjust based on actual API)
    const response = await axios.get(apiUrl);
    const rates = response.data;

    // Base currency (BYN)
    const baseCurrency = 'BYN';
    const currencies = ['USD', 'EUR', 'RUB'];

    // Parse and save rates (adjust parsing based on actual API response)
    const rateUpdates = [];

    for (const currency of currencies) {
      // Example: assume API returns { USD: { buy: 3.25, sell: 3.30 }, ... }
      // Adjust based on actual API structure
      const currencyRate = rates[currency] || rates.find(r => r.code === currency);
      
      if (currencyRate) {
        const buyRate = currencyRate.buy || currencyRate.rate_buy || currencyRate.rate;
        const sellRate = currencyRate.sell || currencyRate.rate_sell || currencyRate.rate;

        // Save buy rate (BYN to foreign currency)
        if (buyRate) {
          rateUpdates.push(
            prisma.currencyRate.upsert({
              where: {
                fromCurrency_toCurrency_source: {
                  fromCurrency: baseCurrency,
                  toCurrency: currency,
                  source: 'myfin.by'
                }
              },
              update: { rate: 1 / buyRate }, // Convert to foreign->BYN
              create: {
                fromCurrency: baseCurrency,
                toCurrency: currency,
                rate: 1 / buyRate,
                source: 'myfin.by'
              }
            })
          );
        }
      }
    }

    await Promise.all(rateUpdates);

    res.json({ message: 'Rates updated successfully' });
  } catch (error) {
    console.error('Error updating rates:', error.message);
    res.status(500).json({ 
      message: 'Failed to update rates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Convert currency
router.post('/convert', auth, [
  require('express-validator').body('amount').isFloat({ min: 0 }).toFloat(),
  require('express-validator').body('from').notEmpty(),
  require('express-validator').body('to').notEmpty()
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, from, to } = req.body;

    if (from === to) {
      return res.json({ amount, converted: amount, from, to, rate: 1 });
    }

    const rate = await prisma.currencyRate.findFirst({
      where: {
        fromCurrency: from.toUpperCase(),
        toCurrency: to.toUpperCase()
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!rate) {
      // Try reverse
      const reverseRate = await prisma.currencyRate.findFirst({
        where: {
          fromCurrency: to.toUpperCase(),
          toCurrency: from.toUpperCase()
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (reverseRate) {
        const converted = amount / reverseRate.rate;
        return res.json({
          amount,
          converted,
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          rate: 1 / reverseRate.rate
        });
      }

      return res.status(404).json({ message: 'Exchange rate not found' });
    }

    const converted = amount * rate.rate;

    res.json({
      amount,
      converted,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: rate.rate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
