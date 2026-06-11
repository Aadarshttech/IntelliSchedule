const DataInputView = {
    render() {
        return `
            <div class="grid-2" style="margin-bottom: 24px;">
                <!-- Courses Form & List -->
                <div class="card">
                    <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> Courses</h3>
                    <form id="form-course" class="crud-form">
                        <input type="text" id="course-name" placeholder="Course Name (e.g., CS101)" required>
                        <input type="text" id="course-type" placeholder="Room Type Required (e.g., Lecture)" required>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" id="course-sessions" placeholder="Sessions/Week" required min="1">
                            <input type="number" id="course-enrollment" placeholder="Enrollment" required min="1">
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%;">+ Add Course</button>
                    </form>
                    <div id="courses-list" class="entity-list">Loading courses...</div>
                </div>

                <!-- Rooms Form & List -->
                <div class="card">
                    <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> Classrooms</h3>
                    <form id="form-room" class="crud-form">
                        <input type="text" id="room-name" placeholder="Room Name (e.g., Lab 1)" required>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" id="room-capacity" placeholder="Capacity" required min="1">
                            <input type="text" id="room-type" placeholder="Type (e.g., Lab)" required>
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%;">+ Add Room</button>
                    </form>
                    <div id="rooms-list" class="entity-list">Loading rooms...</div>
                </div>
            </div>

            <div class="grid-2">
                <!-- Instructors Form & List -->
                <div class="card">
                    <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Teachers</h3>
                    <form id="form-instructor" class="crud-form">
                        <input type="text" id="inst-name" placeholder="Instructor Name" required>
                        <input type="text" id="inst-dept" placeholder="Department" required>
                        <input type="number" id="inst-hours" placeholder="Max Weekly Hours" required min="1">
                        <select id="inst-courses" multiple style="height: 60px;">
                            <option value="" disabled>Loading courses...</option>
                        </select>
                        <small style="color: var(--text-secondary); display: block;">Hold Ctrl to select multiple courses.</small>
                        <button type="submit" class="btn primary" style="width: 100%;">+ Add Teacher</button>
                    </form>
                    <div id="instructors-list" class="entity-list">Loading instructors...</div>
                </div>

                <!-- TimeSlots Form & List -->
                <div class="card">
                    <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Time Slots</h3>
                    <form id="form-timeslot" class="crud-form">
                        <select id="ts-day" required>
                            <option value="">Select Day...</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                        </select>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <label style="color: var(--text-secondary); font-size: 0.85rem; white-space: nowrap;">From</label>
                            <input type="time" id="ts-start" required>
                            <label style="color: var(--text-secondary); font-size: 0.85rem; white-space: nowrap;">To</label>
                            <input type="time" id="ts-end" required>
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%;">+ Add Time Slot</button>
                    </form>
                    <div id="timeslots-list" class="entity-list">Loading timeslots...</div>
                </div>
            </div>
        `;
    },

    async init() {
        const self = this;
        await self.loadAllData();
        self.setupForms();
    },
    
    async loadAllData() {
        try {
            const [courses, rooms, instructors, timeslots] = await Promise.all([
                api.get('/data/courses'),
                api.get('/data/rooms'),
                api.get('/data/instructors'),
                api.get('/data/timeslots')
            ]);
            
            // Render Courses
            if (courses.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Enrolled</th></tr>';
                courses.forEach(c => { h += '<tr><td>' + c.name + '</td><td><span class="badge info">' + c.room_type + '</span></td><td>' + c.enrollment_count + '</td></tr>'; });
                h += '</table>';
                document.getElementById('courses-list').innerHTML = h;
            } else {
                document.getElementById('courses-list').innerHTML = '<p class="empty-msg">No courses yet. Add one above.</p>';
            }
            
            // Populate Instructor Course Select
            const courseSelect = document.getElementById('inst-courses');
            if (courses.length) {
                courseSelect.innerHTML = courses.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
            } else {
                courseSelect.innerHTML = '<option value="" disabled>Add courses first</option>';
            }
            
            // Render Rooms
            if (rooms.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Capacity</th></tr>';
                rooms.forEach(r => { h += '<tr><td>' + r.name + '</td><td><span class="badge info">' + r.room_type + '</span></td><td>' + r.capacity + '</td></tr>'; });
                h += '</table>';
                document.getElementById('rooms-list').innerHTML = h;
            } else {
                document.getElementById('rooms-list').innerHTML = '<p class="empty-msg">No rooms yet. Add one above.</p>';
            }
            
            // Render Instructors
            if (instructors.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Dept</th><th>Max Hrs</th></tr>';
                instructors.forEach(i => { h += '<tr><td>' + i.name + '</td><td>' + i.department + '</td><td>' + i.max_weekly_hours + '</td></tr>'; });
                h += '</table>';
                document.getElementById('instructors-list').innerHTML = h;
            } else {
                document.getElementById('instructors-list').innerHTML = '<p class="empty-msg">No teachers yet. Add one above.</p>';
            }
            
            // Render TimeSlots
            if (timeslots.length) {
                let h = '<table class="data-table"><tr><th>Day</th><th>Start</th><th>End</th></tr>';
                timeslots.forEach(t => { h += '<tr><td>' + t.day + '</td><td>' + t.start_time + '</td><td>' + t.end_time + '</td></tr>'; });
                h += '</table>';
                document.getElementById('timeslots-list').innerHTML = h;
            } else {
                document.getElementById('timeslots-list').innerHTML = '<p class="empty-msg">No time slots yet. Add one above.</p>';
            }
            
        } catch (e) {
            window.showToast("Failed to load data: " + e.message, "error");
            console.error(e);
        }
    },
    
    setupForms() {
        const self = this;

        document.getElementById('form-course').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('course-name').value,
                sessions_per_week: parseInt(document.getElementById('course-sessions').value),
                room_type: document.getElementById('course-type').value,
                enrollment_count: parseInt(document.getElementById('course-enrollment').value)
            };
            try {
                await api.post('/data/courses', payload);
                window.showToast("Course added successfully!", "success");
                e.target.reset();
                await self.loadAllData();
            } catch (err) {
                window.showToast("Error: " + err.message, "error");
            }
        });
        
        document.getElementById('form-room').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('room-name').value,
                capacity: parseInt(document.getElementById('room-capacity').value),
                room_type: document.getElementById('room-type').value
            };
            try {
                await api.post('/data/rooms', payload);
                window.showToast("Room added successfully!", "success");
                e.target.reset();
                await self.loadAllData();
            } catch (err) {
                window.showToast("Error: " + err.message, "error");
            }
        });
        
        document.getElementById('form-instructor').addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectEl = document.getElementById('inst-courses');
            const selectedCourseIds = Array.from(selectEl.selectedOptions).map(opt => parseInt(opt.value));
            const payload = {
                name: document.getElementById('inst-name').value,
                department: document.getElementById('inst-dept').value,
                max_weekly_hours: parseInt(document.getElementById('inst-hours').value),
                course_ids: selectedCourseIds
            };
            try {
                await api.post('/data/instructors', payload);
                window.showToast("Teacher added successfully!", "success");
                e.target.reset();
                await self.loadAllData();
            } catch (err) {
                window.showToast("Error: " + err.message, "error");
            }
        });
        
        document.getElementById('form-timeslot').addEventListener('submit', async (e) => {
            e.preventDefault();
            const startVal = document.getElementById('ts-start').value;
            const endVal = document.getElementById('ts-end').value;
            if (!startVal || !endVal) {
                window.showToast("Please select both start and end times", "error");
                return;
            }
            const payload = {
                day: document.getElementById('ts-day').value,
                start_time: startVal + ":00",
                end_time: endVal + ":00"
            };
            try {
                await api.post('/data/timeslots', payload);
                window.showToast("Time slot added successfully!", "success");
                e.target.reset();
                await self.loadAllData();
            } catch (err) {
                window.showToast("Error: " + err.message, "error");
            }
        });
    }
};
