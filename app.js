// DOM Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// Navigation Elements
const navProfile = document.getElementById('nav-profile');
const navRate = document.getElementById('nav-rate');
const navCards = document.getElementById('nav-cards');
const profileTab = document.getElementById('profile-tab');
const rateTab = document.getElementById('rate-tab');
const cardsTab = document.getElementById('cards-tab');

// Profile Elements
const profileName = document.getElementById('profile-name');
const profileNickname = document.getElementById('profile-nickname');
const profilePhoto = document.getElementById('profile-photo');
const saveProfileButton = document.getElementById('save-profile');

// Rating Elements
const playerSelect = document.getElementById('player-select');
const ratingForm = document.getElementById('rating-form');
const ratingPlayerName = document.getElementById('rating-player-name');
const submitRatingButton = document.getElementById('submit-rating');

// Cards Elements
const generateCardsButton = document.getElementById('generate-cards');
const cardsContainer = document.getElementById('cards-container');

// Global Variables
let currentUser = null;
let allPlayers = [];
let currentRatingPlayer = null;

// Authentication State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        loadUserProfile();
        loadPlayerList();
    } else {
        currentUser = null;
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
        resetForms();
    }
});

// Authentication Functions
loginButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Por favor ingresa correo electrónico y contraseña');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            alert(`Error al iniciar sesión: ${error.message}`);
        });
});

registerButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Por favor ingresa correo electrónico y contraseña');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Create an initial profile document
            return db.collection('profiles').doc(userCredential.user.uid).set({
                email: email,
                name: '',
                nickname: '',
                photoUrl: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .catch(error => {
            alert(`Error al registrarse: ${error.message}`);
        });
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// Navigation Functions
navProfile.addEventListener('click', () => showTab('profile'));
navRate.addEventListener('click', () => showTab('rate'));
navCards.addEventListener('click', () => showTab('cards'));

function showTab(tabName) {
    // Update navigation buttons
    navProfile.classList.toggle('active', tabName === 'profile');
    navRate.classList.toggle('active', tabName === 'rate');
    navCards.classList.toggle('active', tabName === 'cards');
    
    // Show/hide tabs
    profileTab.style.display = tabName === 'profile' ? 'block' : 'none';
    rateTab.style.display = tabName === 'rate' ? 'block' : 'none';
    cardsTab.style.display = tabName === 'cards' ? 'block' : 'none';
    
    // Specific actions for each tab
    if (tabName === 'rate') {
        loadPlayerList();
    } else if (tabName === 'cards') {
        // Initially load cards when navigating to cards tab
        loadAllProfiles();
    }
}


// Cargar lista de usuarios
function loadUserList() {
    db.collection('profiles').get()
        .then(snapshot => {
            const userList = document.getElementById('user-list');
            userList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const user = {
                    id: doc.id,
                    ...doc.data()
                };
                
                const userElement = document.createElement('div');
                userElement.innerHTML = `
                    <span>${user.name || user.email}</span>
                    <button class="delete-user-button" data-user-id="${user.id}">Eliminar</button>
                `;
                userList.appendChild(userElement);
            });
        })
        .catch(error => {
            console.error("Error al cargar lista de usuarios:", error);
        });
}

document.getElementById('load-users-button').addEventListener('click', loadUserList);

document.getElementById('nav-admin').addEventListener('click', () => showTab('admin'));

function showTab(tabName) {
    // Update navigation buttons
    navProfile.classList.toggle('active', tabName === 'profile');
    navRate.classList.toggle('active', tabName === 'rate');
    navCards.classList.toggle('active', tabName === 'cards');
    document.getElementById('nav-admin').classList.toggle('active', tabName === 'admin');
    
    // Show/hide tabs
    profileTab.style.display = tabName === 'profile' ? 'block' : 'none';
    rateTab.style.display = tabName === 'rate' ? 'block' : 'none';
    cardsTab.style.display = tabName === 'cards' ? 'block' : 'none';
    adminTab.style.display = tabName === 'admin' ? 'block' : 'none';
    
    // Specific actions for each tab
    if (tabName === 'admin') {
        loadUserList();
    }
}



