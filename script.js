let transactions = [];
let budgets = {};
let charts = {
    income: null,
    expense: null,
    trend: null,
    monthly: null
};

function init() {
  const savedTransactions = localStorage.getItem("transactions");
  if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);
  }
  
  const savedBudgets = localStorage.getItem("budgets");
  if (savedBudgets) {
    budgets = JSON.parse(savedBudgets);
  }
  
  document.getElementById("date").valueAsDate = new Date();
  
  // Initialize event listeners
  initializeEventListeners();
  updateUI();
}

function initializeEventListeners() {
  // Analytics timeframe change
  const analyticsTimeframe = document.getElementById('analyticsTimeframe');
  if (analyticsTimeframe) {
    analyticsTimeframe.addEventListener('change', function() {
      updateAnalytics();
    });
  }
  
  // Export data button
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  
  // Budget modal controls
  const setBudgetBtn = document.getElementById('setBudgetBtn');
  if (setBudgetBtn) {
    setBudgetBtn.addEventListener('click', openBudgetModal);
  }
  
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeBudgetModal);
  }
  
  const budgetForm = document.getElementById('budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', saveBudgets);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('budgetModal');
    if (modal && event.target === modal) {
      closeBudgetModal();
    }
  });
}

window.addEventListener("DOMContentLoaded", init);

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Below is the script for adding a transaction

document
  .getElementById("transactionForm")
  .addEventListener("submit", function (ev) {
    ev.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value.trim();
    const category = document.getElementById("category").value.trim();
    const date = document.getElementById("date").value.trim();

    if (amount <= 0 || isNaN(amount)) {
      alert("You must enter a valid amount");
      return;
    }

    const transaction = {
      id: Date.now(),
      description,
      amount,
      type,
      category,
      date,
    };

    transactions.push(transaction);

    saveTransactions();
    updateUI();

    this.reset();
    document.getElementById("date").valueAsDate = new Date();
  });

// now for finding the total in vs out

function calculateIncome() {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + parseFloat(t.amount), 0);
}
function calculateExpenses() {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((total, t) => total + parseFloat(t.amount), 0);
}
function calculateBalance() {
  return calculateIncome() - calculateExpenses();
}

//

function updateSummary() {
  const income = calculateIncome();
  const expenses = calculateExpenses();
  const balance = calculateBalance();

  document.getElementById("totalIncome").textContent = `£${income.toFixed(2)}`;
  document.getElementById("totalExpenses").textContent = `£${expenses.toFixed(
    2
  )}`;
  document.getElementById("balance").textContent = `£${balance.toFixed(2)}`;
}

// big one below: displaying the transactions list --------- need to build the html not only random JS

function displayTransactions() {
  const container = document.getElementById("transactionsList");

  if (transactions.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No transactions yet. Add your first one above!</div>';
    return;
  }
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // here is the HTML:
  container.innerHTML = sortedTransactions
    .map(
      (t) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${formatDate(
        t.date
      )}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === "income" ? "+" : "-"}£${t.amount.toFixed(2)}
            </div>
            <button class="btn-delete" onclick="deleteTransaction(${
              t.id
            })">Delete</button>
        </div>
    `
    )
    .join("");

  //helper function to format dates
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  }
}

// deleting transactions and updating UI:

function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this transaction?")) {
    return;
  }
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  updateUI();
}

function updateUI() {
  updateSummary();
  displayTransactions();
  updateChart();
  updateAnalytics();
  updateBudgetDisplay();
  checkBudgetAlerts();
}

// Update or create charts (both of the things)
function updateChart() {
  const incomeCanvas = document.getElementById("incomeChart");
  const expenseCanvas = document.getElementById("expenseChart");

  // Update both charts
  updateIncomeChart(incomeCanvas);
  updateExpenseChart(expenseCanvas);
}

// Income chart
function updateIncomeChart(canvas) {
  const ctx = canvas.getContext("2d");
  const income = transactions.filter((t) => t.type === "income");

  if (income.length === 0) {
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";

  const categoryTotals = {};
  income.forEach((t) => {
    if (categoryTotals[t.category]) {
      categoryTotals[t.category] += parseFloat(t.amount);
    } else {
      categoryTotals[t.category] = parseFloat(t.amount);
    }
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  // Destroy existing chart IF IT EXISTS
  if (charts.income && typeof charts.income.destroy === "function") {
    charts.income.destroy();
  }

  charts.income = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: [
            "#10b981",
            "#34d399",
            "#6ee7b7",
            "#a7f3d0",
            "#059669",
          ],
          borderColor: "#0a0a0f",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e8e9ed",
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: £${context.parsed.toFixed(2)}`;
            },
          },
        },
      },
    },
  });
}

