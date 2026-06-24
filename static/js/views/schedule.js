const ScheduleView = {
    state: {
        groups: [],
        courses: [],
        instructors: [],
        rooms: [],
        currentSchedules: {},
        currentGroupId: null,
        currentTitle: '',
        seed: 0
    },

    render() {
        return `
            <div class="schedule-builder">
                <div class="schedule-builder__header">
                    <div>
                        <h3 style="margin-bottom:6px;">Schedule Output</h3>
                        <p class="schedule-builder__subtitle">Pick a batch, set the time range, choose class length and break time, then build a fixed timetable. The generator schedules all batches together so teachers and rooms do not collide.</p>
                    </div>
                    <div class="schedule-builder__actions">
                        <button class="btn primary" id="build-schedule-btn">Build Timetable</button>
                        <button class="btn" id="shuffle-schedule-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                            Shuffle Timetable
                        </button>
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
                        <input type="number" id="schedule-length" min="15" step="5" value="120">
                    </div>
                    <div class="schedule-control">
                        <label for="schedule-break-start">Break Start</label>
                        <input type="time" id="schedule-break-start" value="12:00">
                    </div>
                    <div class="schedule-control">
                        <label for="schedule-break-duration">Break Length (min)</label>
                        <input type="number" id="schedule-break-duration" min="0" step="5" value="30">
                    </div>
                </div>

                <div class="schedule-summary" id="schedule-summary">
                    Select a batch to preview its timetable.
                </div>

                <div class="schedule-hint">
                    Drag class cells to move/swap sessions. Drag break cells to move them independently.
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

        const inputTimeFromMinutes = (totalMinutes) => {
            const hours24 = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

        const buildSlots = (startTime, endTime, slotMinutes, breakStartTime, breakDurationMinutes) => {
            const startMinutes = minutesFromTime(startTime);
            const endMinutes = minutesFromTime(endTime);
            const breakDuration = Math.max(Number(breakDurationMinutes || 0), 0);

            let breakStartMinutes = null;
            let breakEndMinutes = null;
            if (breakDuration > 0) {
                breakStartMinutes = minutesFromTime(breakStartTime || '12:00');
                
                if (breakStartMinutes < startMinutes || breakStartMinutes >= endMinutes) {
                    let alternateMinutes = (breakStartMinutes + 12 * 60) % (24 * 60);
                    if (alternateMinutes >= startMinutes && alternateMinutes < endMinutes) {
                        breakStartMinutes = alternateMinutes;
                    } else {
                        throw new Error('Break start must be inside the timetable range. Please check your AM/PM settings.');
                    }
                }
                
                breakEndMinutes = Math.min(breakStartMinutes + breakDuration, endMinutes);
            }

            if (endMinutes <= startMinutes) {
                throw new Error('End time must be after start time.');
            }

            const rows = [];
            let cursor = startMinutes;
            while (cursor < endMinutes) {
                if (breakDuration > 0 && cursor < breakEndMinutes && (cursor + slotMinutes) > breakStartMinutes) {
                    rows.push({
                        startMinutes: breakStartMinutes,
                        endMinutes: breakEndMinutes,
                        startLabel: timeFromMinutes(breakStartMinutes),
                        endLabel: timeFromMinutes(breakEndMinutes),
                        isBreak: true,
                        breakLabel: ''
                    });
                    cursor = breakEndMinutes;
                } else {
                    if (cursor + slotMinutes <= endMinutes) {
                        rows.push({
                            startMinutes: cursor,
                            endMinutes: cursor + slotMinutes,
                            startLabel: timeFromMinutes(cursor),
                            endLabel: timeFromMinutes(cursor + slotMinutes),
                            isBreak: false,
                            breakLabel: ''
                        });
                        cursor += slotMinutes;
                    } else {
                        break;
                    }
                }
            }

            if (!rows.length) {
                throw new Error('The time range is too small for the chosen class length.');
            }

            return rows;
        };

        const roomOptionsForGroup = (group) => {
            let targetRoomName = '';
            if (group.name.includes('1st Semester')) targetRoomName = 'AI 103';
            else if (group.name.includes('3rd Semester')) targetRoomName = '103';
            else if (group.name.includes('4th Semester')) targetRoomName = 'G001';

            if (targetRoomName) {
                const exactRoom = this.state.rooms.find(r => r.name === targetRoomName);
                if (exactRoom) return [exactRoom];
            }

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

            const instructorTotalSessions = new Map();
            this.state.groups.forEach(g => {
                (g.courses || []).forEach(c => {
                    const count = Math.max(parseInt(c.sessions_per_week || 1, 10), 1);
                    const instructors = instructorOptionsForSession(c.id, g.id);
                    instructors.forEach(inst => {
                        instructorTotalSessions.set(inst.id, (instructorTotalSessions.get(inst.id) || 0) + count);
                    });
                });
            });

            this.state.groups.forEach((group) => {
                const roomCount = roomOptionsForGroup(group).length || 0;
                (group.courses || []).forEach((course) => {
                    const sessionCount = Math.max(parseInt(course.sessions_per_week || 1, 10), 1);
                    const instructors = instructorOptionsForSession(course.id, group.id);
                    const instructorCount = instructors.length || 0;
                    
                    const maxCommitment = instructors.length ? Math.max(...instructors.map(i => instructorTotalSessions.get(i.id) || 0)) : 0;
                    const pressure = (roomCount * 10) + (instructorCount * 10) - maxCommitment;

                    for (let index = 0; index < sessionCount; index += 1) {
                        sessions.push({
                            sessionKey: `${group.id}-${course.id}-${index}`,
                            groupId: group.id,
                            groupName: group.name,
                            groupSize: group.size,
                            courseId: course.id,
                            courseName: course.name,
                            instructorCandidates: instructors,
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
                const seedText = bucketKey + (this.state.seed ? String(this.state.seed) : '');
                ordered.push(...seededShuffle(bucket, seedText));
            });

            return ordered;
        };

        const allocateSchedule = (startTime, endTime, slotMinutes, breakStartTime, breakDurationMinutes) => {
            const slots = buildSlots(startTime, endTime, slotMinutes, breakStartTime, breakDurationMinutes);
            const sessionList = buildSessionList();

            const candidateSlots = [];
            slots.forEach((slot, rowIndex) => {
                if (slot.isBreak) {
                    return;
                }
                days.forEach((_, dayIndex) => {
                    candidateSlots.push({ rowIndex, dayIndex });
                });
            });

            const slotCount = candidateSlots.length;
            if (!slotCount) {
                throw new Error('No teaching slots available. Reduce break length or increase timetable range.');
            }

            const groupGrids = new Map();
            const breakGrids = new Map();
            const groupAssignments = new Map();
            this.state.groups.forEach((group) => {
                groupGrids.set(group.id, Array.from({ length: slots.length }, () => Array(days.length).fill(null)));
                const breakGrid = Array.from({ length: slots.length }, (_, rowIndex) =>
                    Array.from({ length: days.length }, () => Boolean(slots[rowIndex].isBreak))
                );
                breakGrids.set(group.id, breakGrid);
                groupAssignments.set(group.id, []);
            });

            const occupiedRooms = new Set();
            const occupiedInstructors = new Set();
            const occupiedGroups = new Set();

            let assignedCount = 0;
            let skippedCount = 0;

            sessionList.forEach((session, sessionIndex) => {
                const startOffset = (hashText(session.sessionKey) + sessionIndex + (this.state.seed || 0)) % slotCount;
                let placed = false;

                for (let attempt = 0; attempt < slotCount; attempt += 1) {
                    const slotIndex = (startOffset + attempt) % slotCount;
                    const candidate = candidateSlots[slotIndex];
                    const rowIndex = candidate.rowIndex;
                    const dayIndex = candidate.dayIndex;
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

                    // Treat instructor as a hard constraint: if the course has
                    // assigned teachers but none are free at this slot, skip it
                    // to avoid cross-batch teacher collisions.
                    if (session.instructorCandidates.length > 0 && !instructor) {
                        continue;
                    }

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
                breakGrids,
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

            const parseCourseName = (fullNameRaw) => {
                const match = fullNameRaw.match(/(.+?)(?:\s*\((.*?)\))?\s*\[(.*?)\]/);
                if (match) {
                    return {
                        title: match[1].trim(),
                        short: match[2] ? match[2].trim() : '',
                        code: match[3].trim()
                    };
                }
                return { title: fullNameRaw, short: '', code: fullNameRaw };
            };

            const breakGrid = scheduleData.breakGrids.get(groupId);
            const rowsHtml = days.map((dayName, dayIndex) => {
                const cells = scheduleData.slots.map((slot, rowIndex) => {
                    if (breakGrid[rowIndex][dayIndex]) {
                        return `
                            <td class="timetable-cell timetable-cell--break" data-cell-type="break" data-slot-index="${rowIndex}" data-day-index="${dayIndex}" draggable="true">
                                <div class="timetable-break">Break</div>
                            </td>
                        `;
                    }

                    const cell = scheduleData.groupGrids.get(groupId)[rowIndex][dayIndex];
                    if (!cell) {
                        return `<td class="timetable-cell timetable-cell--empty" data-cell-type="empty" data-slot-index="${rowIndex}" data-day-index="${dayIndex}"></td>`;
                    }

                    const parsed = parseCourseName(cell.courseName);
                    const displayTitle = parsed.code + (parsed.short ? `(${parsed.short})` : '');

                    return `
                        <td class="timetable-cell timetable-cell--filled" data-cell-type="class" data-slot-index="${rowIndex}" data-day-index="${dayIndex}" draggable="true" style="font-weight: 600; text-align: center;">
                            <div class="timetable-course" style="color: var(--accent-primary); font-size: 1.05rem;">${displayTitle}</div>
                        </td>
                    `;
                }).join('');

                return `<tr><th class="timetable-day">${dayName}</th>${cells}</tr>`;
            }).join('');

            const assignments = scheduleData.groupAssignments.get(groupId) || [];
            const uniqueCourses = new Map();
            assignments.forEach(a => {
                if (!uniqueCourses.has(a.courseId)) {
                    uniqueCourses.set(a.courseId, a);
                }
            });
            
            const facultyRowsHtml = Array.from(uniqueCourses.values()).map(a => {
                const parsed = parseCourseName(a.courseName);
                const fullCourseTitle = parsed.title + (parsed.short ? ` (${parsed.short})` : '');
                return `
                    <tr>
                        <td style="padding: 12px 16px; border: 1px solid var(--border-color); text-align: center;">${parsed.code}</td>
                        <td style="padding: 12px 16px; border: 1px solid var(--border-color); text-align: center;">${fullCourseTitle}</td>
                        <td style="padding: 12px 16px; border: 1px solid var(--border-color); text-align: center;">${a.instructorName}</td>
                    </tr>
                `;
            }).join('');

            const facultyTableHtml = uniqueCourses.size > 0 ? `
                <div style="margin-top: 32px;">
                    <h4 style="margin-bottom: 16px; font-size: 1.2rem; color: var(--text-primary);">Faculty Assignments:</h4>
                    <table style="width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.05);">
                                <th style="padding: 12px 16px; border: 1px solid var(--border-color); font-weight: 600; text-align: center;">Course Code</th>
                                <th style="padding: 12px 16px; border: 1px solid var(--border-color); font-weight: 600; text-align: center;">Course Name</th>
                                <th style="padding: 12px 16px; border: 1px solid var(--border-color); font-weight: 600; text-align: center;">Instructor Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${facultyRowsHtml}
                        </tbody>
                    </table>
                </div>
            ` : '';

            scheduleOutput.innerHTML = `
                <div class="timetable-frame">
                    <table class="timetable-grid">
                        <thead>
                            <tr>
                                <th class="timetable-corner">Day</th>
                                ${scheduleData.slots.map((slot, slotIndex) => `<th class="timetable-time-head" data-slot-index="${slotIndex}">${slot.startLabel} - ${slot.endLabel}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
                ${facultyTableHtml}
            `;

            bindGridEditing(groupId);

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

        const moveClassSession = (groupId, fromSlotIndex, fromDayIndex, toSlotIndex, toDayIndex) => {
            const scheduleData = this.state.currentSchedules[groupId];
            if (!scheduleData) {
                return { ok: false };
            }

            const breakGrid = scheduleData.breakGrids.get(groupId);
            if (breakGrid[toSlotIndex][toDayIndex]) {
                return { ok: false, error: 'Cannot move a class into a break slot.' };
            }

            const grid = scheduleData.groupGrids.get(groupId);
            const source = grid[fromSlotIndex][fromDayIndex];
            if (!source) {
                return { ok: false };
            }

            // Check if the same class already exists on the target day for this batch
            if (fromDayIndex !== toDayIndex) {
                for (let sIdx = 0; sIdx < scheduleData.slots.length; sIdx++) {
                    if (sIdx === toSlotIndex) continue;
                    const existingCell = grid[sIdx][toDayIndex];
                    if (existingCell && existingCell.courseName === source.courseName) {
                        return { ok: false, error: `Batch already has ${source.courseName} on this day.` };
                    }
                }
                
                const target = grid[toSlotIndex][toDayIndex] || null;
                if (target) {
                    for (let sIdx = 0; sIdx < scheduleData.slots.length; sIdx++) {
                        if (sIdx === fromSlotIndex) continue;
                        const existingCell = grid[sIdx][fromDayIndex];
                        if (existingCell && existingCell.courseName === target.courseName) {
                            return { ok: false, error: `Swap blocked: Batch already has ${target.courseName} on that day.` };
                        }
                    }
                }
            }

            // Check cross-batch teacher collision at target slot
            const sourceInstructor = source.instructorName;
            const sourceRoom = source.roomName;
            
            const currentDsl = localStorage.getItem('current_dsl_rules') || '';
            const targetDay = days[toDayIndex];
            const targetSlot = scheduleData.slots[toSlotIndex];
            
            if (sourceInstructor) {
                const instructorNameSafe = sourceInstructor.replace(/\s+/g, '_');
                const afternoonRegex = new RegExp(`prefer\\s+instructor_afternoon\\s+${instructorNameSafe}\\s+${targetDay}`, 'gi');
                if (afternoonRegex.test(currentDsl) && targetSlot.startMinutes < 720) {
                    return {
                        ok: false,
                        error: `Warning: Based on your constraints, ${sourceInstructor} prefers afternoon classes on ${targetDay}!`
                    };
                }
                const morningRegex = new RegExp(`prefer\\s+instructor_morning\\s+${instructorNameSafe}\\s+${targetDay}`, 'gi');
                if (morningRegex.test(currentDsl) && targetSlot.startMinutes >= 720) {
                    return {
                        ok: false,
                        error: `Warning: Based on your constraints, ${sourceInstructor} prefers morning classes on ${targetDay}!`
                    };
                }
            }

            if (sourceInstructor && sourceInstructor !== 'TBA') {
                for (const [otherGroupId, otherData] of Object.entries(this.state.currentSchedules)) {
                    const otherGid = parseInt(otherGroupId, 10);
                    if (otherGid === groupId) continue;
                    const otherGrid = otherData.groupGrids.get(otherGid);
                    if (!otherGrid) continue;
                    const otherCell = otherGrid[toSlotIndex] && otherGrid[toSlotIndex][toDayIndex];
                    if (otherCell && otherCell.instructorName === sourceInstructor) {
                        const otherGroup = this.state.groups.find((g) => g.id === otherGid);
                        const otherGroupName = otherGroup ? otherGroup.name : `Batch #${otherGid}`;
                        return {
                            ok: false,
                            error: `Teacher "${sourceInstructor}" is already teaching "${otherCell.courseName}" for ${otherGroupName} at this time.`
                        };
                    }
                }
            }

            // Check cross-batch room collision at target slot
            if (sourceRoom) {
                for (const [otherGroupId, otherData] of Object.entries(this.state.currentSchedules)) {
                    const otherGid = parseInt(otherGroupId, 10);
                    if (otherGid === groupId) continue;
                    const otherGrid = otherData.groupGrids.get(otherGid);
                    if (!otherGrid) continue;
                    const otherCell = otherGrid[toSlotIndex] && otherGrid[toSlotIndex][toDayIndex];
                    if (otherCell && otherCell.roomName === sourceRoom) {
                        const otherGroup = this.state.groups.find((g) => g.id === otherGid);
                        const otherGroupName = otherGroup ? otherGroup.name : `Batch #${otherGid}`;
                        return {
                            ok: false,
                            error: `Room "${sourceRoom}" is already used by "${otherCell.courseName}" for ${otherGroupName} at this time.`
                        };
                    }
                }
            }

            // If swapping with an existing class at target, also validate the swapped class at the source slot
            const target = grid[toSlotIndex][toDayIndex] || null;
            if (target) {
                const targetInstructor = target.instructorName;
                const targetRoom = target.roomName;
                if (targetInstructor && targetInstructor !== 'TBA') {
                    for (const [otherGroupId, otherData] of Object.entries(this.state.currentSchedules)) {
                        const otherGid = parseInt(otherGroupId, 10);
                        if (otherGid === groupId) continue;
                        const otherGrid = otherData.groupGrids.get(otherGid);
                        if (!otherGrid) continue;
                        const otherCell = otherGrid[fromSlotIndex] && otherGrid[fromSlotIndex][fromDayIndex];
                        if (otherCell && otherCell.instructorName === targetInstructor) {
                            const otherGroup = this.state.groups.find((g) => g.id === otherGid);
                            const otherGroupName = otherGroup ? otherGroup.name : `Batch #${otherGid}`;
                            return {
                                ok: false,
                                error: `Swap blocked: Teacher "${targetInstructor}" is already teaching "${otherCell.courseName}" for ${otherGroupName} at the source slot.`
                            };
                        }
                    }
                }
                if (targetRoom) {
                    for (const [otherGroupId, otherData] of Object.entries(this.state.currentSchedules)) {
                        const otherGid = parseInt(otherGroupId, 10);
                        if (otherGid === groupId) continue;
                        const otherGrid = otherData.groupGrids.get(otherGid);
                        if (!otherGrid) continue;
                        const otherCell = otherGrid[fromSlotIndex] && otherGrid[fromSlotIndex][fromDayIndex];
                        if (otherCell && otherCell.roomName === targetRoom) {
                            const otherGroup = this.state.groups.find((g) => g.id === otherGid);
                            const otherGroupName = otherGroup ? otherGroup.name : `Batch #${otherGid}`;
                            return {
                                ok: false,
                                error: `Swap blocked: Room "${targetRoom}" is already used by "${otherCell.courseName}" for ${otherGroupName} at the source slot.`
                            };
                        }
                    }
                }
            }

            grid[toSlotIndex][toDayIndex] = source;
            grid[fromSlotIndex][fromDayIndex] = target;
            return { ok: true };
        };

        const moveBreakCell = (groupId, sourceSlotIndex, sourceDayIndex, targetSlotIndex, targetDayIndex) => {
            const scheduleData = this.state.currentSchedules[groupId];
            if (!scheduleData) {
                return false;
            }

            const breakGrid = scheduleData.breakGrids.get(groupId);
            if (!breakGrid || !breakGrid[sourceSlotIndex][sourceDayIndex]) {
                return false;
            }

            if (targetSlotIndex === sourceSlotIndex && targetDayIndex === sourceDayIndex) {
                return false;
            }

            const grid = scheduleData.groupGrids.get(groupId);
            const sourceClass = grid[sourceSlotIndex][sourceDayIndex];
            const targetClass = grid[targetSlotIndex][targetDayIndex];
            const targetIsBreak = breakGrid[targetSlotIndex][targetDayIndex];

            grid[targetSlotIndex][targetDayIndex] = sourceClass;
            grid[sourceSlotIndex][sourceDayIndex] = targetClass;

            breakGrid[targetSlotIndex][targetDayIndex] = true;
            breakGrid[sourceSlotIndex][sourceDayIndex] = targetIsBreak;

            return true;
        };

        const bindGridEditing = (groupId) => {
            const table = scheduleOutput.querySelector('.timetable-grid');
            if (!table) {
                return;
            }

            let dragPayload = null;

            table.querySelectorAll('[draggable="true"]').forEach((element) => {
                element.addEventListener('dragstart', (event) => {
                    const cellType = element.dataset.cellType || '';
                    const slotIndex = Number(element.dataset.slotIndex);
                    const dayIndex = element.dataset.dayIndex !== undefined ? Number(element.dataset.dayIndex) : null;

                    if (cellType === 'class') {
                        dragPayload = { type: 'class', slotIndex, dayIndex };
                    } else if (cellType === 'break') {
                        dragPayload = { type: 'break', slotIndex, dayIndex };
                    } else {
                        dragPayload = null;
                    }

                    if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = 'move';
                    }
                });

                element.addEventListener('dragend', () => {
                    dragPayload = null;
                });
            });

            table.querySelectorAll('.timetable-cell, .timetable-time-head').forEach((target) => {
                target.addEventListener('dragover', (event) => {
                    if (!dragPayload) {
                        return;
                    }

                    const isTimeHead = target.classList.contains('timetable-time-head');
                    const targetCellType = target.dataset.cellType || '';

                    if (dragPayload.type === 'class' && !isTimeHead && targetCellType !== 'break') {
                        event.preventDefault();
                    }

                    if (dragPayload.type === 'break' && !isTimeHead && target.dataset.slotIndex !== undefined) {
                        event.preventDefault();
                        target.classList.add('break-drop-target');
                    }
                });

                target.addEventListener('dragleave', () => {
                    target.classList.remove('break-drop-target');
                });

                target.addEventListener('drop', (event) => {
                    if (!dragPayload) {
                        return;
                    }

                    const isTimeHead = target.classList.contains('timetable-time-head');
                    const targetSlotIndex = Number(target.dataset.slotIndex);
                    const targetDayIndex = target.dataset.dayIndex !== undefined ? Number(target.dataset.dayIndex) : null;

                    if (dragPayload.type === 'class' && !isTimeHead) {
                        event.preventDefault();
                        const result = moveClassSession(groupId, dragPayload.slotIndex, dragPayload.dayIndex, targetSlotIndex, targetDayIndex);
                        if (result.ok) {
                            renderGroupGrid(groupId);
                            window.showToast('Class updated.', 'success');
                        } else if (result.error) {
                            window.showToast(result.error, 'error');
                        }
                    }

                    if (dragPayload.type === 'break' && !isTimeHead && target.dataset.slotIndex !== undefined) {
                        event.preventDefault();
                        target.classList.remove('break-drop-target');
                        const moved = moveBreakCell(groupId, dragPayload.slotIndex, dragPayload.dayIndex, targetSlotIndex, targetDayIndex);
                        if (moved) {
                            renderGroupGrid(groupId);
                            window.showToast('Break time updated.', 'success');
                        }
                    }
                });
            });
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

                this.state.seed = 0; // Reset seed for default/deterministic generation

                const startTime = document.getElementById('schedule-start').value || '09:00';
                const endTime = document.getElementById('schedule-end').value || '15:30';
                const slotMinutes = parseInt(document.getElementById('schedule-length').value, 10) || 120;
                const breakStartTime = document.getElementById('schedule-break-start').value || '12:00';
                const breakDurationMinutes = Math.max(parseInt(document.getElementById('schedule-break-duration').value, 10) || 0, 0);

                try {
                    const allocation = allocateSchedule(startTime, endTime, slotMinutes, breakStartTime, breakDurationMinutes);
                    this.state.currentSchedules = {};
                    allocation.groupGrids.forEach((grid, groupId) => {
                        this.state.currentSchedules[groupId] = {
                            slots: allocation.slots,
                            groupGrids: allocation.groupGrids,
                            breakGrids: allocation.breakGrids,
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

            document.getElementById('shuffle-schedule-btn').addEventListener('click', () => {
                if (!this.state.groups.length) {
                    window.showToast('Add at least one batch first.', 'error');
                    return;
                }

                // Randomize seed
                this.state.seed = Math.floor(Math.random() * 1000000) + 1;

                const startTime = document.getElementById('schedule-start').value || '09:00';
                const endTime = document.getElementById('schedule-end').value || '15:30';
                const slotMinutes = parseInt(document.getElementById('schedule-length').value, 10) || 120;
                const breakStartTime = document.getElementById('schedule-break-start').value || '12:00';
                const breakDurationMinutes = Math.max(parseInt(document.getElementById('schedule-break-duration').value, 10) || 0, 0);

                try {
                    const allocation = allocateSchedule(startTime, endTime, slotMinutes, breakStartTime, breakDurationMinutes);
                    this.state.currentSchedules = {};
                    allocation.groupGrids.forEach((grid, groupId) => {
                        this.state.currentSchedules[groupId] = {
                            slots: allocation.slots,
                            groupGrids: allocation.groupGrids,
                            breakGrids: allocation.breakGrids,
                            groupAssignments: allocation.groupAssignments,
                            assignedCount: allocation.assignedCount,
                            skippedCount: allocation.skippedCount,
                            totalSessions: allocation.totalSessions
                        };
                    });

                    const selectedGroupId = parseInt(scheduleGroup.value, 10) || this.state.groups[0].id;
                    renderGroupGrid(selectedGroupId);

                    if (allocation.skippedCount > 0) {
                        window.showToast(`Shuffled timetable with ${allocation.skippedCount} unplaced session(s).`, 'error');
                    } else {
                        window.showToast('Timetable shuffled successfully.', 'success');
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

                const parseCourseName = (fullNameRaw) => {
                    const match = fullNameRaw.match(/(.+?)(?:\s*\((.*?)\))?\s*\[(.*?)\]/);
                    if (match) {
                        return {
                            title: match[1].trim(),
                            short: match[2] ? match[2].trim() : '',
                            code: match[3].trim()
                        };
                    }
                    return { title: fullNameRaw, short: '', code: fullNameRaw };
                };

                const daysForPrint = days;
                let html = `<!doctype html><html><head><meta charset="utf-8"><title>${this.state.currentTitle}</title><style>
                    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111827}
                    h1{font-size:22px;margin:0 0 8px}
                    h2{font-size:18px;margin:24px 0 12px}
                    p{margin:0 0 16px;color:#4b5563}
                    table{width:100%;border-collapse:collapse;margin-bottom:24px}
                    th,td{border:1px solid #d1d5db;padding:10px;vertical-align:top;text-align:center}
                    thead th{background:#eef2ff}
                    .day{font-weight:700;text-align:left;white-space:nowrap;background:#f8fafc}
                    .time{font-weight:700;white-space:nowrap}
                    .course{font-weight:700;margin-bottom:4px;font-size:15px}
                    .meta{font-size:12px;color:#6b7280}
                </style></head><body>`;
                html += `<h1>${group.name} timetable</h1><p>${group.size} students</p>`;
                html += '<table><thead><tr><th>Day</th>' + scheduleData.slots.map((slot) => `<th class="time">${slot.startLabel} - ${slot.endLabel}</th>`).join('') + '</tr></thead><tbody>';
                daysForPrint.forEach((dayName, dayIndex) => {
                    const breakGrid = scheduleData.breakGrids.get(group.id);
                    html += `<tr><th class="day">${dayName}</th>`;
                    scheduleData.slots.forEach((slot, rowIndex) => {
                        if (breakGrid[rowIndex][dayIndex]) {
                            html += `<td><div class="course" style="color:#6b7280">Break</div></td>`;
                            return;
                        }

                        const cell = scheduleData.groupGrids.get(group.id)[rowIndex][dayIndex];
                        if (cell) {
                            const parsed = parseCourseName(cell.courseName);
                            const displayTitle = parsed.code + (parsed.short ? `(${parsed.short})` : '');
                            html += `<td><div class="course">${displayTitle}</div></td>`;
                        } else {
                            html += '<td style="background-color:#f8fafc"></td>';
                        }
                    });
                    html += '</tr>';
                });
                html += '</tbody></table>';

                const assignments = scheduleData.groupAssignments.get(group.id) || [];
                const uniqueCourses = new Map();
                assignments.forEach(a => {
                    if (!uniqueCourses.has(a.courseId)) {
                        uniqueCourses.set(a.courseId, a);
                    }
                });
                
                if (uniqueCourses.size > 0) {
                    html += `<h2>Faculty Assignments:</h2><table><thead><tr><th>Course Code</th><th>Course Name</th><th>Instructor Name</th></tr></thead><tbody>`;
                    Array.from(uniqueCourses.values()).forEach(a => {
                        const parsed = parseCourseName(a.courseName);
                        const fullCourseTitle = parsed.title + (parsed.short ? ` (${parsed.short})` : '');
                        html += `<tr><td>${parsed.code}</td><td style="text-align:left">${fullCourseTitle}</td><td>${a.instructorName}</td></tr>`;
                    });
                    html += `</tbody></table>`;
                }

                html += '</body></html>';

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