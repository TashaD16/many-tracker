import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { budgetsService, categoriesService } from '../services/supabaseService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const Budgets = () => {
  const { user } = useSupabaseAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    period: 'month',
    limit: ''
  });

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchCategories();
    }
  }, [user]);

  const fetchBudgets = async () => {
    try {
      const data = await budgetsService.getAll();
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAll({ type: 'expense' });
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = (budget = null) => {
    if (budget) {
      setEditing(budget.id);
      setFormData({
        categoryId: budget.categoryId,
        period: budget.period,
        limit: budget.limit.toString()
      });
    } else {
      setEditing(null);
      setFormData({ categoryId: '', period: 'month', limit: '' });
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

      const now = new Date();
      let periodStart, periodEnd;
      
      if (formData.period === 'month') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (formData.period === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      } else {
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      }

      const budgetData = {
        userId: user.id,
        categoryId: formData.categoryId,
        period: formData.period,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        limit: parseFloat(formData.limit)
      };

      if (editing) {
        await budgetsService.update(editing, budgetData);
      } else {
        await budgetsService.create(budgetData);
      }
      handleClose();
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert(error.message || 'Error saving budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetsService.delete(id);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert(error.message || 'Error deleting budget');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Budgets</h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => {
          const percentage = ((budget.spent / budget.limit) * 100);
          return (
            <Card key={budget.id}>
              <CardHeader>
                <CardTitle>{budget.category?.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {budget.period} - {new Date(budget.periodStart).toLocaleDateString()} to {new Date(budget.periodEnd).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {budget.spent.toFixed(2)} / {budget.limit.toFixed(2)}
                  </span>
                  <span className={percentage >= 100 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={getProgressColor(percentage)}
                />
                <p className="text-sm text-muted-foreground">
                  Remaining: {(budget.limit - budget.spent).toFixed(2)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpen(budget)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update budget limit and period' : 'Set a spending limit for a category'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                required
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
    </div>
  );
};

export default Budgets;
