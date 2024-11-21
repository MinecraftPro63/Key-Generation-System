document.addEventListener('DOMContentLoaded', function () {
    const validateButton = document.getElementById('validate-key-button');
    const validationResult = document.getElementById('validation-result');

    // Handle key validation
    validateButton.onclick = function () {
        const keyInput = document.getElementById('key-input').value;
        validateKey(keyInput, validationResult);
    };
});

// Function to validate a key by making a request to the backend
function validateKey(key, validationResult) {
    console.log('Validating key:', key);
    
    fetch('http://localhost:3000/validate-key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: key }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            validationResult.textContent = 'Key is valid!';
        } else {
            validationResult.textContent = 'Key is invalid or expired!';
        }
    })
    .catch(error => {
        console.error('Error validating key:', error);
        validationResult.textContent = 'Error validating key.';
    });
}
