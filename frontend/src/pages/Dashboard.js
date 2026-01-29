import React, { useState, useEffect } from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { dashboardService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscription через Supabase
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Transaction' },
        () => fetchDashboardData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Transfer' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const dashboardData = await dashboardService.getDashboardData(start, end);
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const expenseChartData = {
    labels: data.expenseCategories.map(c => c.category.name),
    datasets: [{
      data: data.expenseCategories.map(c => c.amount),
      backgroundColor: data.expenseCategories.map(c => c.category.color || '#2196F3')
    }]
  };

  const incomeChartData = {
    labels: data.incomeCategories.map(c => c.category.name),
    datasets: [{
      data: data.incomeCategories.map(c => c.amount),
      backgroundColor: data.incomeCategories.map(c => c.category.color || '#4CAF50')
    }]
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.totalBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.income.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {data.expenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.expenseCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut data={expenseChartData} />
              </div>
            </CardContent>
          </Card>
        )}

        {data.incomeCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Pie data={incomeChartData} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {data.budgetProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.budgetProgress.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{budget.category.name}</span>
                  <span>
                    {budget.spent.toFixed(2)} / {budget.limit.toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className={budget.percentage > 100 ? 'bg-red-500' : ''}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentTransactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{t.category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(t.date).toLocaleDateString()} - {t.account.name}
                  </div>
                </div>
                <div className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
