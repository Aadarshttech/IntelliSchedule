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
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%;">+ Add Course</button>
                    </form>
                    <div id="courses-list" class="entity-list">Loading courses...</div>
                </div>

                        <!-- Reordered flow: Batch first, then Instructor, then Course/Room -->
                        <div class="grid-2" style="margin-bottom: 24px;">
                            <!-- Batches Form & List (first step) -->
                            <div class="card">
                                <h3>Student Batches</h3>
                                <form id="form-group" class="crud-form">
                                    <input type="text" id="group-name" placeholder="Batch Name (e.g., 2024-A)" required>
                                    <input type="number" id="group-size" placeholder="Batch Size" required min="1">
                                    <select id="group-courses" multiple style="height: 80px; margin-top:8px;">
                                        <option value="" disabled>Loading courses...</option>
                                    </select>
                                    <button type="submit" class="btn primary" style="width: 100%">+ Add Batch</button>
                                </form>
                                <div id="groups-list" class="entity-list">Loading batches...</div>
                            </div>

                            <!-- Instructors Form & List (enabled after at least one batch exists) -->
                            <div class="card" id="instructor-card">
                                <h3>Teachers</h3>
                                <form id="form-instructor" class="crud-form">
                                    <input type="text" id="inst-name" placeholder="Teacher Name" required>
                                    <select id="inst-groups" multiple style="height: 60px; margin-top:8px;">
                                        <option value="" disabled>Loading batches...</option>
                                    </select>
                                    <select id="inst-courses" multiple style="height: 60px; margin-top:8px;">
                                        <option value="" disabled>Loading courses...</option>
                                    </select>
                                    <small style="color: var(--text-secondary); display: block;">Hold Ctrl to select multiple batches/courses.</small>
                                    <button type="submit" class="btn primary" style="width: 100%">+ Add Teacher</button>
                                </form>
                                <div id="instructors-list" class="entity-list">Loading instructors...</div>
                            </div>
                        </div>

                        <div class="grid-2">
                            <!-- Courses Form & List (enabled after at least one instructor exists) -->
                            <div class="card" id="course-card">
                                <h3>Courses</h3>
                                <form id="form-course" class="crud-form">
                                    <input type="text" id="course-name" placeholder="Course Name (e.g., CS101)" required>
                                    <input type="text" id="course-type" placeholder="Room Type Required (e.g., Lecture)" required>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="number" id="course-sessions" placeholder="Sessions/Week" required min="1">
                                    </div>
                                    <button type="submit" class="btn primary" style="width: 100%">+ Add Course</button>
                                </form>
                                <div id="courses-list" class="entity-list">Loading courses...</div>
                            </div>

                            <!-- Rooms Form & List -->
                            <div class="card">
                                <h3>Classrooms</h3>
                                <form id="form-room" class="crud-form">
                                    <input type="text" id="room-name" placeholder="Room Name (e.g., Lab 1)" required>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="number" id="room-capacity" placeholder="Capacity" required min="1">
                                        <input type="text" id="room-type" placeholder="Type (e.g., Lab)" required>
                                    </div>
                                    <button type="submit" class="btn primary" style="width: 100%">+ Add Room</button>
                                </form>
                                <div id="rooms-list" class="entity-list">Loading rooms...</div>
                            </div>
                        </div>

                <!-- Assignments removed per user request -->
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
            const [courses, rooms, instructors] = await Promise.all([
                api.get('/data/courses'),
                api.get('/data/rooms'),
                api.get('/data/instructors')
            ]);
            const [groups] = await Promise.all([api.get('/data/groups')]);
            
            // Render Courses
            if (courses.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Sessions</th><th></th></tr>';
                courses.forEach(c => { h += '<tr><td>' + c.name + '</td><td><span class="badge info">' + c.room_type + '</span></td><td>' + c.sessions_per_week + '</td><td><button data-id="'+c.id+'" data-type="course" class="btn small delete-btn">Delete</button></td></tr>'; });
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

            // Populate group-courses multi-select for batch creation
            const groupCourses = document.getElementById('group-courses');
            if (groupCourses) {
                if (courses.length) groupCourses.innerHTML = courses.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
                else groupCourses.innerHTML = '<option value="" disabled>Add courses first</option>';
            }

            // Style selects: add open class on focus for subtle animation
            ['inst-courses','inst-groups','group-courses','assign-group','assign-instructor','assign-course'].forEach(id => {
                const el = document.getElementById(id);
                if(!el) return;
                el.addEventListener('focus', ()=> el.classList.add('select-open'));
                el.addEventListener('blur', ()=> el.classList.remove('select-open'));
            });

            const groupSelect = document.getElementById('inst-groups');
            if (groups && groups.length) {
                groupSelect.innerHTML = groups.map(g => '<option value="' + g.id + '">' + g.name + '</option>').join('');
            } else {
                groupSelect.innerHTML = '<option value="" disabled>Add batches first</option>';
            }

            // Enable/disable cards based on workflow: must have batch -> instructor -> course
            const instructorCard = document.getElementById('instructor-card');
            const courseCard = document.getElementById('course-card');
            if (!groups || groups.length === 0) {
                // disable instructor and course forms
                instructorCard.classList.add('disabled-card');
                courseCard.classList.add('disabled-card');
                // disable form controls
                instructorCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = true);
                courseCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = true);
            } else if (!instructors || instructors.length === 0) {
                instructorCard.classList.remove('disabled-card');
                courseCard.classList.add('disabled-card');
                instructorCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = false);
                courseCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = true);
            } else {
                instructorCard.classList.remove('disabled-card');
                courseCard.classList.remove('disabled-card');
                instructorCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = false);
                courseCard.querySelectorAll('input,select,button').forEach(el=>el.disabled = false);
            }
            
            // Render Rooms
            if (rooms.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Capacity</th><th></th></tr>';
                rooms.forEach(r => { h += '<tr><td>' + r.name + '</td><td><span class="badge info">' + r.room_type + '</span></td><td>' + r.capacity + '</td><td><button data-id="'+r.id+'" data-type="room" class="btn small delete-btn">Delete</button></td></tr>'; });
                h += '</table>';
                document.getElementById('rooms-list').innerHTML = h;
            } else {
                document.getElementById('rooms-list').innerHTML = '<p class="empty-msg">No rooms yet. Add one above.</p>';
            }
            
            // Render Instructors
            if (instructors.length) {
                let h = '<table class="data-table"><tr><th>Teacher Name</th><th>Courses</th><th></th></tr>';
                instructors.forEach(i => { h += '<tr><td>' + i.name + '</td><td>' + i.courses.map(c=>c.name).join(", ") + '</td><td><button data-id="'+i.id+'" data-type="instructor" class="btn small delete-btn">Delete</button></td></tr>'; });
                h += '</table>';
                document.getElementById('instructors-list').innerHTML = h;
            } else {
                document.getElementById('instructors-list').innerHTML = '<p class="empty-msg">No teachers yet. Add one above.</p>';
            }

            // Render Groups
            if (groups && groups.length) {
                let gh = '<table class="data-table"><tr><th>Batch</th><th>Size</th><th>Courses</th><th></th></tr>';
                groups.forEach(g => { gh += '<tr><td>' + g.name + '</td><td>' + g.size + '</td><td>' + (g.courses||[]).map(c=>c.name).join(', ') + '</td><td><button data-id="'+g.id+'" data-type="group" class="btn small delete-btn">Delete</button></td></tr>'; });
                gh += '</table>';
                document.getElementById('groups-list').innerHTML = gh;
            } else {
                document.getElementById('groups-list').innerHTML = '<p class="empty-msg">No batches yet. Add one above.</p>';
            }

            // Assignments feature removed.
            
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
            const selectGroups = document.getElementById('inst-groups');
            const selectedGroupIds = Array.from(selectGroups.selectedOptions).map(opt => parseInt(opt.value));
            const payload = {
                name: document.getElementById('inst-name').value,
                course_ids: selectedCourseIds
                ,
                group_ids: selectedGroupIds
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

        document.getElementById('form-group').addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedCourseIds = Array.from(document.getElementById('group-courses').selectedOptions).map(o=>parseInt(o.value));
            const payload = {
                name: document.getElementById('group-name').value,
                size: parseInt(document.getElementById('group-size').value),
                course_ids: selectedCourseIds
            };
            try {
                await api.post('/data/groups', payload);
                window.showToast('Batch added', 'success');
                e.target.reset();
                await self.loadAllData();
            } catch (err) { window.showToast('Error: '+err.message, 'error'); }
        });

        // Assignments feature removed per request.
        // Wire delete buttons (delegated)
        document.getElementById('courses-list').addEventListener('click', async (e)=>{
            if(e.target.classList.contains('delete-btn')){
                const id = e.target.getAttribute('data-id');
                if(!confirm('Delete this course?')) return;
                try{ await api.delete('/data/courses/'+id); window.showToast('Deleted','success'); await self.loadAllData(); }catch(err){ window.showToast('Delete failed: '+err.message,'error'); }
            }
        });
        document.getElementById('rooms-list').addEventListener('click', async (e)=>{
            if(e.target.classList.contains('delete-btn')){
                const id = e.target.getAttribute('data-id');
                if(!confirm('Delete this room?')) return;
                try{ await api.delete('/data/rooms/'+id); window.showToast('Deleted','success'); await self.loadAllData(); }catch(err){ window.showToast('Delete failed: '+err.message,'error'); }
            }
        });
        document.getElementById('instructors-list').addEventListener('click', async (e)=>{
            if(e.target.classList.contains('delete-btn')){
                const id = e.target.getAttribute('data-id');
                if(!confirm('Delete this teacher?')) return;
                try{ await api.delete('/data/instructors/'+id); window.showToast('Deleted','success'); await self.loadAllData(); }catch(err){ window.showToast('Delete failed: '+err.message,'error'); }
            }
        });
        document.getElementById('groups-list').addEventListener('click', async (e)=>{
            if(e.target.classList.contains('delete-btn')){
                const id = e.target.getAttribute('data-id');
                if(!confirm('Delete this batch?')) return;
                try{ await api.delete('/data/groups/'+id); window.showToast('Deleted','success'); await self.loadAllData(); }catch(err){ window.showToast('Delete failed: '+err.message,'error'); }
            }
        });
    }
};
