    <!-- Firebase Setup -->
    <script type="module">
        // Import the functions you need from the SDKs you need
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
        
        // Your web app's Firebase configuration
        const firebaseConfig = {
    apiKey: "AIzaSyDj6TSp7nvuLqvQ6CLqJQTxJFHIwHHbtNE",
    authDomain: "matrix-ed062.firebaseapp.com",
    projectId: "matrix-ed062",
    storageBucket: "matrix-ed062.firebasestorage.app",
    messagingSenderId: "82407502701",
    appId: "1:82407502701:web:c1af23c4606c2fcbd86064",
    measurementId: "G-02680ERGSV"
  };


        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Set the server IP
        document.getElementById('server-ip').value = "play.matrix.tech";
        
        // Function to create star rating HTML
        function createStarRating(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += `<i class="fas fa-star ${i <= rating ? 'text-yellow-400' : 'text-gray-500'}"></i>`;
            }
            return stars;
        }
        
        // Generate a unique user ID if not exists
        if (!localStorage.getItem('userId')) {
            localStorage.setItem('userId', Math.random().toString(36).substr(2, 9));
        }
        
        function getUserId() {
            return localStorage.getItem('userId');
        }
        
        // Copy IP functionality
        window.copyIP = async function() {
            const ipInput = document.getElementById('server-ip');
            await navigator.clipboard.writeText(ipInput.value);
            
            const tooltip = document.getElementById('copy-tooltip');
            tooltip.classList.add('show');
            
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
        };
        
        // Toggle like on testimonial
        window.toggleLike = async (testimonialId) => {
            const userId = getUserId();
            const testimonialRef = doc(db, 'testimonials', testimonialId);
            const testimonialDoc = await getDoc(testimonialRef);
            
            if (testimonialDoc.exists()) {
                const likes = testimonialDoc.data().likes || [];
                if (likes.includes(userId)) {
                    await updateDoc(testimonialRef, {
                        likes: arrayRemove(userId)
                    });
                } else {
                    await updateDoc(testimonialRef, {
                        likes: arrayUnion(userId)
                    });
                }
            }
        };
        
        // Toggle comments section
        window.toggleComments = (testimonialId) => {
            const commentsSection = document.getElementById(`comments-${testimonialId}`);
            commentsSection.classList.toggle('hidden');
        };
        
        // Add new comment
        window.addComment = async (testimonialId) => {
            const inputElement = document.getElementById(`comment-input-${testimonialId}`);
            const comment = inputElement.value.trim();
            
            if (comment) {
                const testimonialRef = doc(db, 'testimonials', testimonialId);
                await updateDoc(testimonialRef, {
                    comments: arrayUnion({
                        userId: getUserId(),
                        text: comment,
                        timestamp: new Date().toISOString()
                    })
                });
                
                inputElement.value = '';
            }
        };
        
        // Load testimonials with real-time updates
        function loadTestimonials() {
            const testimonialsContainer = document.getElementById('testimonials-container');
            const q = query(collection(db, 'testimonials'), orderBy('timestamp', 'desc'), limit(6));
            
            onSnapshot(q, (snapshot) => {
                testimonialsContainer.innerHTML = '';
                
                if (snapshot.empty) {
                    testimonialsContainer.innerHTML = `
                        <div class="col-span-2 text-center text-gray-500">
                            No testimonials yet. Be the first to share your experience!
                        </div>
                    `;
                    return;
                }
                
                snapshot.forEach((doc) => {
                    const testimonial = doc.data();
                    const userId = getUserId();
                    const hasLiked = testimonial.likes?.includes(userId);
                    
                    const card = document.createElement('div');
                    card.className = 'server-card p-6 rounded-lg transform transition duration-500 hover:scale-[1.02]';
                    card.innerHTML = `
                        <div class="flex items-center mb-4">
                            <div class="w-10 h-10 bg-green-900 bg-opacity-30 rounded-full flex items-center justify-center text-green-500 mr-3">
                                <i class="fas fa-quote-left"></i>
                            </div>
                            <div>
                                <h4 class="font-medium">${testimonial.username}</h4>
                                <div class="flex text-sm">
                                    ${createStarRating(testimonial.rating)}
                                </div>
                            </div>
                        </div>
                        <p class="text-gray-400 text-sm italic mb-4">
                            "${testimonial.details}"
                        </p>
                        <div class="flex items-center justify-between text-sm">
                            <button onclick="toggleLike('${doc.id}')" class="flex items-center space-x-2 text-gray-400 hover:text-green-400">
                                <i class="fas fa-heart ${hasLiked ? 'text-red-500' : ''}"></i>
                                <span>${testimonial.likes?.length || 0} likes</span>
                            </button>
                            <button onclick="toggleComments('${doc.id}')" class="flex items-center space-x-2 text-gray-400 hover:text-green-400">
                                <i class="fas fa-comment"></i>
                                <span>${testimonial.comments?.length || 0} comments</span>
                            </button>
                        </div>
                        <div id="comments-${doc.id}" class="hidden mt-4">
                            <div class="space-y-2 mb-4" id="comments-list-${doc.id}">
                                ${(testimonial.comments || []).map(comment => `
                                    <div class="bg-gray-800 p-2 rounded">
                                        <p class="text-sm">${comment.text}</p>
                                        <span class="text-xs text-gray-500">${new Date(comment.timestamp).toLocaleDateString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="flex">
                                <input type="text" id="comment-input-${doc.id}" placeholder="Add a comment..." 
                                    class="flex-1 bg-gray-800 rounded-l px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                                <button onclick="addComment('${doc.id}')" 
                                    class="bg-green-500 text-white px-3 py-1 rounded-r text-sm hover:bg-green-600">
                                    Send
                                </button>
                            </div>
                        </div>
                    `;
                    testimonialsContainer.appendChild(card);
                });
            });
        }
        
        // Load Staff with separate sections
        const loadStaff = () => {
            const leadershipContainer = document.getElementById('leadership-container').querySelector('.grid');
            const staffContainer = document.getElementById('staff-container').querySelector('.grid');
            const donatorsContainer = document.getElementById('donators-container');
            const donatorsGrid = donatorsContainer.querySelector('.grid');
            
            let hasDonators = false;
            
            onSnapshot(collection(db, 'staff'), (snapshot) => {
                leadershipContainer.innerHTML = '';
                staffContainer.innerHTML = '';
                donatorsGrid.innerHTML = '';
                
                snapshot.forEach((doc) => {
                    const staff = doc.data();
                    const card = document.createElement('div');
                    card.className = 'staff-card';
                    card.innerHTML = `
                        <div class="flex items-center mb-4">
                            ${staff.image 
                                ? `<img src="${staff.image}" class="staff-image mr-4" alt="${staff.name}">`
                                : `<div class="w-20 h-20 bg-gray-700 rounded-full mr-4 flex items-center justify-center">
                                    <i class="fas fa-user text-3xl text-gray-400"></i>
                                   </div>`
                            }
                            <div>
                                <h3 class="text-xl font-bold">${staff.name}</h3>
                                <p class="text-green-500">${staff.title}</p>
                                <span class="text-sm text-gray-400">${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}</span>
                            </div>
                        </div>
                    `;
                    
                    // Sort into appropriate sections
                    if (staff.role === 'ceo' || staff.role === 'founder' || staff.role === 'co-owner') {
                        leadershipContainer.appendChild(card);
                    } else if (staff.role === 'donator') {
                        hasDonators = true;
                        donatorsGrid.appendChild(card);
                    } else {
                        staffContainer.appendChild(card);
                    }
                });
                
                // Show donators section only if there are donators
                if (hasDonators) {
                    donatorsContainer.classList.remove('hidden');
                } else {
                    donatorsContainer.classList.add('hidden');
                }
            });
        };
        
        // Load Gamemodes
        const loadGamemodes = () => {
            const gamemodesContainer = document.getElementById('gamemodes-container');
            
            onSnapshot(collection(db, 'gamemodes'), (snapshot) => {
                gamemodesContainer.innerHTML = '';
                snapshot.forEach((doc) => {
                    const gamemode = doc.data();
                    const card = document.createElement('div');
                    card.className = 'gamemode-card';
                    card.innerHTML = `
                        <div class="flex items-center mb-4">
                            <i class="fas ${gamemode.icon || 'fa-gamepad'} text-4xl text-green-500 mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">${gamemode.name}</h3>
                                <p class="text-gray-400">${gamemode.description}</p>
                            </div>
                        </div>
                    `;
                    gamemodesContainer.appendChild(card);
                });
            });
        };
        
        // Handle Announcements
        const handleAnnouncements = () => {
            const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
            
            onSnapshot(q, (snapshot) => {
                const announcements = snapshot.docs.map(doc => doc.data());
                if (announcements.length > 0) {
                    const latest = announcements[0];
                    showAnnouncement(latest);
                }
            });
        };
        
        window.showAnnouncement = (announcement) => {
            const popup = document.getElementById('announcement-popup');
            const title = document.getElementById('announcement-title');
            const content = document.getElementById('announcement-content');
            const image = document.getElementById('announcement-image');
            
            title.textContent = announcement.title;
            content.textContent = announcement.content;
            
            if (announcement.imageUrl) {
                image.src = announcement.imageUrl;
                image.classList.remove('hidden');
            } else {
                image.classList.add('hidden');
            }
            
            popup.classList.remove('hidden');
        };
        
        window.closeAnnouncement = () => {
            document.getElementById('announcement-popup').classList.add('hidden');
        };
        
        // Server status checker
        async function checkServerStatus() {
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            const playerCount = document.getElementById('player-count');
            const playerBar = document.getElementById('player-bar');
            const onlinePlayers = document.getElementById('online-players');
            const footerPlayerCount = document.getElementById('footer-player-count');
            
            // Set loading state
            statusIndicator.className = 'w-3 h-3 rounded-full bg-yellow-500 mr-2';
            statusText.textContent = 'Checking...';
            
            try {
                const response = await fetch('https://api.mcsrvstat.us/2/play.matrix.tech');
                const data = await response.json();
                
                if (data.online) {
                    statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500 mr-2';
                    statusText.textContent = 'Online';
                    
                    const players = data.players.online;
                    const maxPlayers = data.players.max;
                    const percentage = Math.min(100, (players / maxPlayers) * 100);
                    
                    playerCount.textContent = `${players}/${maxPlayers}`;
                    footerPlayerCount.textContent = `${players}/${maxPlayers}`;
                    playerBar.style.width = `${percentage}%`;
                    
                    // Display online players if available
                    if (data.players.list) {
                        onlinePlayers.innerHTML = '';
                        if (data.players.list.length > 0) {
                            onlinePlayers.innerHTML = '<p class="mb-2">Online Players:</p>';
                            data.players.list.forEach(player => {
                                const playerElement = document.createElement('span');
                                playerElement.className = 'online-player';
                                playerElement.textContent = player;
                                onlinePlayers.appendChild(playerElement);
                            });
                        } else {
                            onlinePlayers.innerHTML = '<p>No players online</p>';
                        }
                    } else {
                        onlinePlayers.innerHTML = `<p>${players} player${players !== 1 ? 's' : ''} online</p>`;
                    }
                } else {
                    statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
                    statusText.textContent = 'Offline';
                    playerCount.textContent = '0/100';
                    footerPlayerCount.textContent = '0/100';
                    playerBar.style.width = '0%';
                    onlinePlayers.innerHTML = '<p>Server is currently offline</p>';
                }
            } catch (error) {
                console.error('Error checking server status:', error);
                statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-500 mr-2';
                statusText.textContent = 'Error';
                playerCount.textContent = '0/100';
                footerPlayerCount.textContent = '0/100';
                playerBar.style.width = '0%';
                onlinePlayers.innerHTML = '<p>Error checking server status</p>';
            }
        }

        // Mobile menu toggle
        document.getElementById('menu-toggle').addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });
        
        // Initialize everything when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            loadStaff();
            loadGamemodes();
            handleAnnouncements();
            loadTestimonials();
            checkServerStatus();
            
            // Auto-refresh server status every 2 minutes
            setInterval(checkServerStatus, 120000);
            
            // Smooth scrolling for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                        
                        // Close mobile menu if open
                        const mobileMenu = document.getElementById('mobile-menu');
                        if (!mobileMenu.classList.contains('hidden')) {
                            mobileMenu.classList.add('hidden');
                        }
                    }
                });
            });
        });
        
        // Make scrollToSection available globally
        window.scrollToSection = function(sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                window.scrollTo({
                    top: section.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        };