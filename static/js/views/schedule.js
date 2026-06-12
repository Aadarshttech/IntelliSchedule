const ScheduleView = {
    state: {
        groups: [],
        courses: [],
        instructors: [],
        currentGrid: null,
        currentTitle: ''
    },

    render() {
        return `
            <div class="card schedule-builder">
                <div class="schedule-builder__header">
                    <div>
                        <h3 style="margin-bottom:6px;">Schedule Output</h3>
                        <p class="schedule-builder__subtitle">Pick a batch, set the time range, choose class length, and generate a fixed weekly timetable.</p>
                    </div>
                    <div class="schedule-builder__actions">
                        <button class="btn primary" id="build-schedule-btn">Build Timetable</button>
                        <button class="btn" id="print-schedule-btn">Print View</button>
                    </div>
                </div>

                <div class="schedule-controls">
                    <div class="schedule-control">
                        <label for="schedule-group">Batch</label>
                        <select id="schedule-group">
                            <option value="">Loading batches...</option>
                        </select>
                    </div>
                    <div class="schedule-control">
                        <label for="schedule-start">Start Time</label>
                        <input type="time" id="schedule-start" value="09:00">
                    </div>
                    <div class="schedule-control">
                        <label for="schedule-end">End Time</label>
                        <input type="time" id="schedule-end" value="15:30">
                    </div>
                    <div class="schedule-control">
                        <label for="schedule-length">Class Length (min)</label>
                        <input type="number" id="schedule-length" min="15" step="5" value="40">
                    </div>
                </div>

                <div class="schedule-summary" id="schedule-summary">
                    Select a batch to see its courses.
                </div>

                <div id="schedule-output" class="schedule-output">
                    <div class="empty-msg" style="padding: 28px 0;">Build a timetable to preview the weekly grid.</div>
                </div>
            </div>
        `;
    },

    async init() {
        const scheduleGroup = document.getElementById('schedule-group');
        const scheduleSummary = document.getElementById('schedule-summary');
        const scheduleOutput = document.getElementById('schedule-output');

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        const minutesFromTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return (hours * 60) + minutes;
        };

        const timeFromMinutes = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
        };

        const instructorNameForCourse = (courseId) => {
            const match = this.state.instructors.find((instructor) =>
                (instructor.courses || []).some((course) => course.id === courseId)
            );
            return match ? match.name : '';
        };

        const buildSessionQueue = (group) => {
            const queue = [];
            (group.courses || []).forEach((course) => {
                const sessions = Math.max(parseInt(course.sessions_per_week || 1, 10), 1);
                for (let index = 0; index < sessions; index += 1) {
                    queue.push({
                        courseId: course.id,
                        courseName: course.name,
                        instructorName: instructorNameForCourse(course.id)
                    });
                }
            });
            return queue;
        };

        const renderGrid = (group, startTime, endTime, slotMinutes) => {
            const startMinutes = minutesFromTime(startTime);
            const endMinutes = minutesFromTime(endTime);

            if (endMinutes <= startMinutes) {
                throw new Error('End time must be after start time.');
            }

            if (slotMinutes < 15) {
                throw new Error('Class length should be at least 15 minutes.');
            }

            const rows = [];
            for (let cursor = startMinutes; cursor + slotMinutes <= endMinutes; cursor += slotMinutes) {
                rows.push({
                    startLabel: timeFromMinutes(cursor),
                    endLabel: timeFromMinutes(cursor + slotMinutes)
                });
            }

            const queue = buildSessionQueue(group);
            const cells = rows.length * days.length;
            const timetable = Array.from({ length: rows.length }, () => Array(days.length).fill(null));

            for (let index = 0; index < Math.min(queue.length, cells); index += 1) {
                const rowIndex = Math.floor(index / days.length);
                const dayIndex = index % days.length;
                timetable[rowIndex][dayIndex] = queue[index];
            }

            if (queue.length > cells) {
                window.showToast('Not enough timetable slots for all sessions. Some classes were left out.', 'error');
            }

            const header = days.map((day) => `<th>${day}</th>`).join('');
            let rowsHtml = '';

            rows.forEach((row, rowIndex) => {
                rowsHtml += `<tr><th class="timetable-time">${row.startLabel}<span>${row.endLabel}</span></th>`;
                days.forEach((day, dayIndex) => {
                    const cell = timetable[rowIndex][dayIndex];
                    if (cell) {
                        rowsHtml += `
                            <td class="timetable-cell timetable-cell--filled">
                                <div class="timetable-course">${cell.courseName}</div>
                                <div class="timetable-meta">${cell.instructorName || 'TBA'}</div>
                            </td>
                        `;
                    } else {
                        rowsHtml += `<td class="timetable-cell timetable-cell--empty"></td>`;
                    }
                });
                rowsHtml += '</tr>';
            });

            const groupName = group.name;
            this.state.currentTitle = `${groupName} timetable`;
            this.state.currentGrid = { group, startTime, endTime, slotMinutes, rows, timetable };

            scheduleSummary.innerHTML = `
                <strong>${groupName}</strong>
                <span>${group.size} students</span>
                <span>${group.courses.length} course(s)</span>
                <span>${rows.length} time slot(s) across ${days.length} days</span>
            `;

            scheduleOutput.innerHTML = `
                <div class="timetable-frame">
                    <table class="timetable-grid">
                        <thead>
                            <tr>
                                <th class="timetable-corner">Time</th>
                                ${header}
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        };

        const renderEmptyState = (message) => {
            scheduleOutput.innerHTML = `<div class="empty-msg" style="padding: 28px 0;">${message}</div>`;
            scheduleSummary.textContent = message;
            this.state.currentGrid = null;
            this.state.currentTitle = '';
        };

        try {
            const [groups, courses, instructors] = await Promise.all([
                api.get('/data/groups'),
                api.get('/data/courses'),
                api.get('/data/instructors')
            ]);

            this.state.groups = groups || [];
            this.state.courses = courses || [];
            this.state.instructors = instructors || [];

            if (this.state.groups.length) {
                scheduleGroup.innerHTML = this.state.groups.map((group) => `<option value="${group.id}">${group.name}</option>`).join('');
                const firstGroup = this.state.groups[0];
                scheduleGroup.value = String(firstGroup.id);
                scheduleSummary.innerHTML = `
                    <strong>${firstGroup.name}</strong>
                    <span>${firstGroup.size} students</span>
                    <span>${(firstGroup.courses || []).length} course(s)</span>
                `;
            } else {
                scheduleGroup.innerHTML = '<option value="">No batches available</option>';
                renderEmptyState('Add a batch first, then build the timetable.');
            }

            const updateSummary = () => {
                const group = this.state.groups.find((item) => String(item.id) === scheduleGroup.value);
                if (!group) {
                    renderEmptyState('Select a batch to build the timetable.');
                    return;
                }
                scheduleSummary.innerHTML = `
                    <strong>${group.name}</strong>
                    <span>${group.size} students</span>
                    <span>${(group.courses || []).length} course(s)</span>
                `;
            };

            scheduleGroup.addEventListener('change', updateSummary);

            document.getElementById('build-schedule-btn').addEventListener('click', () => {
                const group = this.state.groups.find((item) => String(item.id) === scheduleGroup.value);
                if (!group) {
                    window.showToast('Please select a batch first.', 'error');
                    return;
                }

                const startTime = document.getElementById('schedule-start').value || '09:00';
                const endTime = document.getElementById('schedule-end').value || '15:30';
                const slotMinutes = parseInt(document.getElementById('schedule-length').value, 10) || 40;

                try {
                    renderGrid(group, startTime, endTime, slotMinutes);
                    window.showToast('Timetable built successfully.', 'success');
                } catch (error) {
                    window.showToast(error.message, 'error');
                }
            });

            document.getElementById('print-schedule-btn').addEventListener('click', () => {
                if (!this.state.currentGrid) {
                    window.showToast('Build a timetable before printing.', 'error');
                    return;
                }

                const { group, rows, timetable } = this.state.currentGrid;
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                let html = `<!doctype html><html><head><meta charset="utf-8"><title>${this.state.currentTitle}</title><style>
                    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111827}
                    h1{font-size:22px;margin:0 0 8px}
                    p{margin:0 0 16px;color:#4b5563}
                    table{width:100%;border-collapse:collapse}
                    th,td{border:1px solid #d1d5db;padding:10px;vertical-align:top;text-align:center}
                    thead th{background:#eef2ff}
                    .time{font-weight:700;text-align:left;white-space:nowrap}
                    .course{font-weight:700;margin-bottom:4px}
                    .meta{font-size:12px;color:#6b7280}
                </style></head><body>`;
                html += `<h1>${group.name} timetable</h1><p>${group.size} students</p>`;
                html += '<table><thead><tr><th>Time</th>' + days.map((day) => `<th>${day}</th>`).join('') + '</tr></thead><tbody>';
                rows.forEach((row, rowIndex) => {
                    html += `<tr><th class="time">${row.startLabel} - ${row.endLabel}</th>`;
                    days.forEach((day, dayIndex) => {
                        const cell = timetable[rowIndex][dayIndex];
                        if (cell) {
                            html += `<td><div class="course">${cell.courseName}</div><div class="meta">${cell.instructorName || 'TBA'}</div></td>`;
                        } else {
                            html += '<td></td>';
                        }
                    });
                    html += '</tr>';
                });
                html += '</tbody></table></body></html>';

                const win = window.open('', '_blank');
                win.document.write(html);
                win.document.close();
            });

            if (this.state.groups.length) {
                document.getElementById('build-schedule-btn').click();
            }
        } catch (error) {
            console.error(error);
            renderEmptyState('Unable to load batches. Add your data and try again.');
        }
    }
};