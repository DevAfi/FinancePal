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