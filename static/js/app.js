const routes = {
    '/dashboard': DashboardView,
    '/data': DataInputView,
    '/dsl': DslEditorView,
    '/schedule': ScheduleView,
    '/conflicts': ConflictsView
};

function router() {
    let hash = window.location.hash.slice(1) || '/dashboard';
    if (!routes[hash]) hash = '/dashboard';
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-route="${hash}"]`)?.classList.add('active');
    
    // Render view
    const viewContainer = document.getElementById('view-container');
    const title = document.querySelector(`.nav-item[data-route="${hash}"]`)?.innerText || 'Dashboard';
    document.getElementById('page-title').innerText = title;
    
    const view = routes[hash];
    if (view && typeof view.render === 'function') {
        viewContainer.innerHTML = view.render();
        if (typeof view.init === 'function') view.init();
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
