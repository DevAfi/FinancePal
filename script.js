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
    const amount = document.getElementById('amount').value.trim();
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

    this.reset();
    document.getElementById(date).valueAsDate = new Date();
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
    const container = document.getElementById('transactionslist');

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