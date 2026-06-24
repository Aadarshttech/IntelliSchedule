const DashboardView = {
    render() {
        return `
            <div class="grid-3">
                <div class="card">
                    <h3 style="color: var(--accent-primary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Courses
                    </h3>
                    <div id="stat-courses" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
                <div class="card">
                    <h3 style="color: var(--accent-secondary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        Rooms
                    </h3>
                    <div id="stat-rooms" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
                <div class="card">
                    <h3 style="color: var(--accent-success);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Teachers
                    </h3>
                    <div id="stat-instructors" style="font-size: 2.5rem; font-weight: 700;">-</div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px; padding: 32px 24px;">
                <h3 style="font-size: 1.5rem; margin-bottom: 16px; text-align: center;">Ready to build your timetable?</h3>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; text-align: center;">
                    Make sure you have added all your Courses, Rooms, and Teachers in the Data Input section. The AI will automatically avoid overlapping teachers and rooms.
                </p>
                
                <div style="margin-bottom: 24px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-weight: 600; color: var(--text-primary);">Advanced Constraints Terminal</label>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Write custom rules or select a template to insert</p>
                        </div>
                        <select id="dsl-template-select" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); cursor: pointer; font-family: inherit; font-size: 0.9rem; outline: none;">
                            <option value="">-- Select a Template --</option>
                            <option value="constraint no_overlap AICS_203 AIMA_202">No Overlap (AICS_203 & AIMA_202)</option>
                            <option value="constraint require_room AICS_203 AI_103">Require Room (AICS_203 in AI_103)</option>
                            <option value="constraint same_day AICS_203 AIMA_202">Same Day (AICS_203 & AIMA_202)</option>
                            <option value="prefer morning AICS_203 weight 10">Prefer Morning (AICS_203, weight 10)</option>
                            <option value="prefer avoid_day AIMA_202 Friday weight 5">Avoid Friday (AIMA_202, weight 5)</option>
                            <option value="constraint instructor_group_no_day Sunil_Regmi COMP_SEM4 Friday">No Friday Class (Sunil_Regmi for COMP_SEM4)</option>
                        </select>
                    </div>
                    
                    <div style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.1); background: #0f111a;">
                        <div style="background: #1e1e1e; padding: 8px 16px; display: flex; align-items: center; border-bottom: 1px solid #333;">
                            <div style="display: flex; gap: 6px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56;"></div>
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></div>
                            </div>
                            <div style="color: #888; font-family: monospace; font-size: 0.8rem; margin-left: 16px;">tt-ai -- dsl_terminal</div>
                        </div>
                        <textarea id="dsl-editor-textarea" name="dsl_editor" style="display: none;"></textarea>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button id="btn-generate-schedule" class="btn primary" style="font-size: 1.1rem; padding: 12px 24px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Generate Timetable
                    </button>
                </div>
            </div>
        `;
    },
    async init() {
        try {
            const [courses, rooms, instructors] = await Promise.all([
                api.get('/data/courses').catch(() => []),
                api.get('/data/rooms').catch(() => []),
                api.get('/data/instructors').catch(() => [])
            ]);
            document.getElementById('stat-courses').innerText = courses.length || 0;
            document.getElementById('stat-rooms').innerText = rooms.length || 0;
            document.getElementById('stat-instructors').innerText = instructors.length || 0;
            
            // Initialize CodeMirror for DSL Editor
            const dslTextArea = document.getElementById('dsl-editor-textarea');
            const editor = CodeMirror.fromTextArea(dslTextArea, {
                lineNumbers: true,
                mode: "javascript",
                theme: "material-ocean"
            });
            editor.setSize("100%", "220px");
            // Provide default text
            editor.setValue(`// CORE CONSTRAINTS (Automatically Enforced):
// - No overlapping classes in the same room.
// - No teacher can be double-booked across batches.
// - No class is taught more than once per day to the same batch.

// CUSTOM CONSTRAINTS:
// You can define rules for ANY teacher or class. Examples:
// prefer instructor_morning Sunil_Regmi Monday weight 10
// prefer instructor_afternoon Amrit_Dahal Tuesday weight 10
`);
            setTimeout(() => {
                editor.refresh();
            }, 100);
            
            // Handle Template Dropdown
            const templateSelect = document.getElementById('dsl-template-select');
            templateSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val) {
                    const currentVal = editor.getValue();
                    const spacer = (currentVal.endsWith('\n') || currentVal === '') ? '' : '\n';
                    editor.setValue(currentVal + spacer + val + '\n');
                    editor.focus();
                    editor.setCursor(editor.lineCount(), 0);
                    e.target.value = ''; // reset dropdown
                }
            });
            
            document.getElementById('btn-generate-schedule').addEventListener('click', async () => {
                const btn = document.getElementById('btn-generate-schedule');
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Generating... Please wait.';
                btn.disabled = true;
                
                try {
                    const dslTextValue = editor.getValue();
                    localStorage.setItem('current_dsl_rules', dslTextValue);
                    await api.post('/schedule/generate', { dsl_text: dslTextValue });
                    window.showToast("Schedule generated successfully!", "success");
                    window.navigateTo('/schedule');
                } catch (e) {
                    window.showToast("Error generating schedule: " + e.message, "error");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });

        } catch (e) {
            console.error(e);
        }
    }
};
