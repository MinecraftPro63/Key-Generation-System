let keyCount = 0;  // Counter for keys generated

// DOM elements
const keysList = document.getElementById('keys-list');

// Simulated IP address (this should be fetched from the user's IP in a real-world scenario)
const userIP = "192.168.0.1";  // Simulated IP address

// Function to add a key to the list
function addKey(key, expirationTime) {
    const remainingTime = calculateTimeLeft(expirationTime);
    
    // Create a new table row with key details
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${key}</td>
        <td>${remainingTime}</td>
        <td>Active</td>
        <td><button class="copy-button" onclick="copyKey('${key}')">Copy</button></td>
    `;
    
    keysList.appendChild(row);
}

// Function to copy the key
function copyKey(key) {
    const tempInput = document.createElement('input');
    tempInput.value = key;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

// Function to calculate the remaining time in the format of hours, minutes, and seconds
function calculateTimeLeft(expirationTime) {
    const now = new Date();
    const timeDiff = expirationTime - now;

    if (timeDiff <= 0) {
        return "Expired";
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Load keys from localStorage (this simulates fetching them from the server linked with the IP)
window.onload = function() {
    const storedKeys = JSON.parse(localStorage.getItem(userIP)) || [];

    storedKeys.forEach(keyData => {
        addKey(keyData.key, new Date(keyData.expirationTime));
    });
}

// Simulated function to generate a key (in keygen.html, you would store these in localStorage or a database)
function generateKey() {
    const newKey = `Key-${Math.random().toString(36).substr(2, 8)}`;
    const expirationTime = new Date(Date.now() + 60 * 60 * 1000);  // 1 hour expiration

    // Store the key in localStorage with the user's IP
    const storedKeys = JSON.parse(localStorage.getItem(userIP)) || [];
    storedKeys.push({ key: newKey, expirationTime: expirationTime });
    localStorage.setItem(userIP, JSON.stringify(storedKeys));

    // Refresh the keys on the dashboard
    addKey(newKey, expirationTime);
}
