/**
 * SmartBudget — Personal Finance & Expense Tracker
 * Interactive state management, Chart.js visual analytics,
 * dynamic filtering, data persistence, and animations.
 */

// --- Category Configuration ---
const CATEGORIES = {
  'Food & Dining': { icon: '🍔', color: '#f97316' },
  Shopping: { icon: '🛍️', color: '#ec4899' },
  'Housing & Bills': { icon: '🏠', color: '#3b82f6' },
  Transportation: { icon: '🚗', color: '#14b8a6' },
  Entertainment: { icon: '🎮', color: '#a855f7' },
  Healthcare: { icon: '💊', color: '#10b981' },
  Education: { icon: '📚', color: '#6366f1' },
  Other: { icon: '🏷️', color: '#64748b' }
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: '$',
  AUD: '$'
};

// --- Application State ---
const STORAGE_KEY = 'smartbudget_app_data_v2';

let state = {
  budget: 0,
  expenses: [],
  currency: 'INR',
  theme: 'dark'
};

let editingExpenseId = null;
let categoryChartInstance = null;
let lastDeletedExpense = null;
let undoToastTimeout = null;

// --- DOM Element References ---
const dom = {
  // Theme & Currency
  html: document.documentElement,
  themeToggle: document.getElementById('theme-toggle'),
  currencySelect: document.getElementById('currency-select'),
  demoDataBtn: document.getElementById('demo-data-btn'),
  resetBtn: document.getElementById('reset-btn'),

  // Metric Overview Cards
  amount: document.getElementById('amount'),
  expenditureValue: document.getElementById('expenditure-value'),
  balanceValue: document.getElementById('balance-amount'),
  currencySymbols: document.querySelectorAll('.currency-symbol'),
  budgetPrefix: document.getElementById('budget-prefix'),
  expensePrefix: document.getElementById('expense-prefix'),
  budgetStatusText: document.getElementById('budget-status-text'),
  expenseCountBadge: document.getElementById('expense-count-badge'),
  balanceStatusBadge: document.getElementById('balance-status-badge'),
  budgetPercentText: document.getElementById('budget-percent-text'),
  budgetProgressFill: document.getElementById('budget-progress-fill'),

  // Budget Input Form
  totalAmountInput: document.getElementById('total-amount'),
  totalAmountButton: document.getElementById('total-amount-button'),
  budgetError: document.getElementById('budget-error'),
  quickBudgetChips: document.querySelectorAll('[data-add-budget]'),

  // Expense Input Form
  expenseFormCard: document.getElementById('expense-form-card'),
  productTitleInput: document.getElementById('product-title'),
  userAmountInput: document.getElementById('user-amount'),
  expenseCategorySelect: document.getElementById('expense-category'),
  expenseDateInput: document.getElementById('expense-date'),
  checkAmountButton: document.getElementById('check-amount'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  productTitleError: document.getElementById('product-title-error'),
  editingIndicator: document.getElementById('editing-indicator'),
  addBtnText: document.getElementById('add-btn-text'),
  addBtnIcon: document.getElementById('add-btn-icon'),
  presetChips: document.querySelectorAll('.preset-btn'),

  // Analytics & Charts
  chartCanvas: document.getElementById('category-chart'),
  chartEmpty: document.getElementById('chart-empty'),
  categoryBreakdownList: document.getElementById('category-breakdown-list'),
  topCategoryIndicator: document.getElementById('top-category-indicator'),

  // Filters & List
  searchExpenseInput: document.getElementById('search-expense'),
  clearSearchBtn: document.getElementById('clear-search'),
  categoryFilterSelect: document.getElementById('category-filter'),
  sortFilterSelect: document.getElementById('sort-filter'),
  exportCsvBtn: document.getElementById('export-csv-btn'),
  listContainer: document.getElementById('list'),
  emptyState: document.getElementById('empty-state'),

  // Toasts & Modal
  toastContainer: document.getElementById('toast-container'),
  confirmModal: document.getElementById('confirm-modal'),
  modalCancelBtn: document.getElementById('modal-cancel-btn'),
  modalConfirmBtn: document.getElementById('modal-confirm-btn')
};

// --- Storage Functions ---
const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (err) {
    console.warn('Could not load saved state from localStorage:', err);
  }
};

