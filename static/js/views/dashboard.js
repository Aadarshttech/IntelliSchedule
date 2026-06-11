const DashboardView = {
    render() {
        return `
            <div class="card">
                <h3>Welcome to Timetable AI</h3>
                <p>Use the sidebar to navigate through data input, constraints DSL, and schedule generation.</p>
                <div id="stats-container">Loading stats...</div>
            </div>
        `;
    },
    async init() {
        try {
            const courses = await api.get('/data/courses');
            const rooms = await api.get('/data/rooms');
            document.getElementById('stats-container').innerHTML = `
                <p>Total Courses: ${courses.length || 0}</p>
                <p>Total Rooms: ${rooms.length || 0}</p>
            `;
        } catch (e) {
            console.error(e);
        }
    }
};
