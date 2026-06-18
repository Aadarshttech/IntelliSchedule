const DataInputView = {
    state: {
        courses: [],
        rooms: [],
        instructors: [],
        semesters: [],
        editingSemesterId: null,
        editingTeacherId: null,
        selectedSemesterCourseIds: [],
        selectedTeacherCourseIds: []
    },

    render() {
        return `
            <div class="grid-2" style="margin-bottom: 24px;">
                <div class="card" id="semester-card">
                    <h3>Semesters</h3>
                    <form id="form-group" class="crud-form">
                        <input type="text" id="group-name" placeholder="Semester Name (e.g., Fall 2026)" required>
                        <input type="number" id="group-size" placeholder="Semester Size" required min="1">

                        <div style="margin-top:8px; display:flex; flex-direction:column; gap:10px; padding:10px; border:1px solid var(--border-color); border-radius:8px; background: rgba(0,0,0,0.04);">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                                <small style="color:var(--text-secondary);">Add courses to this semester</small>
                                <small style="color:var(--text-muted);">Type to search, then press Enter or click Add</small>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="semester-course-search" list="semester-course-options" placeholder="Search course name">
                                <button type="button" class="btn" id="add-semester-course-btn">Add Course</button>
                            </div>
                            <datalist id="semester-course-options"></datalist>
                            <div id="semester-selected-courses" class="chip-list"></div>
                            <div class="empty-msg" id="semester-courses-empty">No courses selected yet.</div>
                        </div>

                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                            <button type="submit" class="btn primary" id="semester-submit-btn" style="flex:1; min-width: 180px;">+ Add Semester</button>
                            <button type="button" class="btn" id="semester-cancel-btn" style="display:none;">Cancel Edit</button>
                        </div>
                    </form>
                    <div id="groups-list" class="entity-list">Loading semesters...</div>
                </div>

                <div class="card" id="instructor-card">
                    <h3>Teachers</h3>
                    <form id="form-instructor" class="crud-form">
                        <input type="text" id="inst-name" placeholder="Teacher Name" required>

                        <div style="margin-top:8px; display:flex; flex-direction:column; gap:10px; padding:10px; border:1px solid var(--border-color); border-radius:8px; background: rgba(0,0,0,0.04);">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                                <small style="color:var(--text-secondary);">Assign courses to this teacher</small>
                                <small style="color:var(--text-muted);">Type a course, then press Enter or click Add</small>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="teacher-course-search" list="teacher-course-options" placeholder="Search course name">
                                <button type="button" class="btn" id="add-teacher-course-btn">Add Course</button>
                            </div>
                            <datalist id="teacher-course-options"></datalist>
                            <div id="teacher-selected-courses" class="chip-list"></div>
                            <div class="empty-msg" id="teacher-courses-empty">No courses selected yet.</div>
                        </div>

                        <small style="color: var(--text-secondary); display: block;">Selected courses define what this teacher can teach.</small>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
                            <button type="submit" class="btn primary" id="teacher-submit-btn" style="flex:1; min-width: 180px;">+ Add Teacher</button>
                            <button type="button" class="btn" id="teacher-cancel-btn" style="display:none;">Cancel Edit</button>
                        </div>
                    </form>
                    <div id="instructors-list" class="entity-list">Loading instructors...</div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card" id="course-card">
                    <h3>Courses</h3>
                    <form id="form-course" class="crud-form">
                        <input type="text" id="course-name" placeholder="Course Name (e.g., CS101)" required>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" id="course-sessions" placeholder="Sessions/Week" required min="1">
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%">+ Add Course</button>
                    </form>
                    <div id="courses-list" class="entity-list">Loading courses...</div>
                </div>

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
        `;
    },

    async init() {
        await this.loadAllData();
        this.setupForms();
    },

    getCourseById(courseId) {
        return this.state.courses.find((course) => Number(course.id) === Number(courseId));
    },

    getCourseByName(courseName) {
        const normalizedName = String(courseName || '').trim().toLowerCase();
        if (!normalizedName) {
            return null;
        }
        return this.state.courses.find((course) => course.name.trim().toLowerCase() === normalizedName) || null;
    },

    getSelectedSemesterCourses() {
        return this.state.selectedSemesterCourseIds
            .map((courseId) => this.getCourseById(courseId))
            .filter(Boolean);
    },

    getSelectedTeacherCourses() {
        return this.state.selectedTeacherCourseIds
            .map((courseId) => this.getCourseById(courseId))
            .filter(Boolean);
    },

    renderSemesterCoursePicker() {
        const datalist = document.getElementById('semester-course-options');
        const chips = document.getElementById('semester-selected-courses');
        const emptyState = document.getElementById('semester-courses-empty');

        if (datalist) {
            datalist.innerHTML = this.state.courses.map((course) => `<option value="${course.name}"></option>`).join('');
        }

        if (chips) {
            const selectedCourses = this.getSelectedSemesterCourses();
            chips.innerHTML = selectedCourses.length
                ? selectedCourses.map((course) => `
                    <span class="chip">
                        <span>${course.name}</span>
                        <button type="button" class="chip__remove" data-course-id="${course.id}" data-target="semester">×</button>
                    </span>
                `).join('')
                : '';
        }

        if (emptyState) {
            emptyState.style.display = this.state.selectedSemesterCourseIds.length ? 'none' : 'block';
        }
    },

    renderTeacherCoursePicker() {
        const datalist = document.getElementById('teacher-course-options');
        const chips = document.getElementById('teacher-selected-courses');
        const emptyState = document.getElementById('teacher-courses-empty');

        if (datalist) {
            datalist.innerHTML = this.state.courses.map((course) => `<option value="${course.name}"></option>`).join('');
        }

        if (chips) {
            const selectedCourses = this.getSelectedTeacherCourses();
            chips.innerHTML = selectedCourses.length
                ? selectedCourses.map((course) => `
                    <span class="chip">
                        <span>${course.name}</span>
                        <button type="button" class="chip__remove" data-course-id="${course.id}" data-target="teacher">×</button>
                    </span>
                `).join('')
                : '';
        }

        if (emptyState) {
            emptyState.style.display = this.state.selectedTeacherCourseIds.length ? 'none' : 'block';
        }
    },

    bindCourseChipActions() {
        document.querySelectorAll('.chip__remove').forEach((button) => {
            button.onclick = () => {
                const courseId = Number(button.dataset.courseId);
                const target = button.dataset.target;

                if (target === 'semester') {
                    this.state.selectedSemesterCourseIds = this.state.selectedSemesterCourseIds.filter((id) => Number(id) !== courseId);
                    this.renderSemesterCoursePicker();
                }

                if (target === 'teacher') {
                    this.state.selectedTeacherCourseIds = this.state.selectedTeacherCourseIds.filter((id) => Number(id) !== courseId);
                    this.renderTeacherCoursePicker();
                }
            };
        });
    },

    addSemesterCourseByName(courseName) {
        const course = this.getCourseByName(courseName);
        if (!course) {
            window.showToast('Pick a valid course from the suggestions.', 'error');
            return;
        }

        if (!this.state.selectedSemesterCourseIds.includes(course.id)) {
            this.state.selectedSemesterCourseIds.push(course.id);
            this.renderSemesterCoursePicker();
            this.bindCourseChipActions();
        }
    },

    addTeacherCourseByName(courseName) {
        const course = this.getCourseByName(courseName);
        if (!course) {
            window.showToast('Pick a valid course from the suggestions.', 'error');
            return;
        }

        if (!this.state.selectedTeacherCourseIds.includes(course.id)) {
            this.state.selectedTeacherCourseIds.push(course.id);
            this.renderTeacherCoursePicker();
            this.bindCourseChipActions();
        }
    },

    fillSemesterForm(group) {
        this.state.editingSemesterId = group.id;
        this.state.selectedSemesterCourseIds = (group.courses || []).map((course) => course.id);

        document.getElementById('group-name').value = group.name;
        document.getElementById('group-size').value = group.size;
        document.getElementById('semester-submit-btn').textContent = 'Save Semester';
        document.getElementById('semester-cancel-btn').style.display = 'inline-flex';

        this.renderSemesterCoursePicker();
        this.bindCourseChipActions();
    },

    resetSemesterForm() {
        this.state.editingSemesterId = null;
        this.state.selectedSemesterCourseIds = [];
        document.getElementById('form-group').reset();
        document.getElementById('semester-submit-btn').textContent = '+ Add Semester';
        document.getElementById('semester-cancel-btn').style.display = 'none';
        this.renderSemesterCoursePicker();
        this.bindCourseChipActions();
    },

    fillTeacherForm(instructor) {
        this.state.editingTeacherId = instructor.id;
        this.state.selectedTeacherCourseIds = (instructor.courses || []).map((course) => course.id);

        document.getElementById('inst-name').value = instructor.name;
        document.getElementById('teacher-submit-btn').textContent = 'Save Teacher';
        document.getElementById('teacher-cancel-btn').style.display = 'inline-flex';

        this.renderTeacherCoursePicker();
        this.bindCourseChipActions();
    },

    resetTeacherForm() {
        this.state.editingTeacherId = null;
        this.state.selectedTeacherCourseIds = [];
        document.getElementById('form-instructor').reset();
        document.getElementById('teacher-submit-btn').textContent = '+ Add Teacher';
        document.getElementById('teacher-cancel-btn').style.display = 'none';
        document.getElementById('teacher-course-search').value = '';
        this.renderTeacherCoursePicker();
        this.bindCourseChipActions();
    },

    async loadAllData() {
        try {
            const [courses, rooms, instructors, groups] = await Promise.all([
                api.get('/data/courses'),
                api.get('/data/rooms'),
                api.get('/data/instructors'),
                api.get('/data/groups')
            ]);

            this.state.courses = courses || [];
            this.state.rooms = rooms || [];
            this.state.instructors = instructors || [];
            this.state.semesters = groups || [];

            if (courses.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Sessions</th><th></th></tr>';
                courses.forEach((course) => {
                    h += `<tr><td>${course.name}</td><td>${course.sessions_per_week}</td><td><button data-id="${course.id}" data-type="course" class="btn small delete-btn">Delete</button></td></tr>`;
                });
                h += '</table>';
                document.getElementById('courses-list').innerHTML = h;
            } else {
                document.getElementById('courses-list').innerHTML = '<p class="empty-msg">No courses yet. Add one above.</p>';
            }

            if (rooms.length) {
                let h = '<table class="data-table"><tr><th>Name</th><th>Type</th><th>Capacity</th><th></th></tr>';
                rooms.forEach((room) => {
                    h += `<tr><td>${room.name}</td><td><span class="badge info">${room.room_type}</span></td><td>${room.capacity}</td><td><button data-id="${room.id}" data-type="room" class="btn small delete-btn">Delete</button></td></tr>`;
                });
                h += '</table>';
                document.getElementById('rooms-list').innerHTML = h;
            } else {
                document.getElementById('rooms-list').innerHTML = '<p class="empty-msg">No rooms yet. Add one above.</p>';
            }

            if (instructors.length) {
                let h = '<table class="data-table"><tr><th>Teacher Name</th><th>Courses</th><th></th></tr>';
                instructors.forEach((instructor) => {
                    h += `<tr><td>${instructor.name}</td><td>${(instructor.courses || []).map((course) => course.name).join(', ')}</td><td style="white-space:nowrap;"><button data-id="${instructor.id}" data-type="instructor" class="btn small edit-instructor-btn">Edit</button> <button data-id="${instructor.id}" data-type="instructor" class="btn small delete-btn">Delete</button></td></tr>`;
                });
                h += '</table>';
                document.getElementById('instructors-list').innerHTML = h;
            } else {
                document.getElementById('instructors-list').innerHTML = '<p class="empty-msg">No teachers yet. Add one above.</p>';
            }

            if (groups && groups.length) {
                let gh = '<table class="data-table"><tr><th>Semester</th><th>Size</th><th>Courses</th><th></th></tr>';
                groups.forEach((group) => {
                    gh += `<tr><td>${group.name}</td><td>${group.size}</td><td>${(group.courses || []).map((course) => course.name).join(', ')}</td><td style="white-space:nowrap;"><button data-id="${group.id}" data-type="group" class="btn small">Edit</button> <button data-id="${group.id}" data-type="group" class="btn small delete-btn">Delete</button></td></tr>`;
                });
                gh += '</table>';
                document.getElementById('groups-list').innerHTML = gh;
            } else {
                document.getElementById('groups-list').innerHTML = '<p class="empty-msg">No semesters yet. Add one above.</p>';
            }

            this.state.selectedSemesterCourseIds = this.state.selectedSemesterCourseIds.filter((courseId) => this.getCourseById(courseId));
            this.state.selectedTeacherCourseIds = this.state.selectedTeacherCourseIds.filter((courseId) => this.getCourseById(courseId));

            this.renderSemesterCoursePicker();
            this.renderTeacherCoursePicker();
            this.bindCourseChipActions();
        } catch (error) {
            window.showToast('Failed to load data: ' + error.message, 'error');
            console.error(error);
        }
    },

    setupForms() {
        const self = this;
        const semesterCourseSearch = document.getElementById('semester-course-search');
        const teacherCourseSearch = document.getElementById('teacher-course-search');

        const addSemesterCourseFromInput = () => {
            self.addSemesterCourseByName(semesterCourseSearch.value);
            semesterCourseSearch.value = '';
            semesterCourseSearch.focus();
        };

        const addTeacherCourseFromInput = () => {
            self.addTeacherCourseByName(teacherCourseSearch.value);
            teacherCourseSearch.value = '';
            teacherCourseSearch.focus();
        };

        document.getElementById('add-semester-course-btn').addEventListener('click', addSemesterCourseFromInput);
        document.getElementById('add-teacher-course-btn').addEventListener('click', addTeacherCourseFromInput);

        semesterCourseSearch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addSemesterCourseFromInput();
            }
        });

        teacherCourseSearch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTeacherCourseFromInput();
            }
        });

        document.getElementById('form-course').addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
                name: document.getElementById('course-name').value,
                sessions_per_week: parseInt(document.getElementById('course-sessions').value, 10)
            };

            try {
                await api.post('/data/courses', payload);
                window.showToast('Course added successfully!', 'success');
                event.target.reset();
                await self.loadAllData();
            } catch (error) {
                window.showToast('Error: ' + error.message, 'error');
            }
        });

        document.getElementById('form-room').addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = {
                name: document.getElementById('room-name').value,
                capacity: parseInt(document.getElementById('room-capacity').value, 10),
                room_type: document.getElementById('room-type').value
            };

            try {
                await api.post('/data/rooms', payload);
                window.showToast('Room added successfully!', 'success');
                event.target.reset();
                await self.loadAllData();
            } catch (error) {
                window.showToast('Error: ' + error.message, 'error');
            }
        });

        document.getElementById('form-instructor').addEventListener('submit', async (event) => {
            event.preventDefault();
            const selectedCourseIds = self.state.selectedTeacherCourseIds.slice();
            const payload = {
                name: document.getElementById('inst-name').value,
                course_ids: selectedCourseIds,
                group_ids: []
            };

            try {
                if (self.state.editingTeacherId) {
                    await api.put(`/data/instructors/${self.state.editingTeacherId}`, payload);
                    window.showToast('Teacher updated successfully!', 'success');
                } else {
                    await api.post('/data/instructors', payload);
                    window.showToast('Teacher added successfully!', 'success');
                }
                self.resetTeacherForm();
                await self.loadAllData();
            } catch (error) {
                window.showToast('Error: ' + error.message, 'error');
            }
        });

        document.getElementById('form-group').addEventListener('submit', async (event) => {
            event.preventDefault();
            const selectedCourseIds = self.state.selectedSemesterCourseIds.slice();
            const payload = {
                name: document.getElementById('group-name').value,
                size: parseInt(document.getElementById('group-size').value, 10),
                course_ids: selectedCourseIds
            };

            try {
                if (self.state.editingSemesterId) {
                    await api.put(`/data/groups/${self.state.editingSemesterId}`, payload);
                    window.showToast('Semester updated', 'success');
                } else {
                    await api.post('/data/groups', payload);
                    window.showToast('Semester added', 'success');
                }
                self.resetSemesterForm();
                await self.loadAllData();
            } catch (error) {
                window.showToast('Error: ' + error.message, 'error');
            }
        });

        document.getElementById('semester-cancel-btn').addEventListener('click', () => {
            self.resetSemesterForm();
        });

        document.getElementById('groups-list').addEventListener('click', async (event) => {
            const target = event.target;
            const groupId = Number(target.getAttribute('data-id'));
            if (!groupId) {
                return;
            }

            if (target.classList.contains('delete-btn')) {
                if (!confirm('Delete this semester?')) return;
                try {
                    await api.delete('/data/groups/' + groupId);
                    window.showToast('Deleted', 'success');
                    if (self.state.editingSemesterId === groupId) {
                        self.resetSemesterForm();
                    }
                    await self.loadAllData();
                } catch (error) {
                    window.showToast('Delete failed: ' + error.message, 'error');
                }
            }

            if (target.textContent.trim() === 'Edit') {
                const group = self.state.semesters.find((item) => Number(item.id) === groupId);
                if (group) {
                    self.fillSemesterForm(group);
                    document.getElementById('semester-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        document.getElementById('courses-list').addEventListener('click', async (event) => {
            if (event.target.classList.contains('delete-btn')) {
                const id = event.target.getAttribute('data-id');
                if (!confirm('Delete this course?')) return;
                try {
                    await api.delete('/data/courses/' + id);
                    window.showToast('Deleted', 'success');
                    await self.loadAllData();
                } catch (error) {
                    window.showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });

        document.getElementById('rooms-list').addEventListener('click', async (event) => {
            if (event.target.classList.contains('delete-btn')) {
                const id = event.target.getAttribute('data-id');
                if (!confirm('Delete this room?')) return;
                try {
                    await api.delete('/data/rooms/' + id);
                    window.showToast('Deleted', 'success');
                    await self.loadAllData();
                } catch (error) {
                    window.showToast('Delete failed: ' + error.message, 'error');
                }
            }
        });

        document.getElementById('teacher-cancel-btn').addEventListener('click', () => {
            self.resetTeacherForm();
        });

        document.getElementById('instructors-list').addEventListener('click', async (event) => {
            const target = event.target;
            const instId = Number(target.getAttribute('data-id'));
            if (!instId) return;

            if (target.classList.contains('delete-btn')) {
                if (!confirm('Delete this teacher?')) return;
                try {
                    await api.delete('/data/instructors/' + instId);
                    window.showToast('Deleted', 'success');
                    if (self.state.editingTeacherId === instId) {
                        self.resetTeacherForm();
                    }
                    await self.loadAllData();
                } catch (error) {
                    window.showToast('Delete failed: ' + error.message, 'error');
                }
            }

            if (target.classList.contains('edit-instructor-btn')) {
                const instructor = self.state.instructors.find((item) => Number(item.id) === instId);
                if (instructor) {
                    self.fillTeacherForm(instructor);
                    document.getElementById('instructor-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    }
};
