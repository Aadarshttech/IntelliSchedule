const DashboardView = {
    render() {
        return `
            <div class="grid-3">
                <div class="card">
                    <h3 style="color: var(--accent-primary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Courses
                    </h3>
                    <div id="stat-courses" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
                <div class="card">
                    <h3 style="color: var(--accent-secondary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        Rooms
                    </h3>
                    <div id="stat-rooms" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
                <div class="card">
                    <h3 style="color: var(--accent-success);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Instructors
                    </h3>
                    <div id="stat-instructors" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <h3>System Status</h3>
                <p style="color: var(--text-secondary); line-height: 1.6;">
                    The AI Constraint Solver is running and ready. Navigate to the <strong>Constraints DSL</strong> to write your logic, or head over to the <strong>Schedule Output</strong> to generate a new conflict-free timetable.
                </p>
            </div>
        `;
    },
    async init() {
        try {
            const [courses, rooms, instructors] = await Promise.all([
                api.get('/data/courses').catch(() => []),
                api.get('/data/rooms').catch(() => []),
                api.get('/data/instructors').catch(() => [])
            ]);
            document.getElementById('stat-courses').innerText = courses.length || 0;
            document.getElementById('stat-rooms').innerText = rooms.length || 0;
            document.getElementById('stat-instructors').innerText = instructors.length || 0;
        } catch (e) {
            console.error(e);
        }
    }
};
