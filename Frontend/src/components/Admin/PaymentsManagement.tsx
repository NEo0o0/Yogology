"use client";

import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Edit2, Trash2, Eye, CheckCircle, Clock, Download, Loader2 } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { PaymentVerificationModal } from '@/components/admin/PaymentVerificationModal';
import { ManualTransactionModal } from './ManualTransactionModal';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { toast } from 'sonner';

interface Payment {
  id: string;
  date: string;
  memberName: string;
  item: string;
  method: 'cash' | 'transfer';
  amount: number;
  status: 'paid' | 'verified' | 'pending';
  proof_url?: string;
  user_id?: string;
  package_id?: string;
}

interface Expense {
  id: string;
  date: string;
  title: string;
  category: string;
  amount: number;
  note?: string;
}

const mockPayments: Payment[] = [
  { id: '1', date: '2025-12-02', memberName: 'Sarah Thompson', item: 'Unlimited Monthly', method: 'transfer', amount: 2500, status: 'paid' },
  { id: '2', date: '2025-12-05', memberName: 'Michael Chen', item: '10-Class Pack', method: 'cash', amount: 1800, status: 'paid' },
  { id: '3', date: '2025-12-08', memberName: 'Emma Rodriguez', item: 'Drop-in Class', method: 'cash', amount: 400, status: 'paid' },
  { id: '4', date: '2025-12-10', memberName: 'David Kim', item: 'Unlimited Monthly', method: 'transfer', amount: 2500, status: 'verified' },
  { id: '5', date: '2025-12-12', memberName: 'Jessica Lee', item: '20-Class Pack', method: 'transfer', amount: 3200, status: 'paid' },
  { id: '6', date: '2025-12-15', memberName: 'Robert Martinez', item: 'Drop-in Class', method: 'cash', amount: 400, status: 'paid' },
  { id: '7', date: '2025-12-18', memberName: 'Amanda Wilson', item: '5-Class Pack', method: 'transfer', amount: 1000, status: 'verified' },
  { id: '8', date: '2025-12-20', memberName: 'Kevin Patel', item: 'Unlimited Monthly', method: 'cash', amount: 2500, status: 'paid' },
  { id: '9', date: '2025-12-22', memberName: 'Lisa Anderson', item: 'Drop-in Class', method: 'transfer', amount: 400, status: 'paid' },
  { id: '10', date: '2025-12-24', memberName: 'James Taylor', item: '10-Class Pack', method: 'cash', amount: 1800, status: 'verified' },
  // Previous months
  { id: '11', date: '2025-11-15', memberName: 'Sarah Thompson', item: 'Unlimited Monthly', method: 'transfer', amount: 2500, status: 'paid' },
  { id: '12', date: '2025-11-20', memberName: 'David Kim', item: 'Drop-in Class', method: 'cash', amount: 400, status: 'paid' },
  { id: '13', date: '2025-10-10', memberName: 'Emma Rodriguez', item: 'Unlimited Monthly', method: 'transfer', amount: 2500, status: 'paid' },
  // Pending payments for verification
  { id: 'pending1', date: '2025-12-24', memberName: 'Alice Johnson', item: '10-Class Pack', method: 'transfer', amount: 3200, status: 'pending', proof_url: 'payment_slips/alice_20251224.jpg', user_id: 'user123', package_id: 'pkg_3' },
  { id: 'pending2', date: '2025-12-23', memberName: 'Bob Williams', item: '5-Class Pack', method: 'transfer', amount: 1800, status: 'pending', proof_url: 'payment_slips/bob_20251223.jpg', user_id: 'user456', package_id: 'pkg_2' },
];

const mockExpenses: Expense[] = [
  { id: '1', date: '2025-12-03', title: 'Studio Rent', category: 'Rent', amount: 15000, note: 'Monthly rent payment' },
  { id: '2', date: '2025-12-05', title: 'Yoga Mats (10 units)', category: 'Equipment', amount: 3500, note: 'Premium mats from supplier' },
  { id: '3', date: '2025-12-10', title: 'Electricity Bill', category: 'Utilities', amount: 2200 },
  { id: '4', date: '2025-12-12', title: 'Marketing - Facebook Ads', category: 'Marketing', amount: 1500 },
  { id: '5', date: '2025-12-15', title: 'Cleaning Supplies', category: 'Maintenance', amount: 800 },
  { id: '6', date: '2025-12-18', title: 'Instructor Salary - Sarah Chen', category: 'Salaries', amount: 8000 },
  { id: '7', date: '2025-12-20', title: 'Water Bill', category: 'Utilities', amount: 500 },
  { id: '8', date: '2025-12-22', title: 'Website Hosting', category: 'Technology', amount: 600 },
  // Previous months
  { id: '9', date: '2025-11-03', title: 'Studio Rent', category: 'Rent', amount: 15000 },
  { id: '10', date: '2025-11-18', title: 'Instructor Salary - Sarah Chen', category: 'Salaries', amount: 8000 },
];

