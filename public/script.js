document.addEventListener('DOMContentLoaded', function () {
    const generateButton = document.getElementById('generate-key-button');
    const keyContainer = document.getElementById('generated-key-container');
    const keyTextDisplay = document.getElementById('key-display');
    const copyButton = document.getElementById('copy-button');
    const countdownText = document.getElementById('countdown-text');
    const totalKeysDisplay = document.getElementById('total-keys');
    
    let cooldown = false;

    // Fetch total keys count to display on the page
    function fetchTotalKeys() {
        fetch('http://localhost:3000/get-total-keys')
            .then(response => response.json())
            .then(data => {
                totalKeysDisplay.textContent = `Total Keys: ${data.totalKeys}`;
            })
            .catch(error => {
                console.error('Error fetching total keys:', error);
                totalKeysDisplay.textContent = 'Error fetching total keys.';
            });
    }

    // Check if the current IP already has a key
    function checkForExistingKey() {
        fetch('http://localhost:3000/get-key')
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        console.warn('No key found for this IP.');
                        return null;
                    }
                    throw new Error('Failed to fetch key');
                }
                return response.json();
            })
            .then(data => {
                if (data) {
                    keyTextDisplay.textContent = `${data.key}`;
                    keyContainer.style.display = 'block';
                    const remainingTime = Math.max(0, Math.floor((data.expiration - Date.now()) / 1000));
                    countdown(remainingTime);
                } else {
                    keyContainer.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error checking for existing key:', error);
            });
    }

    // Handle key generation (only one key allowed per IP)
    generateButton.onclick = function () {
        if (cooldown) {
            alert('Please wait for the cooldown period to finish.');
            return;
        }

        cooldown = true;
        countdownText.textContent = 'Generating key, please wait...';

        setTimeout(() => {
            // First, check if the user already has a key
            fetch('http://localhost:3000/get-key')
                .then(response => response.json())
                .then(data => {
                    if (data && data.key) {
                        alert('You already have a key. Replacing the existing one.');
                    }
                    
                    // Generate a new key and save it
                    fetch('http://localhost:3000/save-key', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            key: generateRandomKey(),
                            expiration: Date.now() + 30000,  // 30 seconds expiration
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message === 'Key saved successfully') {
                                keyTextDisplay.textContent = `Your key: ${data.key}`;
                                keyContainer.style.display = 'block';
                                countdown(30);  // Start countdown for the key expiration
                                fetchTotalKeys();  // Update total key count
                            } else {
                                keyContainer.style.display = 'none';
                                alert('Failed to generate key.');
                            }
                        })
                        .catch(error => {
                            console.error('Error generating key:', error);
                            alert('Failed to generate key.');
                        })
                        .finally(() => {
                            setTimeout(() => {
                                cooldown = false;
                                countdownText.textContent = '';
                            }, 3000); // Reset cooldown after 3 seconds
                        });
                })
                .catch(error => {
                    console.error('Error checking for existing key:', error);
                });
        }, 1000);  // Delay for cooldown simulation
    };

    // Copy key to clipboard
    copyButton.onclick = function () {
        const keyText = keyTextDisplay.textContent.trim();
        if (keyText) {
            navigator.clipboard.writeText(keyText)
                .then(() => alert('Key copied to clipboard!'))
                .catch(err => {
                    console.error('Error copying text:', err);
                    alert('Failed to copy the key.');
                });
        } else {
            alert('No key to copy!');
        }
    };

    // Generate a random key (16 characters)
    function generateRandomKey() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length: 16 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    }

    // Countdown for the key expiration
    function countdown(seconds) {
        let remaining = seconds;
        const interval = setInterval(() => {
            countdownText.textContent = `Key expires in ${remaining} seconds.`;
            if (--remaining < 0) {
                clearInterval(interval);
                keyContainer.style.display = 'none';
                countdownText.textContent = '';
            }
        }, 1000);
    }

    // Initial fetches
    fetchTotalKeys();
    checkForExistingKey();
});
