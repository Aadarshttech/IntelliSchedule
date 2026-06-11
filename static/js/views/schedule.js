const ScheduleView = {
    render() {
        return `
            <div class="card">
                <button class="btn" id="generate-btn" style="margin-bottom: 20px;">Generate Schedule</button>
                <div id="calendar" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px;"></div>
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
            themeSystem: 'standard'
        });
        calendar.render();
        
        document.getElementById('generate-btn').addEventListener('click', async () => {
            alert('Generation triggered! In a complete system this sends DSL to POST /api/schedule/generate');
        });
    }
};
