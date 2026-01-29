import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { transactionsService, accountsService, categoriesService } from '../services/supabaseService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

const Transactions = () => {
  const { user } = useSupabaseAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    tags: []
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const filterParams = {};
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.type && filters.type !== 'all') filterParams.type = filters.type;
      if (filters.categoryId && filters.categoryId !== 'all') filterParams.categoryId = filters.categoryId;
      if (filters.accountId && filters.accountId !== 'all') filterParams.accountId = filters.accountId;

      const data = await transactionsService.getAll(filterParams);
      
      const sorted = [...data].sort((a, b) => {
        const aVal = filters.sortBy === 'date' ? new Date(a.date) : a.amount;
        const bVal = filters.sortBy === 'date' ? new Date(b.date) : b.amount;
        return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
      
      setTransactions(sorted);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchAccounts();
      fetchCategories();

      const subscription = supabase
        .channel('transactions-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'Transaction' },
          () => {
            fetchTransactions();
            fetchAccounts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters]);

  const fetchAccounts = async () => {
    try {
      const data = await accountsService.getAll();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = (transaction = null) => {
    if (transaction) {
      setEditing(transaction.id);
      setFormData({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId,
        amount: transaction.amount,
        type: transaction.type,
        date: new Date(transaction.date).toISOString().split('T')[0],
        description: transaction.description || ''
      });
    } else {
      setEditing(null);
      setFormData({
        accountId: accounts[0]?.id || '',
        categoryId: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) return;
      
      const transactionData = {
        ...formData,
        userId: user.id,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      if (editing) {
        await transactionsService.update(editing, transactionData);
      } else {
        await transactionsService.create(transactionData);
      }
      handleClose();
      fetchTransactions();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(error.message || 'Error saving transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionsService.delete(id);
      fetchTransactions();
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(error.message || 'Error deleting transaction');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const data = await transactionsService.getById(id);
      setSelectedTransaction(data);
      setDetailOpen(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      alert(error.message || 'Error fetching transaction details');
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Transactions</h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.categoryId} onValueChange={(value) => setFilters({ ...filters, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={filters.accountId} onValueChange={(value) => setFilters({ ...filters, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setFilters({
              startDate: '',
              endDate: '',
              type: 'all',
              categoryId: 'all',
              accountId: 'all',
              sortBy: 'date',
              sortOrder: 'desc'
            })}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === 'income' ? 'success' : 'error'}>
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.category?.name}</TableCell>
                  <TableCell>{t.account?.name}</TableCell>
                  <TableCell className={t.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{t.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(t.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedTransaction.category?.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Date: {new Date(selectedTransaction.date).toLocaleDateString()}
                  </div>
                  <div className={`text-2xl font-bold ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}
                    {selectedTransaction.amount.toFixed(2)} {selectedTransaction.account?.currency}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Account:</strong> {selectedTransaction.account?.name}</div>
                    <div><strong>Type:</strong> {selectedTransaction.type}</div>
                    {selectedTransaction.description && (
                      <div><strong>Description:</strong> {selectedTransaction.description}</div>
                    )}
                    {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                      <div>
                        <strong>Tags:</strong>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {selectedTransaction.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
