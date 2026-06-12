const ScheduleView = {
    state: {
        groups: [],
        courses: [],
        instructors: [],
        rooms: [],
        currentSchedules: {},
        currentGroupId: null,
        currentTitle: ''
    },

    render() {
        return `
            <div class="schedule-builder">
                <div class="schedule-builder__header">
                    <div>
                        <h3 style="margin-bottom:6px;">Schedule Output</h3>
                        <p class="schedule-builder__subtitle">Pick a batch, set the time range, choose class length, and build a fixed timetable. The generator schedules all batches together so teachers and rooms do not collide.</p>
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
                    Select a batch to preview its timetable.
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
            const hours24 = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12;
            return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
        };

        const hashText = (text) => {
            let hash = 0;
            for (let index = 0; index < text.length; index += 1) {
                hash = ((hash << 5) - hash) + text.charCodeAt(index);
                hash |= 0;
            }
            return Math.abs(hash);
        };

        const seededShuffle = (items, seedText) => {
            const result = items.slice();
            let seed = hashText(seedText) || 1;
            const random = () => {
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                return seed / 4294967296;
            };
            for (let index = result.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(random() * (index + 1));
                [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
            }
            return result;
        };

        const buildSlots = (startTime, endTime, slotMinutes) => {
            const startMinutes = minutesFromTime(startTime);
            const endMinutes = minutesFromTime(endTime);

            if (endMinutes <= startMinutes) {
                throw new Error('End time must be after start time.');
            }

            const rows = [];
            for (let cursor = startMinutes; cursor + slotMinutes <= endMinutes; cursor += slotMinutes) {
                rows.push({
                    startMinutes: cursor,
                    endMinutes: cursor + slotMinutes,
                    startLabel: timeFromMinutes(cursor),
                    endLabel: timeFromMinutes(cursor + slotMinutes)
                });
            }

            if (!rows.length) {
                throw new Error('The time range is too small for the chosen class length.');
            }

            return rows;
        };

        const roomOptionsForGroup = (group) => {
            const suitableRooms = this.state.rooms.filter((room) => Number(room.capacity || 0) >= Number(group.size || 0));
            return suitableRooms.length ? suitableRooms : this.state.rooms;
        };

        const instructorOptionsForSession = (courseId, groupId) => {
            const courseInstructors = this.state.instructors.filter((instructor) =>
                (instructor.courses || []).some((course) => course.id === courseId)
            );

            const groupPreferred = courseInstructors.filter((instructor) =>
                !instructor.groups || instructor.groups.length === 0 || instructor.groups.some((group) => group.id === groupId)
            );

            return groupPreferred.length ? groupPreferred : courseInstructors;
        };

        const buildSessionList = () => {
            const sessions = [];

            this.state.groups.forEach((group) => {
                const roomCount = roomOptionsForGroup(group).length || 0;
                (group.courses || []).forEach((course) => {
                    const sessionCount = Math.max(parseInt(course.sessions_per_week || 1, 10), 1);
                    const instructorCount = instructorOptionsForSession(course.id, group.id).length || 0;
                    const pressure = (roomCount || 99) + (instructorCount || 99) + sessionCount;

                    for (let index = 0; index < sessionCount; index += 1) {
                        sessions.push({
                            sessionKey: `${group.id}-${course.id}-${index}`,
                            groupId: group.id,
                            groupName: group.name,
                            groupSize: group.size,
                            courseId: course.id,
                            courseName: course.name,
                            instructorCandidates: instructorOptionsForSession(course.id, group.id),
                            roomCandidates: roomOptionsForGroup(group),
                            priority: pressure
                        });
                    }
                });
            });

            const buckets = new Map();
            sessions.forEach((session) => {
                const bucketKey = String(session.priority);
                if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
                buckets.get(bucketKey).push(session);
            });

            const ordered = [];
            Array.from(buckets.keys()).sort((a, b) => Number(a) - Number(b)).forEach((bucketKey) => {
                const bucket = buckets.get(bucketKey);
                ordered.push(...seededShuffle(bucket, bucketKey));
            });

            return ordered;
        };

        const allocateSchedule = (startTime, endTime, slotMinutes) => {
            const slots = buildSlots(startTime, endTime, slotMinutes);
            const slotCount = slots.length * days.length;
            const sessionList = buildSessionList();

            const groupGrids = new Map();
            const groupAssignments = new Map();
            this.state.groups.forEach((group) => {
                groupGrids.set(group.id, Array.from({ length: slots.length }, () => Array(days.length).fill(null)));
                groupAssignments.set(group.id, []);
            });

            const occupiedRooms = new Set();
            const occupiedInstructors = new Set();
            const occupiedGroups = new Set();

            let assignedCount = 0;
            let skippedCount = 0;

            sessionList.forEach((session, sessionIndex) => {
                const startOffset = (hashText(session.sessionKey) + sessionIndex) % slotCount;
                let placed = false;

                for (let attempt = 0; attempt < slotCount; attempt += 1) {
                    const slotIndex = (startOffset + attempt) % slotCount;
                    const rowIndex = Math.floor(slotIndex / days.length);
                    const dayIndex = slotIndex % days.length;
                    const slot = slots[rowIndex];
                    const slotKey = `${days[dayIndex]}|${slot.startLabel}`;
                    const groupKey = `${session.groupId}|${slotKey}`;

                    if (occupiedGroups.has(groupKey)) {
                        continue;
                    }

                    const room = session.roomCandidates.find((candidate) => !occupiedRooms.has(`${candidate.id}|${slotKey}`));
                    if (!room) {
                        continue;
                    }

                    const instructor = session.instructorCandidates.find((candidate) => !occupiedInstructors.has(`${candidate.id}|${slotKey}`));

                    occupiedGroups.add(groupKey);
                    occupiedRooms.add(`${room.id}|${slotKey}`);
                    if (instructor) {
                        occupiedInstructors.add(`${instructor.id}|${slotKey}`);
                    }

                    const grid = groupGrids.get(session.groupId);
                    const assignment = {
                        courseId: session.courseId,
                        courseName: session.courseName,
                        instructorName: instructor ? instructor.name : 'TBA',
                        roomName: room.name,
                        startLabel: slot.startLabel,
                        endLabel: slot.endLabel,
                        dayName: days[dayIndex]
                    };

                    grid[rowIndex][dayIndex] = assignment;
                    groupAssignments.get(session.groupId).push(assignment);
                    assignedCount += 1;
                    placed = true;
                    break;
                }

                if (!placed) {
                    skippedCount += 1;
                }
            });

            return {
                slots,
                groupGrids,
                groupAssignments,
                assignedCount,
                skippedCount,
                totalSessions: sessionList.length
            };
        };

        const renderGroupGrid = (groupId) => {
            const scheduleData = this.state.currentSchedules[groupId];
            const group = this.state.groups.find((item) => item.id === groupId);

            if (!group || !scheduleData) {
                scheduleOutput.innerHTML = '<div class="empty-msg" style="padding: 28px 0;">Build the timetable to preview a batch grid.</div>';
                return;
            }

            const rowsHtml = scheduleData.slots.map((slot, rowIndex) => {
                const cells = days.map((dayName, dayIndex) => {
                    const cell = scheduleData.groupGrids.get(groupId)[rowIndex][dayIndex];
                    if (!cell) {
                        return '<td class="timetable-cell timetable-cell--empty"></td>';
                    }

                    return `
                        <td class="timetable-cell timetable-cell--filled">
                            <div class="timetable-course">${cell.courseName}</div>
                            <div class="timetable-meta">${cell.instructorName}</div>
                            <div class="timetable-meta">${cell.roomName}</div>
                        </td>
                    `;
                }).join('');

                return `<tr><th class="timetable-time">${slot.startLabel}<span>${slot.endLabel}</span></th>${cells}</tr>`;
            }).join('');

            scheduleOutput.innerHTML = `
                <div class="timetable-frame">
                    <table class="timetable-grid">
                        <thead>
                            <tr>
                                <th class="timetable-corner">Time</th>
                                ${days.map((day) => `<th>${day}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            `;

            this.state.currentGroupId = groupId;
            this.state.currentTitle = `${group.name} timetable`;

            scheduleSummary.innerHTML = `
                <strong>${group.name}</strong>
                <span>${group.size} students</span>
                <span>${(group.courses || []).length} course(s)</span>
                <span>${scheduleData.assignedCount}/${scheduleData.totalSessions} session(s) placed</span>
                ${scheduleData.skippedCount ? `<span>${scheduleData.skippedCount} skipped</span>` : ''}
            `;
        };

        const renderEmptyState = (message) => {
            scheduleOutput.innerHTML = `<div class="empty-msg" style="padding: 28px 0;">${message}</div>`;
            scheduleSummary.textContent = message;
            this.state.currentSchedules = {};
            this.state.currentGroupId = null;
            this.state.currentTitle = '';
        };

        try {
            const [groups, courses, instructors, rooms] = await Promise.all([
                api.get('/data/groups'),
                api.get('/data/courses'),
                api.get('/data/instructors'),
                api.get('/data/rooms')
            ]);

            this.state.groups = groups || [];
            this.state.courses = courses || [];
            this.state.instructors = instructors || [];
            this.state.rooms = rooms || [];

            if (this.state.groups.length) {
                scheduleGroup.innerHTML = this.state.groups.map((group) => `<option value="${group.id}">${group.name}</option>`).join('');
                scheduleGroup.value = String(this.state.groups[0].id);
                scheduleSummary.innerHTML = `
                    <strong>${this.state.groups[0].name}</strong>
                    <span>${this.state.groups[0].size} students</span>
                    <span>${(this.state.groups[0].courses || []).length} course(s)</span>
                `;
            } else {
                scheduleGroup.innerHTML = '<option value="">No batches available</option>';
                renderEmptyState('Add a batch first, then build the timetable.');
            }

            const updateSummary = () => {
                const group = this.state.groups.find((item) => String(item.id) === scheduleGroup.value);
                if (!group) {
                    renderEmptyState('Select a batch to preview the timetable.');
                    return;
                }

                const existing = this.state.currentSchedules[group.id];
                if (existing) {
                    renderGroupGrid(group.id);
                } else {
                    scheduleSummary.innerHTML = `
                        <strong>${group.name}</strong>
                        <span>${group.size} students</span>
                        <span>${(group.courses || []).length} course(s)</span>
                    `;
                }
            };

            scheduleGroup.addEventListener('change', updateSummary);

            document.getElementById('build-schedule-btn').addEventListener('click', () => {
                if (!this.state.groups.length) {
                    window.showToast('Add at least one batch first.', 'error');
                    return;
                }

                const startTime = document.getElementById('schedule-start').value || '09:00';
                const endTime = document.getElementById('schedule-end').value || '15:30';
                const slotMinutes = parseInt(document.getElementById('schedule-length').value, 10) || 40;

                try {
                    const allocation = allocateSchedule(startTime, endTime, slotMinutes);
                    this.state.currentSchedules = {};
                    allocation.groupGrids.forEach((grid, groupId) => {
                        this.state.currentSchedules[groupId] = {
                            slots: allocation.slots,
                            groupGrids: allocation.groupGrids,
                            groupAssignments: allocation.groupAssignments,
                            assignedCount: allocation.assignedCount,
                            skippedCount: allocation.skippedCount,
                            totalSessions: allocation.totalSessions
                        };
                    });

                    const selectedGroupId = parseInt(scheduleGroup.value, 10) || this.state.groups[0].id;
                    renderGroupGrid(selectedGroupId);

                    if (allocation.skippedCount > 0) {
                        window.showToast(`Built timetable with ${allocation.skippedCount} unplaced session(s). Add more time slots, rooms, or teachers.`, 'error');
                    } else {
                        window.showToast('Timetable built successfully.', 'success');
                    }
                } catch (error) {
                    console.error(error);
                    window.showToast(error.message, 'error');
                }
            });

            document.getElementById('print-schedule-btn').addEventListener('click', () => {
                const groupId = this.state.currentGroupId || (scheduleGroup.value ? parseInt(scheduleGroup.value, 10) : null);
                const group = this.state.groups.find((item) => item.id === groupId);
                const scheduleData = groupId ? this.state.currentSchedules[groupId] : null;

                if (!group || !scheduleData) {
                    window.showToast('Build a timetable before printing.', 'error');
                    return;
                }

                const daysForPrint = days;
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
                html += '<table><thead><tr><th>Time</th>' + daysForPrint.map((day) => `<th>${day}</th>`).join('') + '</tr></thead><tbody>';
                scheduleData.slots.forEach((slot, rowIndex) => {
                    html += `<tr><th class="time">${slot.startLabel} - ${slot.endLabel}</th>`;
                    daysForPrint.forEach((dayName, dayIndex) => {
                        const cell = scheduleData.groupGrids.get(group.id)[rowIndex][dayIndex];
                        if (cell) {
                            html += `<td><div class="course">${cell.courseName}</div><div class="meta">${cell.instructorName}</div><div class="meta">${cell.roomName}</div></td>`;
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