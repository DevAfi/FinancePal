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