const saveState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save state to localStorage:', err);
  }
};

// --- Formatters & Helpers ---
const getCurrencySymbol = () => CURRENCY_SYMBOLS[state.currency] || '$';

const formatAmount = (num) => {
  const symbol = getCurrencySymbol();
  const formatted = Number(num).toLocaleString(undefined, {
    minimumFractionDigits: state.currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: state.currency === 'JPY' ? 0 : 2
  });
  return `${symbol} ${formatted}`;
};

const formatShortAmount = (num) => {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: state.currency === 'JPY' ? 0 : 2
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Smooth animated number counter
const animateCounter = (element, start, end, duration = 400) => {
  const startTime = performance.now();
  const diff = end - start;

  const updateNumber = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round((start + diff * easeProgress) * 100) / 100;

    element.innerText = formatShortAmount(currentVal);

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.innerText = formatShortAmount(end);
    }
  };

  requestAnimationFrame(updateNumber);
};

// --- Toast Notifications ---
const showToast = (message, type = 'info', actionBtn = null) => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-solid fa-circle-check',
    danger: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  const iconHtml = `<i class="${iconMap[type] || iconMap.info} toast-icon"></i>`;
  const textHtml = `<span>${message}</span>`;
  toast.innerHTML = `${iconHtml}${textHtml}`;

  if (actionBtn) {
    const actionEl = document.createElement('button');
    actionEl.className = 'btn-ghost';
    actionEl.style.padding = '4px 8px';
    actionEl.style.fontSize = '0.75rem';
    actionEl.style.marginLeft = '8px';
    actionEl.innerText = actionBtn.text;
    actionEl.addEventListener('click', () => {
      actionBtn.onClick();
      toast.remove();
    });
    toast.appendChild(actionEl);
  }

  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Trigger celebratory confetti
const triggerCelebration = () => {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
};

// --- Theme Management ---
const applyTheme = (theme) => {
  state.theme = theme;
  dom.html.setAttribute('data-theme', theme);
  saveState();

  // Re-render chart if active to adapt text color for dark/light
  if (categoryChartInstance) {
    updateChart(getFilteredExpenses());
  }
};

dom.themeToggle.addEventListener('click', () => {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
});

// --- Currency Management ---
const applyCurrency = (currencyCode) => {
  state.currency = currencyCode;
  const symbol = getCurrencySymbol();

  dom.currencySymbols.forEach((el) => {
    el.innerText = symbol;
  });
  dom.budgetPrefix.innerText = symbol;
  dom.expensePrefix.innerText = symbol;

  saveState();
  renderDashboard();
};

dom.currencySelect.addEventListener('change', (e) => {
  applyCurrency(e.target.value);
  showToast(`Currency updated to ${e.target.value} (${getCurrencySymbol()})`, 'info');
});

// --- Metric & Budget Health Calculations ---
const calculateTotals = () => {
  const totalExpenses = state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remainingBalance = state.budget - totalExpenses;
  const percentUsed = state.budget > 0 ? (totalExpenses / state.budget) * 100 : 0;

  return { totalExpenses, remainingBalance, percentUsed };
};