// Profile Functions
function loadUserProfile() {
    db.collection('profiles').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                profileName.value = data.name || '';
                profileNickname.value = data.nickname || '';
                profilePhoto.value = data.photoUrl || '';
                
                // Cargar atributos promedio
                loadAverageAttributes(currentUser.uid).then(attributes => {
                    document.getElementById('profile-tiro').textContent = attributes.tiro;
                    document.getElementById('profile-pase').textContent = attributes.pase;
                    document.getElementById('profile-tecnica').textContent = attributes.tecnica;
                    document.getElementById('profile-cabezazo').textContent = attributes.cabezazo;
                    document.getElementById('profile-ataque').textContent = attributes.ataque;
                    document.getElementById('profile-defensa').textContent = attributes.defensa;
                    document.getElementById('profile-resistencia').textContent = attributes.resistencia;
                    document.getElementById('profile-arquero').textContent = attributes.arquero;
                    document.getElementById('profile-mentalidad').textContent = attributes.mentalidad;
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar perfil:", error);
        });
}

function loadAverageAttributes(playerId) {
    return db.collection('ratings')
        .where('playerId', '==', playerId)
        .get()
        .then(snapshot => {
            const ratings = snapshot.docs.map(doc => doc.data());
            const averages = calculateAverages(ratings);
            return averages;
        })
        .catch(error => {
            console.error("Error al cargar atributos promedio:", error);
            return {
                tiro: 0, pase: 0, tecnica: 0, cabezazo: 0, ataque: 0,
                defensa: 0, resistencia: 0, arquero: 0, mentalidad: 0
            };
        });
}

function calculateAverages(ratings) {
    if (!ratings.length) return {
        tiro: 0, pase: 0, tecnica: 0, cabezazo: 0, ataque: 0,
        defensa: 0, resistencia: 0, arquero: 0, mentalidad: 0
    };
    
    const attributes = [
        'tiro', 'pase', 'tecnica', 'cabezazo', 'ataque',
        'defensa', 'resistencia', 'arquero', 'mentalidad'
    ];
    
    const sums = {};
    let totalSum = 0;

    // Agregar evento a botones de eliminar usuarios
document.addEventListener('click', event => {
    if (event.target.classList.contains('delete-user-button')) {
        const userId = event.target.getAttribute('data-user-id');
        
        if (confirm(`¿Estás seguro de eliminar al usuario con ID ${userId}?`)) {
            // Eliminar usuario de la base de datos
            db.collection('profiles').doc(userId).delete()
                .then(() => {
                    alert('Usuario eliminado con éxito');
                    loadUserList(); // Recargar lista de usuarios
                })
                .catch(error => {
                    alert(`Error al eliminar usuario: ${error.message}`);
                });
        }
    }
});

    
    // Initialize sums
    attributes.forEach(attr => sums[attr] = 0);
    
    // Calculate sums
    ratings.forEach(rating => {
        attributes.forEach(attr => {
            sums[attr] += rating[attr] || 0;
        });
    });
    
    // Calculate averages
    const averages = {};
    attributes.forEach(attr => {
        averages[attr] = Math.round((sums[attr] / ratings.length) * 10) / 10;
    });
    
    return averages;
}


