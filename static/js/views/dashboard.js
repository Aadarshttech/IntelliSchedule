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
                        Teachers
                    </h3>
                    <div id="stat-instructors" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px; text-align: center; padding: 48px 24px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 16px;">Ready to build your timetable?</h3>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
                    Make sure you have added all your Courses, Rooms, and Teachers in the Data Input section. The AI will automatically avoid overlapping teachers and rooms.
                </p>
                <button id="btn-generate-schedule" class="btn primary" style="font-size: 1.1rem; padding: 12px 24px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Generate Timetable
                </button>
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
            
            document.getElementById('btn-generate-schedule').addEventListener('click', async () => {
                const btn = document.getElementById('btn-generate-schedule');
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Generating... Please wait.';
                btn.disabled = true;
                
                try {
                    await api.post('/schedule/generate', { dsl_text: "" });
                    window.showToast("Schedule generated successfully!", "success");
                    window.navigateTo('schedule');
                } catch (e) {
                    window.showToast("Error generating schedule: " + e.message, "error");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });

        } catch (e) {
            console.error(e);
        }
    }
};
