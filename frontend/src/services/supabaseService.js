import { supabase } from '../lib/supabase';

// Transactions Service
export const transactionsService = {
  getAll: async (filters = {}) => {
    let query = supabase
      .from('Transaction')
      .select(`
        *,
        account:Account(*),
        category:Category(*)
      `)
      .order('date', { ascending: false });

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.categoryId) {
      query = query.eq('categoryId', filters.categoryId);
    }
    if (filters.accountId) {
      query = query.eq('accountId', filters.accountId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('Transaction')
      .select(`
        *,
        account:Account(*),
        category:Category(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (transaction) => {
    const { data, error } = await supabase
      .from('Transaction')
      .insert(transaction)
      .select(`
        *,
        account:Account(*),
        category:Category(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('Transaction')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        account:Account(*),
        category:Category(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('Transaction')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Real-time subscription
  subscribe: (callback) => {
    return supabase
      .channel('transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Transaction' },
        callback
      )
      .subscribe();
  }
};

// Accounts Service
export const accountsService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('Account')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('Account')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (account) => {
    const { data, error } = await supabase
      .from('Account')
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('Account')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('Account')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Categories Service
export const categoriesService = {
  getAll: async (filters = {}) => {
    let query = supabase
      .from('Category')
      .select('*')
      .order('name', { ascending: true });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  create: async (category) => {
    const { data, error } = await supabase
      .from('Category')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('Category')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('Category')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Budgets Service
export const budgetsService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('Budget')
      .select(`
        *,
        category:Category(*)
      `)
      .order('periodStart', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (budget) => {
    const { data, error } = await supabase
      .from('Budget')
      .insert(budget)
      .select(`
        *,
        category:Category(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('Budget')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:Category(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('Budget')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Transfers Service
export const transfersService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('Transfer')
      .select(`
        *,
        fromAccount:Account!Transfer_fromAccountId_fkey(*),
        toAccount:Account!Transfer_toAccountId_fkey(*)
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (transfer) => {
    const { data, error } = await supabase
      .from('Transfer')
      .insert(transfer)
      .select(`
        *,
        fromAccount:Account!Transfer_fromAccountId_fkey(*),
        toAccount:Account!Transfer_toAccountId_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }
};

// Currency Service
export const currencyService = {
  getRates: async () => {
    const { data, error } = await supabase
      .from('CurrencyRate')
      .select('*')
      .order('updatedAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  getRate: async (from, to) => {
    if (from === to) {
      return { rate: 1, fromCurrency: from, toCurrency: to };
    }

    const { data, error } = await supabase
      .from('CurrencyRate')
      .select('*')
      .eq('fromCurrency', from.toUpperCase())
      .eq('toCurrency', to.toUpperCase())
      .order('updatedAt', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      // Try reverse
      const { data: reverseData } = await supabase
        .from('CurrencyRate')
        .select('*')
        .eq('fromCurrency', to.toUpperCase())
        .eq('toCurrency', from.toUpperCase())
        .order('updatedAt', { ascending: false })
        .limit(1)
        .single();

      if (reverseData) {
        return {
          rate: 1 / reverseData.rate,
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase()
        };
      }

      throw new Error('Exchange rate not found');
    }

    return data;
  },

  convert: async (amount, from, to) => {
    if (from === to) {
      return { amount, converted: amount, from, to, rate: 1 };
    }

    const rateData = await currencyService.getRate(from, to);
    const converted = amount * rateData.rate;

    return {
      amount,
      converted,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: rateData.rate
    };
  }
};

// Dashboard Service
export const dashboardService = {
  getDashboardData: async (startDate, endDate) => {
    // Get accounts
    const { data: accounts } = await supabase
      .from('Account')
      .select('*');

    const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0) || 0;

    // Get transactions
    const { data: transactions } = await supabase
      .from('Transaction')
      .select(`
        *,
        category:Category(*),
        account:Account(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;

    // Category breakdown
    const expenseCategories = {};
    const incomeCategories = {};

    transactions?.forEach(t => {
      const catId = t.categoryId;
      if (t.type === 'expense') {
        if (!expenseCategories[catId]) {
          expenseCategories[catId] = { category: t.category, amount: 0 };
        }
        expenseCategories[catId].amount += t.amount;
      } else {
        if (!incomeCategories[catId]) {
          incomeCategories[catId] = { category: t.category, amount: 0 };
        }
        incomeCategories[catId].amount += t.amount;
      }
    });

    // Recent transactions
    const recentTransactions = transactions?.slice(0, 10) || [];

    // Budget progress
    const { data: budgets } = await supabase
      .from('Budget')
      .select(`
        *,
        category:Category(*)
      `)
      .lte('periodStart', endDate)
      .gte('periodEnd', startDate);

    const budgetProgress = await Promise.all(
      (budgets || []).map(async (budget) => {
        const { data: spentTransactions } = await supabase
          .from('Transaction')
          .select('amount')
          .eq('categoryId', budget.categoryId)
          .eq('type', 'expense')
          .gte('date', budget.periodStart)
          .lte('date', budget.periodEnd);

        const spent = spentTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const percentage = (spent / budget.limit) * 100;

        return {
          ...budget,
          spent,
          percentage: Math.min(percentage, 100),
          remaining: Math.max(budget.limit - spent, 0)
        };
      })
    );

    return {
      totalBalance,
      income,
      expenses,
      netIncome: income - expenses,
      period: { start: startDate, end: endDate },
      expenseCategories: Object.values(expenseCategories),
      incomeCategories: Object.values(incomeCategories),
      recentTransactions,
      budgetProgress,
      accounts: accounts || []
    };
  }
};
