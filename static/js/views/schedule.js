const ScheduleView = {
    render() {
        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Generated Output
                    </h3>
                    <button class="btn primary" id="generate-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Generate Timetable
                    </button>
                </div>
                <div id="calendar-wrapper" style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div id="calendar"></div>
                </div>
            </div>
        `;
    },
    async init() {
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
            },
            slotMinTime: '08:00:00',
            slotMaxTime: '20:00:00',
            allDaySlot: false,
            height: 'auto',
            themeSystem: 'standard',
            events: []
        });
        calendar.render();

        function getIsoDateTime(dayName, timeStr) {
            const daysOfWeek = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
            };
            const targetDayNum = daysOfWeek[dayName.toLowerCase()];
            if (targetDayNum === undefined) return null;
            
            const now = new Date();
            const currentDayNum = now.getDay();
            
            const diff = targetDayNum - currentDayNum;
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + diff);
            
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');
            
            return `${yyyy}-${mm}-${dd}T${timeStr}`;
        }

        function mapEntriesToEvents(entries) {
            return entries.map(entry => {
                const titleText = `${entry.course.name}\n${entry.room.name} | ${entry.instructor ? entry.instructor.name : 'TBA'}`;
                return {
                    title: titleText,
                    start: getIsoDateTime(entry.timeslot.day, entry.timeslot.start_time),
                    end: getIsoDateTime(entry.timeslot.day, entry.timeslot.end_time),
                    backgroundColor: 'rgba(0, 255, 170, 0.15)',
                    borderColor: 'var(--accent-primary)',
                    textColor: '#ffffff'
                };
            }).filter(e => e.start && e.end);
        }

        const loadScheduleIntoCalendar = (scheduleData) => {
            calendar.removeAllEvents();
            if (scheduleData && scheduleData.entries) {
                const events = mapEntriesToEvents(scheduleData.entries);
                calendar.addEventSource(events);
            }
        };

        // Load latest schedule on startup
        try {
            const latest = await api.get('/schedule/latest');
            if (latest) {
                loadScheduleIntoCalendar(latest);
            }
        } catch (e) {
            console.error("Failed to load latest schedule", e);
        }
        
        document.getElementById('generate-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Solving...`;
            btn.disabled = true;
            
            try {
                // Read DSL constraints from localStorage
                const dslText = localStorage.getItem('dsl_text') || "";
                const reqData = { dsl_text: dslText, time_limit_seconds: 10 };
                const sched = await api.post('/schedule/generate', reqData);
                
                window.showToast("Schedule Generated Successfully!", "success");
                
                // Fetch full schedule entries
                const fullSched = await api.get(`/schedule/${sched.id}`);
                loadScheduleIntoCalendar(fullSched);
                
            } catch(error) {
                console.error(error);
                window.showToast("Solver Failed or Infeasible: " + error.message, "error");
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });
        
        // Add spinner CSS if not present
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
    }
};
