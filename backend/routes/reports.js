const express = require('express');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Export transactions to CSV
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, categoryId, accountId } = req.query;

    const where = { userId: req.user.id };
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true
      },
      orderBy: { date: 'desc' }
    });

    // Generate CSV content
    const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Currency', 'Description'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const row = [
        t.date.toISOString().split('T')[0],
        t.type,
        `"${t.category.name.replace(/"/g, '""')}"`,
        `"${t.account.name.replace(/"/g, '""')}"`,
        t.amount,
        t.account.currency,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send('\ufeff' + csvContent); // BOM for Excel compatibility
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export transactions to PDF
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, categoryId, accountId } = req.query;

    const where = { userId: req.user.id };
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (accountId) where.accountId = accountId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true
      },
      orderBy: { date: 'desc' }
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Transactions Report', { align: 'center' });
    doc.moveDown();

    transactions.forEach((t, index) => {
      doc.fontSize(12);
      doc.text(`${index + 1}. ${t.date.toISOString().split('T')[0]} - ${t.type.toUpperCase()}`);
      doc.text(`   Category: ${t.category.name}`);
      doc.text(`   Account: ${t.account.name}`);
      doc.text(`   Amount: ${t.amount}`);
      if (t.description) {
        doc.text(`   Description: ${t.description}`);
      }
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