const updateOverviewMetrics = () => {
  const { totalExpenses, remainingBalance, percentUsed } = calculateTotals();

  // Animated counters
  const currentBudget = parseFloat(dom.amount.innerText.replace(/,/g, '')) || 0;
  const currentExpenses = parseFloat(dom.expenditureValue.innerText.replace(/,/g, '')) || 0;
  const currentBalance = parseFloat(dom.balanceValue.innerText.replace(/,/g, '')) || 0;

  animateCounter(dom.amount, currentBudget, state.budget);
  animateCounter(dom.expenditureValue, currentExpenses, totalExpenses);
  animateCounter(dom.balanceValue, currentBalance, remainingBalance);

  // Transaction count badge
  const count = state.expenses.length;
  dom.expenseCountBadge.innerText = `${count} ${count === 1 ? 'Transaction' : 'Transactions'}`;

  // Progress Bar & Health Status
  const clampedPercent = Math.min(Math.round(percentUsed), 100);
  dom.budgetProgressFill.style.width = `${state.budget > 0 ? clampedPercent : 0}%`;
  dom.budgetPercentText.innerText = `${Math.round(percentUsed)}%`;

  // Status text & colors
  dom.budgetProgressFill.classList.remove('fill-warning', 'fill-danger');
  dom.balanceStatusBadge.classList.remove('badge-success', 'badge-warning', 'badge-danger');

  if (state.budget === 0) {
    dom.budgetStatusText.innerText = 'Set your monthly limit';
    dom.balanceStatusBadge.className = 'badge badge-warning';
    dom.balanceStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Budget Unset';
  } else if (percentUsed > 100) {
    dom.budgetStatusText.innerText = 'Limit exceeded!';
    dom.budgetProgressFill.classList.add('fill-danger');
    dom.balanceStatusBadge.className = 'badge badge-danger';
    dom.balanceStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Over Budget!';
  } else if (percentUsed >= 80) {
    dom.budgetStatusText.innerText = 'Approaching monthly limit';
    dom.budgetProgressFill.classList.add('fill-warning');
    dom.balanceStatusBadge.className = 'badge badge-warning';
    dom.balanceStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Caution (>80%)';
  } else {
    dom.budgetStatusText.innerText = 'Within healthy limit';
    dom.balanceStatusBadge.className = 'badge badge-success';
    dom.balanceStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> On Track';
  }
};

// --- Chart.js Visual Analytics ---
const initOrUpdateChart = (categoryTotals) => {
  const categories = Object.keys(categoryTotals);
  const dataValues = categories.map((cat) => categoryTotals[cat]);
  const backgroundColors = categories.map(
    (cat) => (CATEGORIES[cat] ? CATEGORIES[cat].color : '#64748b')
  );

  const isDark = state.theme === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  if (!categoryChartInstance) {
    const ctx = dom.chartCanvas.getContext('2d');
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: isDark ? '#121826' : '#ffffff',
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(18, 24, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw || 0;
                return ` ${label}: ${formatAmount(val)}`;
              }
            }
          }
        }
      }
    });
  } else {
    categoryChartInstance.data.labels = categories;
    categoryChartInstance.data.datasets[0].data = dataValues;
    categoryChartInstance.data.datasets[0].backgroundColor = backgroundColors;
    categoryChartInstance.data.datasets[0].borderColor = isDark ? '#121826' : '#ffffff';
    categoryChartInstance.options.plugins.tooltip.backgroundColor = isDark
      ? 'rgba(18, 24, 38, 0.95)'
      : 'rgba(255, 255, 255, 0.95)';
    categoryChartInstance.options.plugins.tooltip.titleColor = textColor;
    categoryChartInstance.options.plugins.tooltip.bodyColor = textColor;
    categoryChartInstance.update();
  }
};

const updateChart = (expenses) => {
  if (!expenses || expenses.length === 0) {
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }
    dom.chartCanvas.style.display = 'none';
    dom.chartEmpty.classList.remove('hide');
    dom.categoryBreakdownList.innerHTML = '';
    dom.topCategoryIndicator.innerText = 'No expenses to analyze';
    return;
  }

  dom.chartCanvas.style.display = 'block';
  dom.chartEmpty.classList.add('hide');

  // Compute category totals
  const categoryTotals = {};
  let totalSpent = 0;

  expenses.forEach((item) => {
    const cat = item.category || 'Other';
    const amt = Number(item.amount);
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalSpent += amt;
  });

  initOrUpdateChart(categoryTotals);

  // Render breakdown bars list
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    const topCat = sortedCategories[0];
    const topPercent = Math.round((topCat[1] / totalSpent) * 100);
    dom.topCategoryIndicator.innerText = `Top: ${topCat[0]} (${topPercent}%)`;
  }

  dom.categoryBreakdownList.innerHTML = '';
  sortedCategories.forEach(([catName, catAmount]) => {
    const percent = Math.round((catAmount / totalSpent) * 100);
    const catConfig = CATEGORIES[catName] || { icon: '🏷️', color: '#64748b' };

    const itemEl = document.createElement('div');
    itemEl.className = 'category-breakdown-item';
    itemEl.innerHTML = `
      <div class="cat-item-top">
        <div class="cat-name-icon">
          <span>${catConfig.icon}</span>
          <span>${catName}</span>
        </div>
        <div class="cat-amount-percent">
          <span>${formatAmount(catAmount)}</span>
          <span style="font-size: 0.74rem; margin-left: 4px;">(${percent}%)</span>
        </div>
      </div>
      <div class="cat-progress-track">
        <div class="cat-progress-bar" style="width: ${percent}%; background-color: ${catConfig.color};"></div>
      </div>
    `;
    dom.categoryBreakdownList.appendChild(itemEl);
  });
};