// Expense chart
function updateExpenseChart(canvas) {
  const ctx = canvas.getContext("2d");
  const expenses = transactions.filter((t) => t.type === "expense");

  if (expenses.length === 0) {
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";

  const categoryTotals = {};
  expenses.forEach((t) => {
    if (categoryTotals[t.category]) {
      categoryTotals[t.category] += parseFloat(t.amount);
    } else {
      categoryTotals[t.category] = parseFloat(t.amount);
    }
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  // Destroy existing chart
  if (charts.expense && typeof charts.expense.destroy === "function") {
    charts.expense.destroy();
  }

  charts.expense = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: [
            "#ef4444",
            "#f87171",
            "#fca5a5",
            "#fecaca",
            "#dc2626",
            "#b91c1c",
            "#991b1b",
          ],
          borderColor: "#0a0a0f",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e8e9ed",
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: £${context.parsed.toFixed(2)}`;
            },
          },
        },
      },
    },
  });
}

// exporting data

function exportToCSV() {
  if (transactions.length === 0) {
    alert("No transactions to export!");
    return;
  }

  let csv = "Date,Description,Category,Type,Amount\n";

  transactions.forEach((t) => {
    csv += `${t.date},${t.description},${t.category},${
      t.type
    },£${t.amount.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ======================== ADVANCED ANALYTICS ========================

function updateAnalytics() {
    updateFinancialHealthScore();
    updateTrendChart();
    updateMonthlyChart();
}

// Financial Health Score Calculation
function updateFinancialHealthScore() {
    if (transactions.length === 0) {
        document.getElementById('healthScore').textContent = '0';
        document.getElementById('savingsRate').textContent = '0%';
        document.getElementById('expenseStability').textContent = 'No Data';
        document.getElementById('categoryBalance').textContent = 'No Data';
        return;
    }

    const income = calculateIncome();
    const expenses = calculateExpenses();
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    // Calculate expense stability (lower variance = more stable)
    const monthlyExpenses = getMonthlyExpenses();
    const expenseStability = calculateStability(monthlyExpenses);
    
    // Calculate category balance (how well distributed expenses are)
    const categoryBalance = calculateCategoryBalance();
    
    // Overall health score (0-100)
    let healthScore = 0;
    
    // Savings rate component (40 points max)
    if (savingsRate >= 20) healthScore += 40;
    else if (savingsRate >= 10) healthScore += 30;
    else if (savingsRate >= 0) healthScore += 20;
    else healthScore += 0; // Negative savings
    
    // Expense stability component (30 points max)
    if (expenseStability === 'Excellent') healthScore += 30;
    else if (expenseStability === 'Good') healthScore += 20;
    else if (expenseStability === 'Fair') healthScore += 10;
    
    // Category balance component (30 points max)
    if (categoryBalance === 'Excellent') healthScore += 30;
    else if (categoryBalance === 'Good') healthScore += 20;
    else if (categoryBalance === 'Fair') healthScore += 10;
    
    // Update UI
    document.getElementById('healthScore').textContent = Math.round(healthScore);
    document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
    document.getElementById('expenseStability').textContent = expenseStability;
    document.getElementById('categoryBalance').textContent = categoryBalance;
    
    // Update score circle gradient
    const scoreCircle = document.querySelector('.score-circle');
    const percentage = healthScore;
    scoreCircle.style.background = `conic-gradient(from 0deg, #8b5cf6 0%, #8b5cf6 ${percentage}%, rgba(139, 92, 246, 0.2) ${percentage}%)`;
}

function getMonthlyExpenses() {
    const monthlyData = {};
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += parseFloat(transaction.amount);
    });
    
    return Object.values(monthlyData);
}

function calculateStability(monthlyExpenses) {
    if (monthlyExpenses.length < 2) return 'No Data';
    
    const mean = monthlyExpenses.reduce((sum, val) => sum + val, 0) / monthlyExpenses.length;
    const variance = monthlyExpenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyExpenses.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    if (coefficientOfVariation < 0.2) return 'Excellent';
    if (coefficientOfVariation < 0.4) return 'Good';
    if (coefficientOfVariation < 0.6) return 'Fair';
    return 'Poor';
}

function calculateCategoryBalance() {
    const expensesByCategory = {};
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
        if (!expensesByCategory[transaction.category]) {
            expensesByCategory[transaction.category] = 0;
        }
        expensesByCategory[transaction.category] += parseFloat(transaction.amount);
    });
    
    const categoryValues = Object.values(expensesByCategory);
    if (categoryValues.length === 0) return 'No Data';
    
    const totalExpenses = categoryValues.reduce((sum, val) => sum + val, 0);
    const maxCategoryPercentage = Math.max(...categoryValues) / totalExpenses;
    
    if (maxCategoryPercentage < 0.4) return 'Excellent';
    if (maxCategoryPercentage < 0.6) return 'Good';
    if (maxCategoryPercentage < 0.8) return 'Fair';
    return 'Poor';
}

// Income vs Expenses Trend Chart
function updateTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const timeframe = document.getElementById('analyticsTimeframe')?.value || '1year';
    const filteredTransactions = filterTransactionsByTimeframe(transactions, timeframe);
    
    const monthlyData = getMonthlyTrendData(filteredTransactions);
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e8e9ed'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#e8e9ed' },
                    grid: { color: 'rgba(139, 92, 246, 0.1)' }
                },
                y: {
                    ticks: { 
                        color: '#e8e9ed',
                        callback: function(value) {
                            return '£' + value.toFixed(0);
                        }
                    },
                    grid: { color: 'rgba(139, 92, 246, 0.1)' }
                }
            }
        }
    });
}

