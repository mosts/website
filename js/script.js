function createParticles() {
const particlesContainer = document.getElementById('particles');
const particleCount = 300;

const colors = [
    'rgba(233, 30, 99, 0.8)',
    'rgba(156, 39, 176, 0.8)',
    'rgba(186, 104, 200, 0.8)',
    'rgba(255, 179, 186, 0.6)',
    'rgba(248, 187, 208, 0.6)' 
];

for (let i = 0; i < particleCount; i++) {
const particle = document.createElement('div');
particle.className = 'particle';

particle.style.left = Math.random() * 100 + '%';
particle.style.top = Math.random() * 100 + '%';

const size = Math.random() * 3 + 1;
particle.style.width = `${size}px`;
particle.style.height = `${size}px`;

const color = colors[Math.floor(Math.random() * colors.length)];
particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
particle.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);

const glowSize = 2 + size * 2;
particle.style.boxShadow = `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 2}px ${color}`;

const duration = 3 + Math.random() * 5;
particle.style.animation = `twinkle ${duration}s infinite alternate`;
particle.style.animationDelay = Math.random() * 6 + 's';

particlesContainer.appendChild(particle);
}}

document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px) scale(1.02)';
    });

    link.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

const workerURL = 'https://lastfm.adam.eus';

let progressInterval = null;
let currentTrackId = null;
let trackStartTime = null;
const DEFAULT_DURATION = 210; 

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const timeElements = document.querySelectorAll('.progress-time');
    
    if (!progressFill || !timeElements.length || !trackStartTime) {
        return;
    }
    
    const elapsed = Math.floor((Date.now() - trackStartTime) / 1000);
    const progress = Math.min((elapsed / DEFAULT_DURATION) * 100, 100);
    
    progressFill.style.width = `${progress}%`;
    if (timeElements[0]) timeElements[0].textContent = formatTime(elapsed);
    if (timeElements[1]) timeElements[1].textContent = formatTime(DEFAULT_DURATION);
}

function startProgressTracking(trackId) {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    if (trackId !== currentTrackId) {
        currentTrackId = trackId;
        trackStartTime = Date.now();
    }
    
    updateProgress();
    
    progressInterval = setInterval(updateProgress, 1000);
}

function stopProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    currentTrackId = null;
    trackStartTime = null;
}