// --- Filtering & Sorting Expenses ---
const getFilteredExpenses = () => {
  let list = [...state.expenses];

  // Search filter (title)
  const searchQuery = dom.searchExpenseInput.value.trim().toLowerCase();
  if (searchQuery) {
    list = list.filter((item) => item.title.toLowerCase().includes(searchQuery));
  }

  // Category filter
  const selectedCat = dom.categoryFilterSelect.value;
  if (selectedCat && selectedCat !== 'ALL') {
    list = list.filter((item) => item.category === selectedCat);
  }

  // Sorting
  const sortType = dom.sortFilterSelect.value;
  list.sort((a, b) => {
    if (sortType === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortType === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortType === 'amount-desc') return Number(b.amount) - Number(a.amount);
    if (sortType === 'amount-asc') return Number(a.amount) - Number(b.amount);
    if (sortType === 'title-asc') return a.title.localeCompare(b.title);
    return 0;
  });

  return list;
};

// --- Render Expense List ---
const renderExpenseList = () => {
  const filtered = getFilteredExpenses();
  dom.listContainer.innerHTML = '';

  if (filtered.length === 0) {
    dom.emptyState.classList.remove('hide');
    return;
  }

  dom.emptyState.classList.add('hide');

  filtered.forEach((item) => {
    const catConfig = CATEGORIES[item.category] || { icon: '🏷️', color: '#64748b' };
    const itemEl = document.createElement('div');
    itemEl.className = 'expense-item';
    itemEl.id = `expense-item-${item.id}`;

    itemEl.innerHTML = `
      <div class="item-left">
        <div class="item-category-icon" style="color: ${catConfig.color}; background: ${catConfig.color}18;">
          ${catConfig.icon}
        </div>
        <div class="item-details">
          <div class="item-title" title="${item.title}">${item.title}</div>
          <div class="item-meta">
            <span class="item-category-tag">${item.category}</span>
            <span>&bull;</span>
            <span>${formatDate(item.date)}</span>
          </div>
        </div>
      </div>
      <div class="item-right">
        <div class="item-amount">-${formatAmount(item.amount)}</div>
        <div class="item-actions">
          <button class="action-btn edit-btn" title="Edit expense" data-edit-id="${item.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="action-btn delete-btn" title="Delete expense" data-delete-id="${item.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;

    // Event listeners for Edit and Delete
    const editBtn = itemEl.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => startEditExpense(item.id));

    const deleteBtn = itemEl.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteExpense(item.id));

    dom.listContainer.appendChild(itemEl);
  });
};

// --- Complete Dashboard Re-render ---
const renderDashboard = () => {
  updateOverviewMetrics();
  renderExpenseList();
  updateChart(state.expenses);
};

// --- Budget Handlers ---
const setBudget = (amount) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    dom.budgetError.classList.remove('hide');
    dom.totalAmountInput.focus();
    return false;
  }

  dom.budgetError.classList.add('hide');
  state.budget = numericAmount;
  dom.totalAmountInput.value = '';
  saveState();
  renderDashboard();

  triggerCelebration();
  showToast(`Monthly budget set to ${formatAmount(state.budget)}`, 'success');
  return true;
};

dom.totalAmountButton.addEventListener('click', () => {
  setBudget(dom.totalAmountInput.value);
});

dom.totalAmountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    setBudget(dom.totalAmountInput.value);
  }
});

// Quick budget increment chips
dom.quickBudgetChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const addVal = parseFloat(chip.dataset.addBudget);
    const newBudget = (state.budget || 0) + addVal;
    setBudget(newBudget);
  });
});

// --- Expense Add / Edit Handlers ---
const startEditExpense = (id) => {
  const item = state.expenses.find((exp) => exp.id === id);
  if (!item) return;

  editingExpenseId = id;
  dom.productTitleInput.value = item.title;
  dom.userAmountInput.value = item.amount;
  dom.expenseCategorySelect.value = item.category || 'Other';
  dom.expenseDateInput.value = item.date || getTodayString();

  // UI state change to editing mode
  dom.editingIndicator.classList.remove('hide');
  dom.cancelEditBtn.classList.remove('hide');
  dom.addBtnText.innerText = 'Save Changes';
  dom.addBtnIcon.className = 'fa-solid fa-floppy-disk';

  dom.expenseFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  dom.productTitleInput.focus();
};

const cancelEditMode = () => {
  editingExpenseId = null;
  dom.productTitleInput.value = '';
  dom.userAmountInput.value = '';
  dom.expenseCategorySelect.value = 'Food & Dining';
  dom.expenseDateInput.value = getTodayString();

  dom.editingIndicator.classList.add('hide');
  dom.cancelEditBtn.classList.add('hide');
  dom.addBtnText.innerText = 'Add Expense';
  dom.addBtnIcon.className = 'fa-solid fa-plus';
  dom.productTitleError.classList.add('hide');
};

dom.cancelEditBtn.addEventListener('click', cancelEditMode);

const saveExpense = () => {
  const title = dom.productTitleInput.value.trim();
  const amount = parseFloat(dom.userAmountInput.value);
  const category = dom.expenseCategorySelect.value;
  const date = dom.expenseDateInput.value || getTodayString();

  if (!title || isNaN(amount) || amount <= 0) {
    dom.productTitleError.classList.remove('hide');
    return false;
  }

  dom.productTitleError.classList.add('hide');

  if (editingExpenseId) {
    // Update existing expense
    const index = state.expenses.findIndex((exp) => exp.id === editingExpenseId);
    if (index !== -1) {
      state.expenses[index] = {
        ...state.expenses[index],
        title,
        amount,
        category,
        date
      };
      showToast(`Updated "${title}"`, 'success');
    }
    cancelEditMode();
  } else {
    // Add new expense
    const newExpense = {
      id: Date.now().toString(),
      title,
      amount,
      category,
      date
    };
    state.expenses.unshift(newExpense);
    showToast(`Added ${formatAmount(amount)} for "${title}"`, 'success');

    // Clear inputs
    dom.productTitleInput.value = '';
    dom.userAmountInput.value = '';
  }

  saveState();
  renderDashboard();
  return true;
};

dom.checkAmountButton.addEventListener('click', saveExpense);

dom.userAmountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveExpense();
  }
});

// Preset buttons (instant add)
dom.presetChips.forEach((btn) => {
  btn.addEventListener('click', () => {
    dom.productTitleInput.value = btn.dataset.title;
    dom.userAmountInput.value = btn.dataset.amount;
    dom.expenseCategorySelect.value = btn.dataset.cat;
    dom.expenseDateInput.value = getTodayString();
    dom.productTitleInput.focus();
    showToast(`Preset loaded: "${btn.dataset.title}". Click Add to confirm!`, 'info');
  });
});

// --- Delete Expense & Undo ---
const deleteExpense = (id) => {
  const itemIndex = state.expenses.findIndex((exp) => exp.id === id);
  if (itemIndex === -1) return;

  lastDeletedExpense = {
    expense: state.expenses[itemIndex],
    index: itemIndex
  };

  state.expenses.splice(itemIndex, 1);
  saveState();
  renderDashboard();

  showToast(`Deleted "${lastDeletedExpense.expense.title}"`, 'warning', {
    text: 'Undo',
    onClick: () => {
      if (lastDeletedExpense) {
        state.expenses.splice(lastDeletedExpense.index, 0, lastDeletedExpense.expense);
        saveState();
        renderDashboard();
        showToast(`Restored "${lastDeletedExpense.expense.title}"`, 'success');
        lastDeletedExpense = null;
      }
    }
  });
};

// --- Live Search, Filter & Sort Listeners ---
dom.searchExpenseInput.addEventListener('input', (e) => {
  if (e.target.value.trim()) {
    dom.clearSearchBtn.classList.remove('hide');
  } else {
    dom.clearSearchBtn.classList.add('hide');
  }
  renderExpenseList();
});

dom.clearSearchBtn.addEventListener('click', () => {
  dom.searchExpenseInput.value = '';
  dom.clearSearchBtn.classList.add('hide');
  renderExpenseList();
});

dom.categoryFilterSelect.addEventListener('change', renderExpenseList);
dom.sortFilterSelect.addEventListener('change', renderExpenseList);

// --- CSV Export ---
const exportToCsv = () => {
  if (state.expenses.length === 0) {
    showToast('No expenses to export!', 'warning');
    return;
  }

  const headers = ['ID', 'Title', 'Category', 'Amount', 'Currency', 'Date'];
  const rows = state.expenses.map((exp) => [
    `"${exp.id}"`,
    `"${exp.title.replace(/"/g, '""')}"`,
    `"${exp.category}"`,
    exp.amount,
    `"${state.currency}"`,
    `"${exp.date}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `smartbudget_export_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Exported expense history to CSV', 'success');
};