// Monthly Spending Patterns Chart
function updateMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const timeframe = document.getElementById('analyticsTimeframe')?.value || '1year';
    const filteredTransactions = filterTransactionsByTimeframe(transactions, timeframe);
    
    const categoryData = getMonthlyCategoryData(filteredTransactions);
    
    if (charts.monthly) {
        charts.monthly.destroy();
    }
    
    charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoryData.labels,
            datasets: categoryData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e8e9ed'
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#e8e9ed' },
                    grid: { color: 'rgba(139, 92, 246, 0.1)' },
                    stacked: true
                },
                y: {
                    ticks: { 
                        color: '#e8e9ed',
                        callback: function(value) {
                            return '£' + value.toFixed(0);
                        }
                    },
                    grid: { color: 'rgba(139, 92, 246, 0.1)' },
                    stacked: true
                }
            }
        }
    });
}

function filterTransactionsByTimeframe(transactions, timeframe) {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeframe) {
        case '3months':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
        case '6months':
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
        case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'all':
            return transactions;
    }
    
    return transactions.filter(t => new Date(t.date) >= cutoffDate);
}

function getMonthlyTrendData(transactions) {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthKey].income += parseFloat(transaction.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(transaction.amount);
        }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
        labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        }),
        income: sortedMonths.map(month => monthlyData[month].income),
        expenses: sortedMonths.map(month => monthlyData[month].expenses)
    };
}

function getMonthlyCategoryData(transactions) {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const monthlyData = {};
    const categories = [...new Set(expenseTransactions.map(t => t.category))];
    
    expenseTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
            categories.forEach(cat => monthlyData[monthKey][cat] = 0);
        }
        
        monthlyData[monthKey][transaction.category] += parseFloat(transaction.amount);
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    
    const datasets = categories.map((category, index) => ({
        label: category,
        data: sortedMonths.map(month => monthlyData[month][category] || 0),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1
    }));
    
    return {
        labels: sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        }),
        datasets
    };
}

