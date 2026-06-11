const DataInputView = {
    render() {
        return `
            <div class="grid-2">
                <div class="card">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Courses
                    </h3>
                    <div id="courses-list">Loading courses...</div>
                </div>
                <div class="card">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        Rooms
                    </h3>
                    <div id="rooms-list">Loading rooms...</div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <h3>System Operations</h3>
                <p style="color: var(--text-secondary); margin-bottom: 16px;">Run system population scripts or clear current working data.</p>
                <button class="btn primary" id="load-sample-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>
                    Run Sample Seed Data (populate.py)
                </button>
            </div>
        `;
    },
    async init() {
        try {
            const [courses, rooms] = await Promise.all([
                api.get('/data/courses'),
                api.get('/data/rooms')
            ]);
            
            let courseHtml = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Enrolled</th></tr>';
            courses.forEach(c => {
                courseHtml += `<tr><td>${c.name}</td><td><span class="badge info">${c.room_type}</span></td><td>${c.enrollment_count}</td></tr>`;
            });
            courseHtml += '</table>';
            document.getElementById('courses-list').innerHTML = courses.length ? courseHtml : '<p>No courses found.</p>';
            
            let roomHtml = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Capacity</th></tr>';
            rooms.forEach(r => {
                roomHtml += `<tr><td>${r.name}</td><td><span class="badge info">${r.room_type}</span></td><td>${r.capacity}</td></tr>`;
            });
            roomHtml += '</table>';
            document.getElementById('rooms-list').innerHTML = rooms.length ? roomHtml : '<p>No rooms found.</p>';
            
        } catch (e) {
            window.showToast("Failed to fetch data", "error");
            console.error(e);
        }

        document.getElementById('load-sample-btn')?.addEventListener('click', () => {
            window.showToast("To populate data, run 'python data/populate.py' in the terminal.", "info");
        });
    }
};