dom.exportCsvBtn.addEventListener('click', exportToCsv);

// --- Demo Data Generator ---
const loadDemoData = () => {
  const isINR = state.currency === 'INR';
  const multiplier = isINR ? 1 : 0.05; // Scale for USD/EUR vs INR

  state.budget = isINR ? 60000 : 3000;
  state.expenses = [
    {
      id: 'demo-1',
      title: 'Apartment Maintenance & Electricity',
      amount: isINR ? 9500 : 475,
      category: 'Housing & Bills',
      date: getTodayString()
    },
    {
      id: 'demo-2',
      title: 'Weekly Organic Grocery Basket',
      amount: isINR ? 4200 : 210,
      category: 'Shopping',
      date: getTodayString()
    },
    {
      id: 'demo-3',
      title: 'Dinner & Sushi with Friends',
      amount: isINR ? 2450 : 125,
      category: 'Food & Dining',
      date: getTodayString()
    },
    {
      id: 'demo-4',
      title: 'Monthly Transit Pass',
      amount: isINR ? 1800 : 90,
      category: 'Transportation',
      date: getTodayString()
    },
    {
      id: 'demo-5',
      title: 'Online Cloud Computing Course',
      amount: isINR ? 3600 : 180,
      category: 'Education',
      date: getTodayString()
    },
    {
      id: 'demo-6',
      title: 'Cinema IMAX Tickets & Snacks',
      amount: isINR ? 1200 : 60,
      category: 'Entertainment',
      date: getTodayString()
    },
    {
      id: 'demo-7',
      title: 'Pharmacy Vitamins & Supplements',
      amount: isINR ? 1400 : 70,
      category: 'Healthcare',
      date: getTodayString()
    }
  ];

  saveState();
  renderDashboard();
  triggerCelebration();
  showToast('Loaded demo dataset successfully!', 'success');
};

dom.demoDataBtn.addEventListener('click', loadDemoData);

// --- Reset / Clear All ---
dom.resetBtn.addEventListener('click', () => {
  dom.confirmModal.classList.remove('hide');
});

dom.modalCancelBtn.addEventListener('click', () => {
  dom.confirmModal.classList.add('hide');
});

dom.modalConfirmBtn.addEventListener('click', () => {
  state.budget = 0;
  state.expenses = [];
  cancelEditMode();
  saveState();
  renderDashboard();
  dom.confirmModal.classList.add('hide');
  showToast('All budget and expense data has been reset', 'warning');
});

// Close modal on click outside
dom.confirmModal.addEventListener('click', (e) => {
  if (e.target === dom.confirmModal) {
    dom.confirmModal.classList.add('hide');
  }
});

// --- Initialization ---
const initApp = () => {
  loadState();

  // Set initial inputs
  dom.expenseDateInput.value = getTodayString();
  dom.currencySelect.value = state.currency;
  applyTheme(state.theme || 'dark');
  applyCurrency(state.currency || 'INR');

  renderDashboard();
};

document.addEventListener('DOMContentLoaded', initApp);