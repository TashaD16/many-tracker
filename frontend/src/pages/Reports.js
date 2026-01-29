import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { transactionsService } from '../services/supabaseService';
import axios from 'axios';

const Reports = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: '',
    format: 'csv'
  });

  const handleExport = async (format) => {
    try {
      if (format === 'csv' || format === 'pdf') {
        const params = {
          startDate: filters.startDate,
          endDate: filters.endDate
        };
        if (filters.type) params.type = filters.type;

        const response = await axios.get(`/api/reports/export/${format}`, {
          params,
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const transactions = await transactionsService.getAll({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type || undefined
        });

        const dataStr = JSON.stringify(transactions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transactions.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert(error.message || 'Error exporting report');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Export Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={filters.format} onValueChange={(value) => setFilters({ ...filters, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => handleExport(filters.format)}>
            <Download className="mr-2 h-4 w-4" />
            Export {filters.format.toUpperCase()}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