saveProfileButton.addEventListener('click', () => {
    const profile = {
        name: profileName.value,
        nickname: profileNickname.value,
        photoUrl: profilePhoto.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('profiles').doc(currentUser.uid).update(profile)
        .then(() => {
            alert('¡Perfil guardado exitosamente!');
        })
        .catch(error => {
            alert(`Error al guardar perfil: ${error.message}`);
        });
});

// Rating Functions
function loadPlayerList() {
    db.collection('profiles').get()
        .then(snapshot => {
            // Clear existing options except the placeholder
            playerSelect.innerHTML = '<option value="">Elige un jugador...</option>';
            allPlayers = [];
            
            snapshot.forEach(doc => {
                const player = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // Don't show current user in the list
                if (player.id !== currentUser.uid) {
                    allPlayers.push(player);
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name || player.email;
                    playerSelect.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error("Error al cargar jugadores:", error);
        });
}

playerSelect.addEventListener('change', () => {
    const selectedPlayerId = playerSelect.value;
    
    if (selectedPlayerId) {
        currentRatingPlayer = allPlayers.find(player => player.id === selectedPlayerId);
        ratingPlayerName.textContent = `Calificando: ${currentRatingPlayer.name || currentRatingPlayer.email}`;
        
        // Check if user has already rated this player
        db.collection('ratings')
            .where('raterId', '==', currentUser.uid)
            .where('playerId', '==', selectedPlayerId)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    // Found existing rating, load it
                    const ratingData = snapshot.docs[0].data();
                    document.getElementById('rating-tiro').value = ratingData.tiro;
                    document.getElementById('rating-pase').value = ratingData.pase;
                    document.getElementById('rating-tecnica').value = ratingData.tecnica;
                    document.getElementById('rating-cabezazo').value = ratingData.cabezazo;
                    document.getElementById('rating-ataque').value = ratingData.ataque;
                    document.getElementById('rating-defensa').value = ratingData.defensa;
                    document.getElementById('rating-resistencia').value = ratingData.resistencia;
                    document.getElementById('rating-arquero').value = ratingData.arquero;
                    document.getElementById('rating-mentalidad').value = ratingData.mentalidad;
                    
                    // Update all display values
                    updateAllRatingDisplays();
                } else {
                    // Reset to default values
                    resetRatingForm();
                }
                
                ratingForm.style.display = 'block';
            })
            .catch(error => {
                console.error("Error al verificar calificaciones existentes:", error);
            });
    } else {
        ratingForm.style.display = 'none';
        currentRatingPlayer = null;
    }
});

// Update display values when sliders change
document.querySelectorAll('.rating-slider').forEach(slider => {
    slider.addEventListener('input', event => {
        const valueDisplay = event.target.nextElementSibling;
        valueDisplay.textContent = event.target.value;
    });
});

submitRatingButton.addEventListener('click', () => {
    if (!currentRatingPlayer) {
        alert('Por favor selecciona un jugador para calificar');
        return;
    }
    
    const rating = {
        raterId: currentUser.uid,
        playerId: currentRatingPlayer.id,
        tiro: parseInt(document.getElementById('rating-tiro').value),
        pase: parseInt(document.getElementById('rating-pase').value),
        tecnica: parseInt(document.getElementById('rating-tecnica').value),
        cabezazo: parseInt(document.getElementById('rating-cabezazo').value),
        ataque: parseInt(document.getElementById('rating-ataque').value),
        defensa: parseInt(document.getElementById('rating-defensa').value),
        resistencia: parseInt(document.getElementById('rating-resistencia').value),
        arquero: parseInt(document.getElementById('rating-arquero').value),
        mentalidad: parseInt(document.getElementById('rating-mentalidad').value),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Check if rating already exists
    db.collection('ratings')
        .where('raterId', '==', currentUser.uid)
        .where('playerId', '==', currentRatingPlayer.id)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                // Create new rating
                return db.collection('ratings').add(rating);
            } else {
                // Update existing rating
                return snapshot.docs[0].ref.update(rating);
            }
        })
        .then(() => {
            alert('¡Calificación enviada exitosamente!');
            playerSelect.value = '';
            ratingForm.style.display = 'none';
            currentRatingPlayer = null;
            
            // Actualizar perfil automáticamente
            if (currentUser.uid === currentRatingPlayer.id) {
                loadUserProfile();
            }
        })
        .catch(error => {
            alert(`Error al enviar calificación: ${error.message}`);
        });
});


// Player Cards Functions
generateCardsButton.addEventListener('click', () => {
    loadAllProfiles().then(generateAllCards);
});

