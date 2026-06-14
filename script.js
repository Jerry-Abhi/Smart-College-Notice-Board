// DOM Elements
const noticeForm = document.getElementById('noticeForm');
const noticeTitle = document.getElementById('noticeTitle');
const noticeDescription = document.getElementById('noticeDescription');
const deadlineDate = document.getElementById('deadlineDate');
const priorityLevel = document.getElementById('priorityLevel');
const noticeContainer = document.getElementById('noticeContainer');
const totalNoticesEl = document.getElementById('totalNotices');
const themeToggle = document.getElementById('themeToggle');
const iconLight = document.querySelector('.icon-light');
const iconDark = document.querySelector('.icon-dark');

// App State
let notices = JSON.parse(localStorage.getItem('smartNotices')) || [];
let editingNoticeId = null;

// Form Buttons
const addBtn = document.getElementById('addBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Initialize App
function init() {
    const today = new Date().toISOString().split('T')[0];
    deadlineDate.min = today;

    // Load Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        iconLight.style.display = 'none';
        iconDark.style.display = 'block';
    }

    renderNotices();
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        iconLight.style.display = 'block';
        iconDark.style.display = 'none';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        iconLight.style.display = 'none';
        iconDark.style.display = 'block';
    }
});

// Add/Update Notice
noticeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (editingNoticeId) {
        // Update existing notice
        const noticeIndex = notices.findIndex(n => n.id === editingNoticeId);
        if (noticeIndex !== -1) {
            notices[noticeIndex] = {
                ...notices[noticeIndex],
                title: noticeTitle.value.trim(),
                description: noticeDescription.value.trim(),
                deadline: deadlineDate.value,
                priority: priorityLevel.value
            };
        }

        // Reset Editing State
        editingNoticeId = null;
        addBtn.textContent = 'Add Notice';
        addBtn.classList.remove('update-mode');
        cancelEditBtn.style.display = 'none';

        // Add feedback
        addBtn.textContent = 'Notice Updated! ✨';
        setTimeout(() => {
            addBtn.textContent = 'Add Notice';
        }, 2000);

    } else {
        // Add new notice
        const newNotice = {
            id: Date.now().toString(),
            title: noticeTitle.value.trim(),
            description: noticeDescription.value.trim(),
            deadline: deadlineDate.value,
            priority: priorityLevel.value,
            createdAt: new Date().toISOString()
        };

        notices.push(newNotice);

        // Add feedback
        const originalText = addBtn.textContent;
        addBtn.textContent = 'Notice Added! ✨';
        addBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.style.background = '';
        }, 2000);
    }

    saveNotices();
    renderNotices();
    noticeForm.reset();
});

// Cancel Edit
cancelEditBtn.addEventListener('click', () => {
    editingNoticeId = null;
    addBtn.textContent = 'Add Notice';
    addBtn.classList.remove('update-mode');
    cancelEditBtn.style.display = 'none';
    noticeForm.reset();
});

function calculateDaysLeft(deadlineStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Split the date string to parse reliably in local time
    const [year, month, day] = deadlineStr.split('-');
    const deadline = new Date(year, month - 1, day);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getPriorityScore(priority) {
    switch (priority) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
    }
}

// Event delegation for delete and edit buttons
noticeContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    const editBtn = e.target.closest('.edit-btn');

    if (deleteBtn) {
        const cardToRemove = deleteBtn.closest('.notice-card');
        if (cardToRemove) {
            const id = cardToRemove.getAttribute('data-id');
            // Quick exit animation
            cardToRemove.style.transform = 'scale(0.9) translateY(20px)';
            cardToRemove.style.opacity = '0';
            setTimeout(() => {
                notices = notices.filter(n => n.id !== id);
                saveNotices();
                renderNotices();
            }, 300);
        }
    } else if (editBtn) {
        const cardToEdit = editBtn.closest('.notice-card');
        if (cardToEdit) {
            const id = cardToEdit.getAttribute('data-id');
            editNotice(id);
        }
    }
});

function editNotice(id) {
    const notice = notices.find(n => n.id === id);
    if (!notice) return;

    // Populate Form
    noticeTitle.value = notice.title;
    noticeDescription.value = notice.description;
    deadlineDate.value = notice.deadline;
    priorityLevel.value = notice.priority;

    // Set State
    editingNoticeId = id;

    // Update UI
    addBtn.textContent = 'Update Notice';
    addBtn.classList.add('update-mode');
    cancelEditBtn.style.display = 'block';

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    noticeTitle.focus();
}

function saveNotices() {
    localStorage.setItem('smartNotices', JSON.stringify(notices));
}

function renderNotices() {
    const sortedNotices = [...notices].sort((a, b) => {
        const daysLeftA = calculateDaysLeft(a.deadline);
        const daysLeftB = calculateDaysLeft(b.deadline);

        const passedA = daysLeftA < 0;
        const passedB = daysLeftB < 0;

        if (passedA !== passedB) return passedA ? 1 : -1;

        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);

        if (scoreA !== scoreB) return scoreB - scoreA;

        return daysLeftA - daysLeftB;
    });

    totalNoticesEl.textContent = sortedNotices.length;
    noticeContainer.innerHTML = '';

    if (sortedNotices.length === 0) {
        noticeContainer.innerHTML = `
            <div class="empty-state">
                <img src="assets/empty_state.png" alt="No notices" class="empty-img" style="max-width: 250px;" onerror="this.style.display='none'">
                <div>
                   <h3>All Caught Up!</h3>
                   <p>You have no active notices at the moment. Add one to stay organized.</p>
                </div>
            </div>
        `;
        return;
    }

    sortedNotices.forEach((notice, index) => {
        const daysLeft = calculateDaysLeft(notice.deadline);
        const isPassed = daysLeft < 0;

        let timeString = "";
        let timeIcon = "⌛";
        if (isPassed) {
            timeString = "Deadline Passed";
            timeIcon = "🚫";
        } else if (daysLeft === 0) {
            timeString = "Due Today";
            timeIcon = "🔥";
        } else if (daysLeft === 1) {
            timeString = "1 Day Left";
        } else {
            timeString = `${daysLeft} Days Left`;
        }

        const card = document.createElement('div');
        // Add data-id and staggered animation delay
        card.className = `notice-card glass-panel priority-${notice.priority} ${isPassed ? 'deadline-passed' : ''}`;
        card.setAttribute('data-id', notice.id);
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="notice-header">
                <h3 class="notice-title" title="${notice.title}">${notice.title}</h3>
                <div class="card-actions">
                    <button class="edit-btn" aria-label="Edit Notice">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="delete-btn" aria-label="Delete Notice">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            <p class="notice-desc">${notice.description.replace(/\n/g, '<br>')}</p>
            <div class="notice-footer">
                <span class="priority-badge">${notice.priority}</span>
                <div class="countdown-badge">
                    <span>${timeIcon}</span>
                    <span>${timeString}</span>
                </div>
            </div>
        `;

        noticeContainer.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', init);