async function fetchLastFmTracks() {
    try {
        const response = await fetch(workerURL);
        const data = await response.json();
        const tracks = data.recenttracks.track;
        
        if (!tracks || tracks.length === 0) {
            const nowPlayingContainer = document.getElementById('now-playing');
            const recentContainer = document.getElementById('recently-listened');
            if (nowPlayingContainer) nowPlayingContainer.innerHTML = '<p class="activity-date">No tracks found.</p>';
            if (recentContainer) recentContainer.innerHTML = '<p class="activity-date">No recent tracks found.</p>';
            stopProgressTracking();
            return;
        }

        const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
        const currentlyPlaying = tracksArray.find(t => !t.date || t['@attr']?.nowplaying === 'true');
        const previousTracks = tracksArray.filter(t => t.date && t['@attr']?.nowplaying !== 'true').slice(0, 9);

        const nowPlayingContainer = document.getElementById('now-playing');
        if (nowPlayingContainer) {
            if (currentlyPlaying) {
                const imageUrl = currentlyPlaying.image?.[3]?.['#text'] || currentlyPlaying.image?.[2]?.['#text'] || 'https://via.placeholder.com/200';
                const trackName = currentlyPlaying.name;
                const artistName = currentlyPlaying.artist['#text'];
                const trackId = `${trackName}-${artistName}`;
                
                nowPlayingContainer.innerHTML = `
                    <div class="now-playing-badge">Now Playing</div>
                    <div class="now-playing-content">
                        <div class="now-playing-artwork">
                            <img src="${imageUrl}" alt="${trackName} Album Art">
                            <div class="play-overlay">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="now-playing-info">
                            <h3 class="now-playing-title">${trackName}</h3>
                            <p class="now-playing-artist">${artistName}</p>
                            <div class="now-playing-progress">
                                <span class="progress-time">0:00</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 0%;"></div>
                                </div>
                                <span class="progress-time">${formatTime(DEFAULT_DURATION)}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                startProgressTracking(trackId);
            } else {
                nowPlayingContainer.innerHTML = '<p class="activity-date">Nothing playing right now.</p>';
                stopProgressTracking();
            }
        }

        const recentContainer = document.getElementById('recently-listened');
        if (recentContainer) {
            if (previousTracks.length === 0) {
                recentContainer.innerHTML = '<p class="activity-date">No recent tracks found.</p>';
                return;
            }

            recentContainer.innerHTML = '';

            previousTracks.forEach((track, index) => {
                const trackElement = document.createElement('div');
                trackElement.className = 'recent-track-card';
                trackElement.style.animationDelay = `${0.1 * (index + 1)}s`;

                const imageUrl = track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'] || 'https://via.placeholder.com/80';
                const trackName = track.name;
                const artistName = track.artist['#text'];
                const date = track.date
                    ? new Date(track.date.uts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Recently';

                trackElement.innerHTML = `
                    <img src="${imageUrl}" alt="${trackName}" class="recent-track-image">
                    <div class="recent-track-info">
                        <p class="recent-track-name">${trackName}</p>
                        <p class="recent-track-artist">${artistName}</p>
                    </div>
                    <div class="recent-track-date">${date}</div>
                `;

                recentContainer.appendChild(trackElement);
            });
        }
    } catch (error) {
        console.error('Error fetching Last.fm tracks:', error);
        const nowPlayingContainer = document.getElementById('now-playing');
        const recentContainer = document.getElementById('recently-listened');
        if (nowPlayingContainer) nowPlayingContainer.innerHTML = '<p class="activity-date">Failed to load. Check console for details.</p>';
        if (recentContainer) recentContainer.innerHTML = '<p class="activity-date">Failed to load tracks. Check console for details.</p>';
    }
}

let prevX = null;
let prevY = null;
let lastStarTime = 0;
let activeStars = 0;
const MAX_STARS = 10;
const MIN_DISTANCE = 50;
const MIN_TIME_BETWEEN_STARS = 100;
const STAR_LIFETIME = 800;

let starContainer = null;

function initStarContainer() {
    if (!starContainer) {
        starContainer = document.createElement('div');
        starContainer.id = 'star-container';
        starContainer.style.position = 'fixed';
        starContainer.style.top = '0';
        starContainer.style.left = '0';
        starContainer.style.width = '100%';
        starContainer.style.height = '100%';
        starContainer.style.pointerEvents = 'none';
        starContainer.style.zIndex = '9999';
        document.body.appendChild(starContainer);
    }
}

function checkDistance(event) {
    const now = Date.now();
    const x = event.clientX;
    const y = event.clientY;
    
    if (now - lastStarTime < MIN_TIME_BETWEEN_STARS) {
        return;
    }
    
    if (activeStars >= MAX_STARS) {
        return;
    }
    
    if (prevX !== null && prevY !== null) {
        const distanceX = x - prevX;
        const distanceY = y - prevY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance >= MIN_DISTANCE) {
            createStars(x, y);
            prevX = x;
            prevY = y;
            lastStarTime = now;
        }
    } else {
        createStars(x, y);
        prevX = x;
        prevY = y;
        lastStarTime = now;
    }
}

function createStars(x, y) {
    if (!starContainer) {
        initStarContainer();
    }
    
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.position = 'absolute';
    star.style.top = y + 'px';
    star.style.left = x + 'px';
    
    const size = Math.random() * 30 + 10;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    
    const transformV = Math.random() * 360;
    star.style.transform = `rotate(${transformV}deg)`;
    
    const colors = ['rgba(233, 30, 99, 0.8)', 'rgba(156, 39, 176, 0.8)', 'rgba(186, 104, 200, 0.8)'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    star.style.filter = `drop-shadow(0 0 ${size/2}px ${color})`;
    
    starContainer.appendChild(star);
    activeStars++;
    
    setTimeout(() => {
        if (starContainer && starContainer.contains(star)) {
            starContainer.removeChild(star);
            activeStars = Math.max(0, activeStars - 1);
        }
    }, STAR_LIFETIME);
}

let throttleTimeout = null;
document.body.addEventListener('mousemove', (event) => {
    if (throttleTimeout) {
        return;
    }
    
    throttleTimeout = setTimeout(() => {
        checkDistance(event);
        throttleTimeout = null;
    }, 16);
});

// ─── Discord ───────────────────────────────────────────────────────────────────

const DISCORD_WORKER_URL = 'https://discord-api.adam.eus';
const DISCORD_CACHE_KEY = 'discord_servers_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes — matches worker KV TTL

function getCachedData(inviteCode) {
    try {
        const cached = localStorage.getItem(`${DISCORD_CACHE_KEY}_${inviteCode}`);
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < CACHE_DURATION) {
                return data.data;
            }
        }
    } catch (e) {}
    return null;
}

function setCachedData(inviteCode, data) {
    try {
        localStorage.setItem(`${DISCORD_CACHE_KEY}_${inviteCode}`, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    } catch (e) {}
}

async function fetchDiscordServerCount(inviteCode) {
    if (!inviteCode) return null;

    const cached = getCachedData(inviteCode);
    if (cached) return cached;

    try {
        const response = await fetch(`${DISCORD_WORKER_URL}/?code=${inviteCode}`);

        if (!response.ok) throw new Error(`Worker returned ${response.status}`);

        const data = await response.json();

        const result = {
            memberCount: data.approximate_member_count || 0,
            onlineCount: data.approximate_presence_count || 0,
            serverIcon: data.guild?.icon
                ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=64`
                : null
        };

        setCachedData(inviteCode, result);
        return result;
    } catch (error) {
        console.error(`Error fetching Discord data for ${inviteCode}:`, error);
        return null;
    }
}

function formatMemberCount(count) {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M members`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K members`;
    }
    return `${count.toLocaleString()} members`;
}

