let transactions = []
let chart = null

function init() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    document.getElementById('date').valueAsDate = new Date();

    updateUI();
}

window.addEventListener('DOMContentLoaded', init);

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}




// Below is the script for adding a transaction

document.getElementById('transactionForm').addEventListener('submit', function(ev) {
    ev.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value.trim();
    const category = document.getElementById('category').value.trim();
    const date = document.getElementById('date').value.trim();

    if (amount <= 0 || isNaN(amount)) {
        alert('You must enter a valid amount');
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        date
    };

    transactions.push(transaction);

saveTransactions();
updateUI();

this.reset();
document.getElementById('date').valueAsDate = new Date();
});


// now for finding the total in vs out

function calculateIncome() {
    return transactions.filter(t => t.type === 'income').reduce((total, t) => total + parseFloat(t.amount), 0);
}
function calculateExpenses() {
    return transactions.filter(t => t.type === 'expense').reduce((total, t) => total + parseFloat(t.amount), 0);
}
function calculateBalance() {
    return calculateIncome() - calculateExpenses();
}

//

function updateSummary() {
    const income = calculateIncome();
    const expenses = calculateExpenses();
    const balance = calculateBalance();
    
    document.getElementById('totalIncome').textContent = `£${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `£${expenses.toFixed(2)}`;
    document.getElementById('balance').textContent = `£${balance.toFixed(2)}`;
}


// big one below: displaying the transactions list --------- need to build the html not only random JS

function displayTransactions() {
    const container = document.getElementById('transactionsList');

    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions yet. Add your first one above!</div>';
        return;
    }
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // here is the HTML:
    container.innerHTML = sortedTransactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${formatDate(t.date)}</div>
            </div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}£${t.amount.toFixed(2)}
            </div>
            <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
        </div>
    `).join('');

    //helper function to format dates
    function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}


}

// deleting transactions and updating UI:

function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
}
function updateUI() {
    updateSummary();
    displayTransactions();
    updateChart();
}


// Update or create charts (both of the things)
function updateChart() {
    const incomeCanvas = document.getElementById('incomeChart');
    const expenseCanvas = document.getElementById('expenseChart');
    
    // Update both charts
    updateIncomeChart(incomeCanvas);
    updateExpenseChart(expenseCanvas);
}

// Income chart
function updateIncomeChart(canvas) {
    const ctx = canvas.getContext('2d');
    const income = transactions.filter(t => t.type === 'income');
    
    if (income.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    
    const categoryTotals = {};
    income.forEach(t => {
        if (categoryTotals[t.category]) {
            categoryTotals[t.category] += parseFloat(t.amount);
        } else {
            categoryTotals[t.category] = parseFloat(t.amount);
        }
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    // Destroy existing chart IF IT EXISTS
    if (window.incomeChart && typeof window.incomeChart.destroy === 'function') {
        window.incomeChart.destroy();
    }
    
    window.incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#10b981',
                    '#34d399',
                    '#6ee7b7',
                    '#a7f3d0',
                    '#059669'
                ],
                borderColor: '#0a0a0f',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e8e9ed',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: £${context.parsed.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Expense chart
function updateExpenseChart(canvas) {
    const ctx = canvas.getContext('2d');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    
    const categoryTotals = {};
    expenses.forEach(t => {
        if (categoryTotals[t.category]) {
            categoryTotals[t.category] += parseFloat(t.amount);
        } else {
            categoryTotals[t.category] = parseFloat(t.amount);
        }
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    // Destroy existing chart
    if (window.expenseChart && typeof window.expenseChart.destroy === 'function') {
    window.expenseChart.destroy();
}
    
    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#ef4444',
                    '#f87171',
                    '#fca5a5',
                    '#fecaca',
                    '#dc2626',
                    '#b91c1c',
                    '#991b1b'
                ],
                borderColor: '#0a0a0f',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e8e9ed',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: £${context.parsed.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}