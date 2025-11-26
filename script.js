const API_KEY = '846e3793661e201185468086099cb9f2';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const citySearchInput = document.getElementById('city-search');
const searchBtn = document.getElementById('search-btn');
const currentLocBtn = document.getElementById('current-loc-btn');
const currentWeatherDisplay = document.getElementById('current-weather-display');
const forecastContainer = document.getElementById('forecast-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const logoutModal = document.getElementById('logout-modal');
const confirmLogoutBtn = document.getElementById('confirm-logout');
const cancelLogoutBtn = document.getElementById('cancel-logout');
const authVisibleItems = document.querySelectorAll('.auth-visible');
const authHiddenItems = document.querySelectorAll('.auth-hidden');
const userNameDisplay = document.getElementById('user-name-display');
const userEmailDisplay = document.getElementById('user-email-display');
const userMemberSinceDisplay = document.getElementById('user-member-since');
const userLocationDisplay = document.getElementById('user-location');
const savedLocationsList = document.getElementById('saved-locations');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Modal Elements
const successModal = document.getElementById('success-modal');
const errorModal = document.getElementById('error-modal');
const successTitle = document.getElementById('success-title');
const successMessage = document.getElementById('success-message');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');
const successOkBtn = document.getElementById('success-ok-btn');
const errorOkBtn = document.getElementById('error-ok-btn');

// State
let isLoggedIn = false;
let currentUser = null;
let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

// Initialization
function init() {
    checkAuth();
    renderSavedLocations();

    // Only load weather if user is logged in
    if (isLoggedIn) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
                () => fetchWeatherByCity('London')
            );
        } else {
            fetchWeatherByCity('London');
        }
    }
}

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        if (target === 'login' && isLoggedIn) return;
        if (item.id === 'logout-btn') {
            showLogoutModal();
            return;
        }

        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        setActivePage(target);
    });
});

function setActivePage(targetId) {
    navItems.forEach(nav => {
        if (nav.getAttribute('data-target') === targetId) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    pages.forEach(page => {
        if (page.id === targetId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
}

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Weather Logic
searchBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
        showErrorModal(
            'Login Required',
            'You are not logged in. Please login to know the weather cast.',
            true
        );
        return;
    }
    const city = citySearchInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

citySearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (!isLoggedIn) {
            showErrorModal(
                'Login Required',
                'You are not logged in. Please login to know the weather cast.',
                true
            );
            return;
        }
        const city = citySearchInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

currentLocBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
        showErrorModal(
            'Login Required',
            'You are not logged in. Please login to know the weather cast.',
            true
        );
        return;
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
            (error) => alert('Unable to retrieve your location')
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
});

async function fetchWeatherByCity(city) {
    showLoader();
    try {
        const currentRes = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastRes = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);

        if (!currentRes.ok || !forecastRes.ok) throw new Error('City not found');

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        saveLocation(currentData.name);
    } catch (error) {
        showError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoader();
    try {
        const currentRes = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const forecastRes = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        if (!currentRes.ok || !forecastRes.ok) throw new Error('Weather data unavailable');

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        updateCurrentWeather(currentData);
        updateForecast(forecastData);
    } catch (error) {
        showError(error.message);
    }
}

function updateCurrentWeather(data) {
    const { name, main, weather, wind, sys } = data;
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@4x.png`;

    currentWeatherDisplay.innerHTML = `
        <h2 style="font-size: 2rem; margin-bottom: 1rem;">${name}, ${sys.country}</h2>
        <div class="weather-main">
            <div class="weather-icon">
                <img src="${iconUrl}" alt="${weather[0].description}">
            </div>
            <div class="weather-temp">${Math.round(main.temp)}°</div>
            <div class="weather-desc" style="font-size: 1.5rem; text-transform: capitalize;">${weather[0].description}</div>
        </div>
        <div class="weather-details">
            <div class="detail-box">
                <i class="fa-solid fa-temperature-half"></i>
                <p>Feels Like</p>
                <strong>${Math.round(main.feels_like)}°</strong>
            </div>
            <div class="detail-box">
                <i class="fa-solid fa-droplet"></i>
                <p>Humidity</p>
                <strong>${main.humidity}%</strong>
            </div>
            <div class="detail-box">
                <i class="fa-solid fa-wind"></i>
                <p>Wind</p>
                <strong>${wind.speed} m/s</strong>
            </div>
            <div class="detail-box">
                <i class="fa-solid fa-eye"></i>
                <p>Visibility</p>
                <strong>${(data.visibility / 1000).toFixed(1)} km</strong>
            </div>
        </div>
    `;
}

function updateForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <h4>${dayName}</h4>
            <img src="${iconUrl}" alt="${day.weather[0].description}">
            <p style="font-size: 1.2rem; font-weight: bold;">${Math.round(day.main.temp)}°</p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${day.weather[0].main}</p>
        `;
        forecastContainer.appendChild(card);
    });
}

