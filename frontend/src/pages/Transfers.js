import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { transfersService, accountsService } from '../services/supabaseService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const Transfers = () => {
  const { user } = useSupabaseAuth();
  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTransfers();
      fetchAccounts();
    }
  }, [user]);

  const fetchTransfers = async () => {
    try {
      const data = await transfersService.getAll();
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await accountsService.getAll();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleOpen = () => {
    setFormData({
      fromAccountId: accounts[0]?.id || '',
      toAccountId: accounts[1]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.fromAccountId === formData.toAccountId) {
      setError('Cannot transfer to the same account');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
      const toAccount = accounts.find(a => a.id === formData.toAccountId);

      if (!fromAccount || !toAccount) {
        setError('Accounts not found');
        return;
      }

      if (fromAccount.currentBalance < parseFloat(formData.amount)) {
        setError('Insufficient balance');
        return;
      }

      let exchangeRate = null;
      let convertedAmount = parseFloat(formData.amount);
      
      if (fromAccount.currency !== toAccount.currency) {
        exchangeRate = 1;
      }

      const transferData = {
        fromUserId: user.id,
        toUserId: user.id,
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: parseFloat(formData.amount),
        exchangeRate,
        date: new Date(formData.date).toISOString(),
        description: formData.description
      };

      await transfersService.create(transferData);
      
      await accountsService.update(fromAccount.id, {
        currentBalance: fromAccount.currentBalance - parseFloat(formData.amount)
      });
      await accountsService.update(toAccount.id, {
        currentBalance: toAccount.currentBalance + convertedAmount
      });

      handleClose();
      fetchTransfers();
      fetchAccounts();
    } catch (error) {
      setError(error.message || 'Error creating transfer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Transfers</h1>
        <Button onClick={handleOpen}>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>{t.fromAccount?.name} ({t.fromAccount?.currency})</TableCell>
                  <TableCell>{t.toAccount?.name} ({t.toAccount?.currency})</TableCell>
                  <TableCell>{t.amount.toFixed(2)}</TableCell>
                  <TableCell>{t.exchangeRate ? t.exchangeRate.toFixed(4) : '-'}</TableCell>
                  <TableCell>{t.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transfer</DialogTitle>
            <DialogDescription>
              Transfer funds between your accounts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={formData.fromAccountId} onValueChange={(value) => setFormData({ ...formData, fromAccountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency}) - Balance: {acc.currentBalance.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={formData.toAccountId} onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency}) - Balance: {acc.currentBalance.toFixed(2)}
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
              <Button type="submit">Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transfers;
