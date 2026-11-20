const ACCOUNTS_KEY = "banking_app_accounts";
const HISTORY_KEY = "banking_app_history";
const MAX_PIN_ATTEMPTS = 3;

function setQuickAmount(inputId, amount) {
    document.getElementById(inputId).value = amount;
}

function getAccounts() {
    try {
        const raw = localStorage.getItem(ACCOUNTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function addTransaction(tx) {
    const history = getHistory();
    history.unshift(tx);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function formatAmount(amt) {
    return Number(amt).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function normalizeName(fname, lname) {
    return `${fname.trim()} ${lname.trim()}`.replace(/\s+/g, ' ');
}

function isValidPin(pin) {
    return /^\d{4}$/.test(pin.trim());
}

function verifyAccountPin(accounts, acc, pin, pinEl) {
    const account = accounts[acc];
    if (account.locked) {
        pinEl.classList.add('error');
        alert(`Account ${acc} is LOCKED due to 3 consecutive wrong PIN attempts! Reset accounts to unlock.`);
        return false;
    }

    if (account.pin !== pin) {
        account.failedAttempts = (account.failedAttempts || 0) + 1;
        const remaining = MAX_PIN_ATTEMPTS - account.failedAttempts;

        if (remaining <= 0) {
            account.locked = true;
            saveAccounts(accounts);
            renderAccounts();
            pinEl.classList.add('error');
            alert(`Incorrect PIN! Account ${acc} has been LOCKED after 3 failed attempts.`);
        } else {
            saveAccounts(accounts);
            pinEl.classList.add('error');
            alert(`Incorrect 4-digit PIN! ${remaining} attempt(s) remaining before lockout.`);
        }
        return false;
    }

    if (account.failedAttempts > 0) {
        account.failedAttempts = 0;
        saveAccounts(accounts);
    }
    return true;
}

function renderAccounts() {
    const listEl = document.getElementById('accounts-list');
    const accounts = getAccounts();
    const accNumbers = Object.keys(accounts);

    if (accNumbers.length === 0) {
        listEl.innerHTML = `<div class="empty-msg">No accounts created yet. Make a deposit to create an account.</div>`;
        return;
    }

    listEl.innerHTML = accNumbers.map(acc => {
        const info = accounts[acc];
        const lockedBadge = info.locked ? `<span class="locked-badge">LOCKED</span>` : '';
        const lockedClass = info.locked ? 'acc-locked' : '';
        return `
            <div class="acc-item ${lockedClass}">
                <strong>Holder:</strong> ${info.name}${lockedBadge}<br>
                <strong>Account:</strong> ${acc}<br>
                <strong>Balance:</strong> ${formatAmount(info.balance)} ETB
            </div>
        `;
    }).join('');
}

function clearHistoryFilter() {
    const filterEl = document.getElementById('history-filter');
    if (filterEl) filterEl.value = '';
    renderHistory();
}

function renderHistory() {
    const listEl = document.getElementById('history-list');
    const filterEl = document.getElementById('history-filter');
    const query = filterEl ? filterEl.value.trim() : '';
    let history = getHistory();

    if (query) {
        history = history.filter(item => {
            if (item.type === 'transfer') {
                return item.senderAcc.includes(query) || item.receiverAcc.includes(query);
            }
            return item.acc.includes(query);
        });
    }

    if (history.length === 0) {
        listEl.innerHTML = query
            ? `<div class="empty-msg">No transactions found for account "${query}".</div>`
            : `<div class="empty-msg">No transactions recorded yet.</div>`;
        return;
    }

    listEl.innerHTML = history.map(item => {
        if (item.type === 'transfer') {
            return `
                <div class="tx-item tx-transfer">
                    <strong>TRANSFER</strong> • ${item.ref}<br>
                    <strong>From:</strong> ${item.sender} (${item.senderAcc})<br>
                    <strong>To:</strong> ${item.receiver} (${item.receiverAcc})<br>
                    <strong>Amount:</strong> ${formatAmount(item.amount)} ETB<br>
                    <small>${item.date}</small>
                </div>
            `;
        }
        const cls = item.type === 'deposit' ? 'tx-deposit' : 'tx-withdraw';
        return `
            <div class="tx-item ${cls}">
                <strong>${item.type.toUpperCase()}</strong> • ${item.ref}<br>
                <strong>Name:</strong> ${item.name} (${item.acc})<br>
                <strong>Amount:</strong> ${formatAmount(item.amount)} ETB<br>
                <small>${item.date}</small>
            </div>
        `;
    }).join('');
}

function resetBankData() {
    if (confirm("Are you sure you want to reset all accounts and transaction history?")) {
        localStorage.removeItem(ACCOUNTS_KEY);
        localStorage.removeItem(HISTORY_KEY);
        clearHistoryFilter();
        renderAccounts();
        renderHistory();
        document.getElementById('receipt').style.display = 'none';
    }
}

function clearErrors() {
    document.querySelectorAll('input').forEach(inp => inp.classList.remove('error'));
}

function showPage(pageId) {
    clearErrors();
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById('receipt').style.display = 'none';
    if (pageId === 'accounts-page') renderAccounts();
    if (pageId === 'history-page') renderHistory();
}

function isValidName(name) {
    const clean = name.trim();
    if (!/^[a-zA-Z\s]{2,}$/.test(clean)) return false;

    const lettersOnly = clean.replace(/\s+/g, '').toLowerCase();
    if (lettersOnly.length < 2) return false;

    if (/^(.)\1+$/.test(lettersOnly) || /(.)\1{2,}/.test(lettersOnly)) {
        return false;
    }

    return true;
}

function isValidAccount(acc) {
    return /^\d{13}$/.test(acc.trim());
}

function generateRef() {
    return "ATM-" + Math.floor(100000 + Math.random() * 900000);
}

function validateForm(type) {
    clearErrors();
    let prefix = type === 'deposit' ? 'd-' : 'w-';
    let fnameEl = document.getElementById(prefix + 'fname');
    let lnameEl = document.getElementById(prefix + 'lname');
    let accEl = document.getElementById(prefix + 'acc');
    let pinEl = document.getElementById(prefix + 'pin');
    let amtEl = document.getElementById(prefix + 'amt');
    let sigEl = document.getElementById(prefix + 'sig');

    let fname = fnameEl.value.trim();
    let lname = lnameEl.value.trim();
    let acc = accEl.value.trim();
    let pin = pinEl.value.trim();
    let amt = parseFloat(amtEl.value);
    let sig = sigEl.value.trim();

    if (!isValidName(fname) || !isValidName(lname)) {
        if (!isValidName(fname)) fnameEl.classList.add('error');
        if (!isValidName(lname)) lnameEl.classList.add('error');
        alert("Please enter a valid name (at least 2 letters, no repeated/dummy letters like 'rrr').");
        return;
    }
    if (!isValidAccount(acc)) {
        accEl.classList.add('error');
        alert("Account number must be exactly 13 digits!");
        return;
    }
    if (!isValidPin(pin)) {
        pinEl.classList.add('error');
        alert("PIN must be exactly 4 digits!");
        return;
    }
    if (isNaN(amt) || amt <= 0 || amt > 5000000) {
        amtEl.classList.add('error');
        alert("Amount must be between 1 and 5,000,000 ETB!");
        return;
    }
    if (sig.length < 3) {
        sigEl.classList.add('error');
        alert("Signature must be at least 3 characters!");
        return;
    }

    const fullName = normalizeName(fname, lname);
    const accounts = getAccounts();

    if (type === 'deposit') {
        if (!accounts[acc]) {
            accounts[acc] = { name: fullName, pin: pin, balance: 0, failedAttempts: 0, locked: false };
        } else {
            if (accounts[acc].name.toLowerCase() !== fullName.toLowerCase()) {
                fnameEl.classList.add('error');
                lnameEl.classList.add('error');
                alert(`Account ${acc} belongs to "${accounts[acc].name}". Please use the matching name!`);
                return;
            }
            if (!verifyAccountPin(accounts, acc, pin, pinEl)) return;
        }

        accounts[acc].balance = Number((accounts[acc].balance + amt).toFixed(2));
        saveAccounts(accounts);
        renderAccounts();

        const now = new Date().toLocaleString();
        const ref = generateRef();

        addTransaction({
            type: 'deposit',
            ref: ref,
            name: accounts[acc].name,
            acc: acc,
            amount: amt,
            date: now
        });

        let receiptHTML = `
            <b>ATM Deposit Successful! ✅</b><br><br>
            <strong>Reference:</strong> ${ref}<br>
            <strong>Type:</strong> DEPOSIT<br>
            <strong>Name:</strong> ${accounts[acc].name}<br>
            <strong>Account:</strong> ${acc}<br>
            <strong>Amount:</strong> ${formatAmount(amt)} ETB<br>
            <strong>Account Balance:</strong> ${formatAmount(accounts[acc].balance)} ETB<br>
            <strong>Signature:</strong> ${sig}<br>
            <strong>Date:</strong> ${now}<br><br>
            Thank you for using our ATM service.
        `;
        document.getElementById('receipt').innerHTML = receiptHTML;
        document.getElementById('receipt').style.display = 'block';
    } else {
        if (!accounts[acc]) {
            accEl.classList.add('error');
            alert(`Account ${acc} not found! Please deposit money into this account first.`);
            return;
        }
        if (accounts[acc].name.toLowerCase() !== fullName.toLowerCase()) {
            fnameEl.classList.add('error');
            lnameEl.classList.add('error');
            alert(`Account ${acc} belongs to "${accounts[acc].name}". Name does not match!`);
            return;
        }
        if (!verifyAccountPin(accounts, acc, pin, pinEl)) return;

        if (amt > accounts[acc].balance) {
            amtEl.classList.add('error');
            alert(`Insufficient balance for ${accounts[acc].name} (${acc})! Available balance: ${formatAmount(accounts[acc].balance)} ETB`);
            return;
        }

        accounts[acc].balance = Number((accounts[acc].balance - amt).toFixed(2));
        saveAccounts(accounts);
        renderAccounts();

        const now = new Date().toLocaleString();
        const ref = generateRef();

        addTransaction({
            type: 'withdraw',
            ref: ref,
            name: accounts[acc].name,
            acc: acc,
            amount: amt,
            date: now
        });

        let receiptHTML = `
            <b>ATM Withdrawal Successful! ✅</b><br><br>
            <strong>Reference:</strong> ${ref}<br>
            <strong>Type:</strong> WITHDRAW<br>
            <strong>Name:</strong> ${accounts[acc].name}<br>
            <strong>Account:</strong> ${acc}<br>
            <strong>Amount:</strong> ${formatAmount(amt)} ETB<br>
            <strong>Remaining Balance:</strong> ${formatAmount(accounts[acc].balance)} ETB<br>
            <strong>Signature:</strong> ${sig}<br>
            <strong>Date:</strong> ${now}<br><br>
            Please collect your cash. Thank you for using our ATM service.
        `;
        document.getElementById('receipt').innerHTML = receiptHTML;
        document.getElementById('receipt').style.display = 'block';
    }

    fnameEl.value = '';
    lnameEl.value = '';
    accEl.value = '';
    pinEl.value = '';
    amtEl.value = '';
    sigEl.value = '';
}

function validateTransfer() {
    clearErrors();
    let fnameEl = document.getElementById('t-fname');
    let lnameEl = document.getElementById('t-lname');
    let accEl = document.getElementById('t-acc');
    let pinEl = document.getElementById('t-pin');
    let rfnameEl = document.getElementById('t-rfname');
    let rlnameEl = document.getElementById('t-rlname');
    let raccEl = document.getElementById('t-racc');
    let amtEl = document.getElementById('t-amt');

    let fname = fnameEl.value.trim();
    let lname = lnameEl.value.trim();
    let acc = accEl.value.trim();
    let pin = pinEl.value.trim();
    let rfname = rfnameEl.value.trim();
    let rlname = rlnameEl.value.trim();
    let racc = raccEl.value.trim();
    let amt = parseFloat(amtEl.value);

    if (!isValidName(fname) || !isValidName(lname)) {
        if (!isValidName(fname)) fnameEl.classList.add('error');
        if (!isValidName(lname)) lnameEl.classList.add('error');
        alert("Please enter a valid Sender name (at least 2 letters, no repeated/dummy letters like 'rrr').");
        return;
    }
    if (!isValidAccount(acc)) {
        accEl.classList.add('error');
        alert("Sender account number must be exactly 13 digits!");
        return;
    }
    if (!isValidPin(pin)) {
        pinEl.classList.add('error');
        alert("Sender 4-digit PIN is required!");
        return;
    }
    if (!isValidName(rfname) || !isValidName(rlname)) {
        if (!isValidName(rfname)) rfnameEl.classList.add('error');
        if (!isValidName(rlname)) rlnameEl.classList.add('error');
        alert("Please enter a valid Receiver name (at least 2 letters, no repeated/dummy letters like 'rrr').");
        return;
    }
    if (!isValidAccount(racc)) {
        raccEl.classList.add('error');
        alert("Receiver account number must be exactly 13 digits!");
        return;
    }
    if (acc === racc) {
        accEl.classList.add('error');
        raccEl.classList.add('error');
        alert("Sender and Receiver account numbers cannot be the same!");
        return;
    }
    if (isNaN(amt) || amt <= 0 || amt > 5000000) {
        amtEl.classList.add('error');
        alert("Amount must be between 1 and 5,000,000 ETB!");
        return;
    }

    const senderName = normalizeName(fname, lname);
    const receiverName = normalizeName(rfname, rlname);
    const accounts = getAccounts();

    if (!accounts[acc]) {
        accEl.classList.add('error');
        alert(`Sender account ${acc} not found! Deposit funds first.`);
        return;
    }
    if (accounts[acc].name.toLowerCase() !== senderName.toLowerCase()) {
        fnameEl.classList.add('error');
        lnameEl.classList.add('error');
        alert(`Sender account ${acc} belongs to "${accounts[acc].name}". Name does not match!`);
        return;
    }
    if (!verifyAccountPin(accounts, acc, pin, pinEl)) return;

    if (amt > accounts[acc].balance) {
        amtEl.classList.add('error');
        alert(`Insufficient balance for transfer! Available balance for ${accounts[acc].name}: ${formatAmount(accounts[acc].balance)} ETB`);
        return;
    }

    if (!accounts[racc]) {
        accounts[racc] = { name: receiverName, pin: "0000", balance: 0, failedAttempts: 0, locked: false };
    } else if (accounts[racc].name.toLowerCase() !== receiverName.toLowerCase()) {
        rfnameEl.classList.add('error');
        rlnameEl.classList.add('error');
        alert(`Receiver account ${racc} belongs to "${accounts[racc].name}". Please check receiver name!`);
        return;
    }

    accounts[acc].balance = Number((accounts[acc].balance - amt).toFixed(2));
    accounts[racc].balance = Number((accounts[racc].balance + amt).toFixed(2));
    saveAccounts(accounts);
    renderAccounts();

    const now = new Date().toLocaleString();
    const ref = generateRef();

    addTransaction({
        type: 'transfer',
        ref: ref,
        sender: accounts[acc].name,
        senderAcc: acc,
        receiver: accounts[racc].name,
        receiverAcc: racc,
        amount: amt,
        date: now
    });

    let receiptHTML = `
        <b>ATM Transfer Successful! ✅</b><br><br>
        <strong>Reference:</strong> ${ref}<br>
        <strong>Sender:</strong> ${accounts[acc].name} (${acc})<br>
        <strong>Sender New Balance:</strong> ${formatAmount(accounts[acc].balance)} ETB<br>
        <strong>Receiver:</strong> ${accounts[racc].name} (${racc})<br>
        <strong>Receiver New Balance:</strong> ${formatAmount(accounts[racc].balance)} ETB<br>
        <strong>Amount:</strong> ${formatAmount(amt)} ETB<br>
        <strong>Date:</strong> ${now}<br><br>
        Transfer completed successfully.
    `;
    document.getElementById('receipt').innerHTML = receiptHTML;
    document.getElementById('receipt').style.display = 'block';

    fnameEl.value = '';
    lnameEl.value = '';
    accEl.value = '';
    pinEl.value = '';
    rfnameEl.value = '';
    rlnameEl.value = '';
    raccEl.value = '';
    amtEl.value = '';
}

renderAccounts();
renderHistory();