// Export Data Functionality
function exportData() {
    const data = {
        transactions: transactions,
        budgets: budgets,
        exportDate: new Date().toISOString(),
        summary: {
            totalIncome: calculateIncome(),
            totalExpenses: calculateExpenses(),
            balance: calculateBalance(),
            transactionCount: transactions.length
        }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financepal-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ======================== BUDGET MANAGEMENT ========================

function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const categoriesContainer = document.getElementById('budgetCategories');
    
    if (!modal || !categoriesContainer) return;
    
    // Get all unique expense categories
    const expenseCategories = [...new Set(
        transactions.filter(t => t.type === 'expense').map(t => t.category)
    )];
    
    // Add default categories if no transactions exist
    const defaultCategories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'];
    const allCategories = [...new Set([...expenseCategories, ...defaultCategories])];
    
    categoriesContainer.innerHTML = allCategories.map(category => `
        <div class="budget-category-item">
            <span class="budget-category-label">${category}</span>
            <input type="number" 
                   class="budget-input" 
                   data-category="${category}" 
                   value="${budgets[category] || ''}" 
                   placeholder="0.00" 
                   step="0.01" 
                   min="0">
        </div>
    `).join('');
    
    modal.style.display = 'block';
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveBudgets(event) {
    event.preventDefault();
    
    const inputs = document.querySelectorAll('.budget-input');
    inputs.forEach(input => {
        const category = input.dataset.category;
        const amount = parseFloat(input.value) || 0;
        if (amount > 0) {
            budgets[category] = amount;
        } else {
            delete budgets[category];
        }
    });
    
    localStorage.setItem('budgets', JSON.stringify(budgets));
    closeBudgetModal();
    updateBudgetDisplay();
}

function updateBudgetDisplay() {
    const container = document.getElementById('budgetsList');
    if (!container) return;
    
    const budgetCategories = Object.keys(budgets);
    
    if (budgetCategories.length === 0) {
        container.innerHTML = '<div class="empty-state">No budgets set. Click "Set Budgets" to get started!</div>';
        return;
    }
    
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    container.innerHTML = budgetCategories.map(category => {
        const budgetAmount = budgets[category];
        const spent = getSpentInCategory(category, monthStart, monthEnd);
        const percentage = (spent / budgetAmount) * 100;
        const remaining = budgetAmount - spent;
        
        let statusClass = 'status-good';
        let progressClass = '';
        
        if (percentage >= 100) {
            statusClass = 'status-danger';
            progressClass = 'danger';
        } else if (percentage >= 80) {
            statusClass = 'status-warning';
            progressClass = 'warning';
        }
        
        const status = percentage >= 100 ? 'Over Budget' : 
                      percentage >= 80 ? 'Near Limit' : 'On Track';
        
        return `
            <div class="budget-item">
                <div class="budget-header-info">
                    <span class="budget-category">${category}</span>
                    <span class="budget-amount">£${budgetAmount.toFixed(2)}</span>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>£${spent.toFixed(2)} spent</span>
                        <span>£${Math.max(remaining, 0).toFixed(2)} left</span>
                    </div>
                </div>
                <div class="budget-status ${statusClass}">${status}</div>
            </div>
        `;
    }).join('');
}

function getSpentInCategory(category, startDate, endDate) {
    return transactions
        .filter(t => 
            t.type === 'expense' && 
            t.category === category &&
            new Date(t.date) >= startDate &&
            new Date(t.date) <= endDate
        )
        .reduce((total, t) => total + parseFloat(t.amount), 0);
}

// Budget Alerts and Notifications
function checkBudgetAlerts() {
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    Object.keys(budgets).forEach(category => {
        const budgetAmount = budgets[category];
        const spent = getSpentInCategory(category, monthStart, monthEnd);
        const percentage = (spent / budgetAmount) * 100;
        
        // Check if we should show an alert
        if (percentage >= 100) {
            showBudgetNotification(category, 'danger', 'Budget Exceeded!', 
                `You've spent £${spent.toFixed(2)} of your £${budgetAmount.toFixed(2)} ${category} budget this month.`);
        } else if (percentage >= 80) {
            showBudgetNotification(category, 'warning', 'Budget Alert!', 
                `You've used ${percentage.toFixed(1)}% of your ${category} budget this month.`);
        }
    });
}

function showBudgetNotification(category, type, title, message) {
    // Check if we've already shown this alert recently (to avoid spam)
    const alertKey = `alert_${category}_${type}_${new Date().getMonth()}`;
    if (localStorage.getItem(alertKey)) {
        return;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `budget-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-header">
                <strong>${title}</strong>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 8000);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Mark as shown for this month
    localStorage.setItem(alertKey, 'shown');
}

function removeNotification(notification) {
    notification.classList.add('hide');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Interactive cursor effect
document.addEventListener('DOMContentLoaded', function() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    
    const cursorTrail = document.createElement('div');
    cursorTrail.className = 'cursor-trail';
    document.body.appendChild(cursorTrail);
    
    let mouseX = 0;
    let mouseY = 0;
    let trailX = 0;
    let trailY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursor.style.left = mouseX - 10 + 'px';
        cursor.style.top = mouseY - 10 + 'px';
    });
    
    // Smooth trail animation
    function animateTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;
        
        cursorTrail.style.left = trailX - 4 + 'px';
        cursorTrail.style.top = trailY - 4 + 'px';
        
        requestAnimationFrame(animateTrail);
    }
    animateTrail();
    
    // Scale cursor on hover over interactive elements
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('button, .card, .transaction-item, .budget-item, .chart-item')) {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.background = 'rgba(139, 92, 246, 0.6)';
        } else {
            cursor.style.transform = 'scale(1)';
            cursor.style.background = 'rgba(139, 92, 246, 0.3)';
        }
    });
});