function loadAllProfiles() {
    return db.collection('profiles').get()
        .then(snapshot => {
            allPlayers = [];
            snapshot.forEach(doc => {
                allPlayers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return allPlayers;
        })
        .catch(error => {
            console.error("Error al cargar todos los perfiles:", error);
            return [];
        });
}

function generateAllCards() {
    cardsContainer.innerHTML = '';
    
    // For each player, calculate average ratings and generate a card
    allPlayers.forEach(player => {
        db.collection('ratings')
            .where('playerId', '==', player.id)
            .get()
            .then(snapshot => {
                // Calculate average ratings
                const averages = calculateAverages(snapshot.docs.map(doc => doc.data()));
                
                // Create and append player card
                const card = createPlayerCard(player, averages);
                cardsContainer.appendChild(card);
            })
            .catch(error => {
                console.error(`Error al generar tarjeta para ${player.name}:`, error);
            });
    });
}

function calculateAverages(ratings) {
    if (!ratings.length) return {
        tiro: 0, pase: 0, tecnica: 0, cabezazo: 0, ataque: 0,
        defensa: 0, resistencia: 0, arquero: 0, mentalidad: 0,
        overall: 0
    };
    
    const attributes = [
        'tiro', 'pase', 'tecnica', 'cabezazo', 'ataque',
        'defensa', 'resistencia', 'arquero', 'mentalidad'
    ];
    
    const sums = {};
    let totalSum = 0;
    
    // Initialize sums
    attributes.forEach(attr => sums[attr] = 0);
    
    // Calculate sums
    ratings.forEach(rating => {
        attributes.forEach(attr => {
            sums[attr] += rating[attr] || 0;
        });
    });
    
    // Calculate averages
    const averages = {};
    attributes.forEach(attr => {
        averages[attr] = Math.round((sums[attr] / ratings.length) * 10) / 10;
        totalSum += averages[attr];
    });
    
    // Calculate overall rating
    averages.overall = Math.round((totalSum / attributes.length) * 10) / 10;
    
    return averages;
}

function createPlayerCard(player, ratings) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'player-card';
    
    // Determine default image if none provided
    const photoUrl = player.photoUrl || 'https://via.placeholder.com/150';
    
    cardDiv.innerHTML = `
        <div class="card-header">
            <img src="${photoUrl}" alt="${player.name}" class="card-photo">
            <h3>${player.name || 'Jugador'}</h3>
            <p>${player.nickname || ''}</p>
        </div>
        <div class="card-body">
            <div class="card-stats">
                <div class="stat-item">
                    <div class="stat-value">${ratings.tiro}</div>
                    <div class="stat-label">Tiro</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.pase}</div>
                    <div class="stat-label">Pase</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.tecnica}</div>
                    <div class="stat-label">Técnica</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.cabezazo}</div>
                    <div class="stat-label">Cabezazo</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.ataque}</div>
                    <div class="stat-label">Ataque</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.defensa}</div>
                    <div class="stat-label">Defensa</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.resistencia}</div>
                    <div class="stat-label">Resistencia</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.arquero}</div>
                    <div class="stat-label">Arquero</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ratings.mentalidad}</div>
                    <div class="stat-label">Mentalidad</div>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <strong>Calificación General: ${ratings.overall}</strong>
        </div>
    `;
    
    return cardDiv;
}

// Utility Functions
function resetForms() {
    emailInput.value = '';
    passwordInput.value = '';
    profileName.value = '';
    profileNickname.value = '';
    profilePhoto.value = '';
    resetRatingForm();
}

function resetRatingForm() {
    const ratingInputs = document.querySelectorAll('.rating-slider');
    ratingInputs.forEach(input => {
        input.value = 5;
    });
    updateAllRatingDisplays();
}

function updateAllRatingDisplays() {
    document.querySelectorAll('.rating-slider').forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        valueDisplay.textContent = slider.value;
    });
}

// Initialize the app with profile tab shown
showTab('profile');