function showLoader() {
    currentWeatherDisplay.innerHTML = '<div class="loader" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--secondary-color); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 2rem auto;"></div>';
}

function showError(msg) {
    currentWeatherDisplay.innerHTML = `<div class="error-msg" style="color: #ff6b6b; text-align: center;"><i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>${msg}</p></div>`;
}

// Modal Functions
function showSuccessModal(title, message, onOk) {
    successTitle.textContent = title;
    successMessage.textContent = message;
    successModal.classList.add('show');

    successOkBtn.onclick = () => {
        successModal.classList.remove('show');
        if (onOk) onOk();
    };
}

function showErrorModal(title, message, redirectToLogin = false) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;

    if (redirectToLogin) {
        errorOkBtn.textContent = 'Login';
    } else {
        errorOkBtn.textContent = 'OK';
    }

    errorModal.classList.add('show');

    errorOkBtn.onclick = () => {
        errorModal.classList.remove('show');
        if (redirectToLogin) {
            setActivePage('login');
        }
    };
}

// Auth Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = registeredUsers.find(u => u.email === email && u.password === password);

    if (user) {
        isLoggedIn = true;
        currentUser = {
            name: user.name,
            email: user.email,
            location: user.location,
            memberSince: user.memberSince
        };

        updateAuthUI();
        loginForm.reset();

        showSuccessModal(
            'Login Successful!',
            `Your login has been successful. Now you are WELCOME to SkyCast...Welcome ${user.name}!`,
            () => setActivePage('home')
        );
    } else {
        showErrorModal(
            'Login Failed',
            'Your details are not matched with your register. Please try again.'
        );
    }
});

// Register Logic
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const location = document.getElementById('register-location').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showErrorModal(
            'Password Mismatch',
            'Passwords do not match. Please make sure both passwords are the same.'
        );
        return;
    }

    const existingUser = registeredUsers.find(u => u.email === email);

    if (existingUser) {
        showErrorModal(
            'Registration Failed',
            'An account with this email already exists. Please login.',
            true
        );
        return;
    }

    const newUser = {
        name: name,
        email: email,
        location: location,
        password: password,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };

    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    registerForm.reset();

    showSuccessModal(
        'Registration Successful!',
        'Your registration has been successful! Please login with your credentials.',
        () => setActivePage('login')
    );
});

// Toggle between Login and Register
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    setActivePage('register');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    setActivePage('login');
});

function showLogoutModal() {
    logoutModal.classList.add('show');
}

cancelLogoutBtn.addEventListener('click', () => {
    logoutModal.classList.remove('show');
});

confirmLogoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    currentUser = null;
    logoutModal.classList.remove('show');
    updateAuthUI();
    setActivePage('home');
});

function updateAuthUI() {
    if (isLoggedIn) {
        authVisibleItems.forEach(el => el.style.display = 'none');
        authHiddenItems.forEach(el => el.style.display = 'block');
        userNameDisplay.textContent = currentUser.name;
        userEmailDisplay.textContent = currentUser.email;
        if (userMemberSinceDisplay) userMemberSinceDisplay.textContent = currentUser.memberSince;
        if (userLocationDisplay) userLocationDisplay.textContent = currentUser.location;
    } else {
        authVisibleItems.forEach(el => el.style.display = 'block');
        authHiddenItems.forEach(el => el.style.display = 'none');
    }
}

function checkAuth() {
    updateAuthUI();
}

// Location Management
function saveLocation(city) {
    if (!savedLocations.includes(city)) {
        savedLocations.push(city);
        if (savedLocations.length > 5) savedLocations.shift();
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        renderSavedLocations();
    }
}

function renderSavedLocations() {
    if (savedLocations.length === 0) {
        savedLocationsList.innerHTML = '<p>No saved locations yet.</p>';
        return;
    }

    savedLocationsList.innerHTML = '';
    savedLocations.forEach(city => {
        const div = document.createElement('div');
        div.className = 'detail-item';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <span class="value"><i class="fa-solid fa-location-dot"></i> ${city}</span>
            <span class="label" style="font-size: 0.8rem; color: var(--primary-color);">View</span>
        `;
        div.addEventListener('click', () => {
            fetchWeatherByCity(city);
            setActivePage('home');
        });
        savedLocationsList.appendChild(div);
    });
}

// Start
init();

// Add global spin animation for loader
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);
