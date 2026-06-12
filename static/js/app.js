const routes = {
    '/dashboard': DashboardView,
    '/data': DataInputView,
    '/schedule': ScheduleView,
    '/conflicts': ConflictsView
};

window.navigateTo = function(route) {
    window.location.hash = '#' + route;
};

window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

function router() {
    let hash = window.location.hash.slice(1) || '/dashboard';
    if (!routes[hash]) hash = '/dashboard';
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-route="${hash}"]`)?.classList.add('active');
    
    // Render view
    const viewContainer = document.getElementById('view-container');
    const titleObj = document.querySelector(`.nav-item[data-route="${hash}"] span`);
    const title = titleObj ? titleObj.innerText : 'Dashboard';
    
    document.getElementById('page-title').innerText = title;
    
    // Subtitle mapping
    const subtitles = {
        '/dashboard': 'Overview of your timetable operations',
        '/data': 'Manage courses, rooms, and constraints data',
        '/schedule': 'Generate and view the final timetable',
        '/conflicts': 'Review solver infeasibilities and warnings'
    };
    document.getElementById('page-subtitle').innerText = subtitles[hash] || '';
    
    const view = routes[hash];
    if (view && typeof view.render === 'function') {
        viewContainer.innerHTML = view.render();
        if (typeof view.init === 'function') {
            // small timeout to ensure DOM is ready
            setTimeout(() => view.init(), 0);
        }
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Theme toggle: light (white) and default dark
function applyTheme(theme){
    if(theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
}

document.addEventListener('DOMContentLoaded', ()=>{
    const saved = localStorage.getItem('tt_theme') || 'dark';
    applyTheme(saved);
    const btn = document.getElementById('theme-toggle');
    if(btn){
        btn.addEventListener('click', ()=>{
            const cur = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            const next = cur === 'light' ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('tt_theme', next);
        });
    }
});