async function updateDiscordServerCounts() {
    const serverCards = document.querySelectorAll('.server-card[data-invite]');
    const memberCounts = new Map();
    const serverIcons = new Map();
    const uniqueInvites = new Set();
    
    serverCards.forEach(card => {
        const inviteCode = card.getAttribute('data-invite');
        if (inviteCode) uniqueInvites.add(inviteCode);
    });
    
    uniqueInvites.forEach(inviteCode => {
        const cached = getCachedData(inviteCode);
        if (cached) {
            memberCounts.set(inviteCode, cached.memberCount);
            if (cached.serverIcon) serverIcons.set(inviteCode, cached.serverIcon);
        }
    });
    
    if (memberCounts.size > 0) {
        updateServerCardsUI(serverCards, memberCounts, serverIcons);
        updateTotalMembers(memberCounts);
    }
    
    const fetchPromises = Array.from(uniqueInvites).map(inviteCode =>
        fetchDiscordServerCount(inviteCode).then(data => ({ inviteCode, data }))
    );
    
    const results = await Promise.all(fetchPromises);
    
    results.forEach(({ inviteCode, data }) => {
        if (data) {
            memberCounts.set(inviteCode, data.memberCount);
            if (data.serverIcon) serverIcons.set(inviteCode, data.serverIcon);
        }
    });
    
    updateServerCardsUI(serverCards, memberCounts, serverIcons);
    updateTotalMembers(memberCounts);
}

function updateServerCardsUI(serverCards, memberCounts, serverIcons) {
    serverCards.forEach(card => {
        const inviteCode = card.getAttribute('data-invite');
        if (!inviteCode) return;
        
        const membersElement = card.querySelector('.server-members');
        if (membersElement) {
            membersElement.textContent = memberCounts.has(inviteCode)
                ? formatMemberCount(memberCounts.get(inviteCode))
                : 'N/A members';
        }
        
        if (serverIcons.has(inviteCode)) {
            const iconImg = card.querySelector('.server-icon-img');
            const placeholder = card.querySelector('.server-icon-placeholder');
            if (iconImg) {
                iconImg.src = serverIcons.get(inviteCode);
                iconImg.style.display = 'block';
                iconImg.onload = () => { if (placeholder) placeholder.style.display = 'none'; };
                iconImg.onerror = () => {
                    iconImg.style.display = 'none';
                    if (placeholder) placeholder.style.display = 'flex';
                };
            }
        }
    });
}

function updateTotalMembers(memberCounts) {
    const totalMembersElement = document.getElementById('total-members');
    const totalServersElement = document.getElementById('total-servers');
    
    if (totalServersElement) {
        totalServersElement.textContent = memberCounts.size > 0
            ? memberCounts.size.toString()
            : 'Loading...';
    }
    
    if (!totalMembersElement) return;
    
    let total = 0;
    for (const count of memberCounts.values()) total += count;
    
    if (total > 0) {
        if (total >= 1000000) {
            totalMembersElement.textContent = `${(total / 1000000).toFixed(1)}M+`;
        } else if (total >= 1000) {
            totalMembersElement.textContent = `${(total / 1000).toFixed(0)}K+`;
        } else {
            totalMembersElement.textContent = `${total.toLocaleString()}+`;
        }
    } else {
        totalMembersElement.textContent = 'Loading...';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initStarContainer();
    fetchLastFmTracks();
    updateDiscordServerCounts();
    
    setInterval(fetchLastFmTracks, 30000);
    setInterval(updateDiscordServerCounts, 300000);
});