const expenseCategories = [
  'Rent',
  'Utilities',
  'Salaries',
  'Equipment',
  'Marketing',
  'Maintenance',
  'Technology',
  'Insurance',
  'Supplies',
  'Other'
];

export function PaymentsManagement() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
  const [incomeFilter, setIncomeFilter] = useState<'month' | 'all'>('month');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showManualTransactionModal, setShowManualTransactionModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filter payments for selected month
  const monthlyPayments = useMemo(() => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return (
        paymentDate.getMonth() === selectedMonth &&
        paymentDate.getFullYear() === selectedYear &&
        (payment.status === 'paid' || payment.status === 'verified')
      );
    });
  }, [payments, selectedMonth, selectedYear]);

  // Filter expenses for selected month
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === selectedMonth &&
        expenseDate.getFullYear() === selectedYear
      );
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Calculate totals
  const totalIncome = useMemo(() => {
    return monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [monthlyPayments]);

  const totalExpenses = useMemo(() => {
    return monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [monthlyExpenses]);

  const netProfit = totalIncome - totalExpenses;

  // Income breakdown by method
  const incomeByMethod = useMemo(() => {
    const cash = monthlyPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const transfer = monthlyPayments.filter(p => p.method === 'transfer').reduce((sum, p) => sum + p.amount, 0);
    return { cash, transfer };
  }, [monthlyPayments]);

  // Filter income for display
  const displayedIncome = useMemo(() => {
    if (incomeFilter === 'all') {
      return payments
        .filter(p => p.status === 'paid' || p.status === 'verified')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return monthlyPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [incomeFilter, payments, monthlyPayments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingExpense) {
      // Update existing expense
      setExpenses(prev => prev.map(exp => 
        exp.id === editingExpense.id 
          ? { ...exp, ...expenseForm, amount: parseFloat(expenseForm.amount) }
          : exp
      ));
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: Date.now().toString(),
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        note: expenseForm.note
      };
      setExpenses(prev => [...prev, newExpense]);
    }

    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      amount: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setEditingExpense(null);
    setShowExpenseModal(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      note: expense.note || ''
    });
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      
      // Prepare data based on active tab
      let csvData: string;
      const month = monthNames[selectedMonth];
      const year = selectedYear;
      const filename = `payments_${month.toLowerCase()}_${year}.csv`;
      
      if (activeTab === 'income') {
        // CSV Headers for Income
        const headers = 'Date,Type,Description,User,Amount\n';
        const rows = monthlyPayments.map(payment => {
          const date = formatDate(payment.date);
          const type = 'Income';
          const description = payment.item;
          const user = payment.memberName;
          const amount = payment.amount;
          return `${date},${type},"${description}","${user}",${amount}`;
        }).join('\n');
        csvData = headers + rows;
      } else {
        // CSV Headers for Expenses
        const headers = 'Date,Type,Description,Category,Amount\n';
        const rows = monthlyExpenses.map(expense => {
          const date = formatDate(expense.date);
          const type = 'Expense';
          const description = expense.title;
          const category = expense.category;
          const amount = expense.amount;
          return `${date},${type},"${description}","${category}",${amount}`;
        }).join('\n');
        csvData = headers + rows;
      }
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`CSV exported successfully: ${filename}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header with Month/Year Picker */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-[var(--color-earth-dark)] mb-2">Financial Dashboard</h1>
            <p className="text-[var(--color-stone)]">Track income, expenses, and profitability</p>
          </div>
          
          {/* Month/Year Picker */}
          <MonthYearPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Income Card */}
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                Income
              </span>
            </div>
            <div className="text-3xl text-[var(--color-earth-dark)] mb-2">{formatCurrency(totalIncome)}</div>
            <div className="text-sm text-[var(--color-stone)] mb-3">Total Income</div>
            <div className="text-xs text-[var(--color-stone)] pt-3 border-t border-[var(--color-sand)]">
              Cash: {formatCurrency(incomeByMethod.cash)} | Transfer: {formatCurrency(incomeByMethod.transfer)}
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown size={24} className="text-red-600" />
              </div>
              <span className="text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full">
                Expenses
              </span>
            </div>
            <div className="text-3xl text-[var(--color-earth-dark)] mb-2">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-[var(--color-stone)] mb-3">Total Expenses</div>
            <div className="text-xs text-[var(--color-stone)] pt-3 border-t border-[var(--color-sand)]">
              {monthlyExpenses.length} transactions this month
            </div>
          </div>

          {/* Net Profit Card */}
          <div className={`bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'} flex items-center justify-center`}>
                <Wallet size={24} className={netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'} />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${
                netProfit >= 0 
                  ? 'text-blue-600 bg-blue-100' 
                  : 'text-orange-600 bg-orange-100'
              }`}>
                {netProfit >= 0 ? 'Profit' : 'Loss'}
              </span>
            </div>
            <div className={`text-3xl mb-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </div>
            <div className="text-sm text-[var(--color-stone)] mb-3">Net Profit</div>
            <div className="text-xs text-[var(--color-stone)] pt-3 border-t border-[var(--color-sand)]">
              {netProfit >= 0 ? 'Positive' : 'Negative'} cash flow
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-[var(--color-sand)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('income')}
              className={`px-6 py-3 border-b-2 transition-all duration-300 ${
                activeTab === 'income'
                  ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Income History
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-3 border-b-2 transition-all duration-300 ${
                activeTab === 'expenses'
                  ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Expense Management
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Add Manual Transaction Button */}
            {activeTab === 'income' && (
              <button
                onClick={() => setShowManualTransactionModal(true)}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                <span className="text-sm">Add Transaction</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isExporting || (activeTab === 'income' ? monthlyPayments.length === 0 : monthlyExpenses.length === 0)}
              className="bg-white hover:bg-[var(--color-cream)] text-[var(--color-earth-dark)] border border-[var(--color-sand)] px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span className="text-sm">Export CSV</span>
                </>
              )}
            </button>

            {activeTab === 'income' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIncomeFilter('month')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    incomeFilter === 'month'
                      ? 'bg-[var(--color-sage)] text-white'
                      : 'bg-white text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setIncomeFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    incomeFilter === 'all'
                      ? 'bg-[var(--color-sage)] text-white'
                      : 'bg-white text-[var(--color-stone)] hover:bg-[var(--color-cream)]'
                  }`}
                >
                  All Time
                </button>
              </div>
            )}

            {activeTab === 'expenses' && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                <span>Add Expense</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'income' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-cream)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Member Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Method
                  </th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)]">
                {displayedIncome.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[var(--color-cream)]/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-earth-dark)]">{formatDate(payment.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-earth-dark)]">{payment.memberName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-stone)]">{payment.item}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        payment.method === 'cash'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {payment.method === 'cash' ? 'Cash' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-green-600">{formatCurrency(payment.amount)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayedIncome.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-[var(--color-cream)] mx-auto mb-4 flex items-center justify-center">
                <DollarSign size={40} className="text-[var(--color-sage)]" />
              </div>
              <h3 className="text-xl text-[var(--color-earth-dark)] mb-2">No income records found</h3>
              <p className="text-[var(--color-stone)]">Income transactions will appear here</p>
            </div>
          )}

          {displayedIncome.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--color-sand)] bg-[var(--color-cream)]/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-stone)]">
                  Showing {displayedIncome.length} transactions
                </p>
                <p className="text-sm text-[var(--color-earth-dark)]">
                  Total: <span className="text-green-600">{formatCurrency(displayedIncome.reduce((sum, p) => sum + p.amount, 0))}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-cream)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Category
                  </th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-[var(--color-stone)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)]">
                {monthlyExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((expense) => (
                  <tr key={expense.id} className="hover:bg-[var(--color-cream)]/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-earth-dark)]">{formatDate(expense.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--color-earth-dark)]">{expense.title}</div>
                      {expense.note && (
                        <div className="text-xs text-[var(--color-stone)] mt-1">{expense.note}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-red-600">{formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-[var(--color-sage)]" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {monthlyExpenses.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-[var(--color-cream)] mx-auto mb-4 flex items-center justify-center">
                <Wallet size={40} className="text-[var(--color-sage)]" />
              </div>
              <h3 className="text-xl text-[var(--color-earth-dark)] mb-2">No expenses for this month</h3>
              <p className="text-[var(--color-stone)] mb-4">Start tracking your studio expenses</p>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-300"
              >
                <Plus size={20} />
                <span>Add Your First Expense</span>
              </button>
            </div>
          )}

          {monthlyExpenses.length > 0 && (
            <div className="px-6 py-4 border-t border-[var(--color-sand)] bg-[var(--color-cream)]/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-stone)]">
                  Showing {monthlyExpenses.length} expenses
                </p>
                <p className="text-sm text-[var(--color-earth-dark)]">
                  Total: <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetExpenseForm}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-sand)]">
              <h2 className="text-2xl text-[var(--color-earth-dark)]">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={resetExpenseForm}
                className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  placeholder="e.g., Studio Rent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Amount (฿) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Category *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300 resize-none"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-sand)]">
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Plus size={20} />
                  <span>{editingExpense ? 'Update Expense' : 'Add Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      <ManualTransactionModal
        isOpen={showManualTransactionModal}
        onClose={() => setShowManualTransactionModal(false)}
        onSuccess={() => {
          // Refresh payments list - in production, this would refetch from database
          setShowManualTransactionModal(false);
          toast.success('Manual transaction added successfully');
        }}
      />
    </div>
  );
}