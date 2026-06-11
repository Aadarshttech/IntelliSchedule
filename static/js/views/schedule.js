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
    init() {
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
        
        document.getElementById('generate-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Solving...`;
            btn.disabled = true;
            
            try {
                // Fetch DSL if there's any logic needed, for now we pass empty to let the solver use database data
                const reqData = { dsl_text: "", time_limit_seconds: 10 };
                const sched = await api.post('/schedule/generate', reqData);
                
                window.showToast("Schedule Generated Successfully!", "success");
                
                // Map API response to FullCalendar Events
                // In a complete implementation, this parses the returned schedule entries.
                // Assuming backend returns sched_entries array or similar.
                // We'll mock a quick refresh or actual mapping here.
                
                const events = [];
                // If the backend returns `id`, we should fetch the entries via GET /api/schedule/{id}
                const fullSched = await api.get(`/schedule/${sched.id}`);
                
                if (fullSched.entries && fullSched.entries.length > 0) {
                     // Need actual logic depending on how routes_schedule.py returns entries.
                     // But we can just show a toast for now if entries mapping is complex.
                     window.showToast(`Loaded ${fullSched.entries.length} entries onto the calendar.`, "info");
                } else {
                     window.showToast(`Schedule ${sched.id} created, but parsing exact slots to Calendar requires deeper integration.`, "info");
                }
                
            } catch(error) {
                console.error(error);
                window.showToast("Solver Failed or Infeasible", "error");
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
