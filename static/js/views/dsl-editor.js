const DslEditorView = {
    render() {
        return `
            <div class="grid-2" style="height: 100%; gap: 24px;">
                <!-- Visual Constraint Builder -->
                <div class="card" style="height: 100%; display: flex; flex-direction: column;">
                    <h3 style="color: var(--accent-primary);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Constraint Builder
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 0.9rem;">Visually define rules and insert them into the editor.</p>
                    
                    <div class="form-group" id="builder-subject-container">
                        <label id="builder-subject-label">Select Course</label>
                        <select id="builder-course" required>
                            <option value="">Loading courses...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Constraint Type</label>
                        <select id="builder-type" required>
                            <option value="">Select a rule...</option>
                            <option value="require_room">Require Specific Room</option>
                            <option value="no_overlap">No Overlap with Course</option>
                            <option value="same_day">Same Day as Course</option>
                            <option value="max_daily">Teacher Max Daily Hours</option>
                            <option value="morning">Prefer Morning Sessions</option>
                            <option value="avoid_day">Avoid Specific Day</option>
                        </select>
                    </div>

                    <div class="form-group" id="builder-target-container" style="display: none;">
                        <label id="builder-target-label">Target Value</label>
                        <div id="builder-target-wrapper"></div>
                    </div>
                    
                    <button class="btn primary" id="add-constraint-btn" style="width: 100%; margin-top: auto;">
                        Insert Constraint &rarr;
                    </button>
                </div>

                <!-- CodeMirror Editor -->
                <div class="card" style="display: flex; flex-direction: column; height: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                            DSL Editor
                        </h3>
                        <button class="btn primary" id="parse-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            Validate Code
                        </button>
                    </div>
                    
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                        <textarea id="dsl-textarea"># Write your constraints here
</textarea>
                        
                        <div id="parse-result-container" style="display: none;">
                            <h4 style="margin-bottom: 8px;">Syntax Validation</h4>
                            <pre id="parse-result" style="padding: 16px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto; font-family: Consolas, monospace; font-size: 13px; max-height: 200px;"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    async init() {
        var dslTextarea = document.getElementById('dsl-textarea');
        if (!dslTextarea) return;
        
        // Initialize CodeMirror
        var editor = CodeMirror.fromTextArea(dslTextarea, {
            lineNumbers: true,
            theme: 'material-ocean',
            mode: 'javascript' 
        });

        // Load current DSL from localStorage
        var savedDsl = localStorage.getItem('dsl_text');
        if (savedDsl) {
            editor.setValue(savedDsl);
        } else {
            editor.setValue('# Write your constraints here\n# Example:\n# constraint require_room CS101 MainHall\n# constraint no_overlap CS101 MATH201\n');
        }

        // Auto-save on change
        editor.on('change', function() {
            localStorage.setItem('dsl_text', editor.getValue());
        });
        
        var rooms = [];
        var courses = [];
        var instructors = [];
        
        // Load data for dropdowns
        try {
            var results = await Promise.all([
                api.get('/data/courses'),
                api.get('/data/rooms'),
                api.get('/data/instructors')
            ]);
            courses = results[0];
            rooms = results[1];
            instructors = results[2];
            
            populateSubjectSelect(courses);
        } catch(e) {
            console.error("Failed to load builder data", e);
        }

        function populateSubjectSelect(list, isInstructor = false) {
            var courseSelect = document.getElementById('builder-course');
            var label = isInstructor ? '-- Select Teacher --' : '-- Select Course --';
            var opts = '<option value="">' + label + '</option>';
            list.forEach(function(item) {
                opts += '<option value="' + item.name + '">' + item.name + '</option>';
            });
            courseSelect.innerHTML = opts;
        }

        // Handle Constraint Type Change
        var typeSelect = document.getElementById('builder-type');
        var targetContainer = document.getElementById('builder-target-container');
        var targetLabel = document.getElementById('builder-target-label');
        var targetWrapper = document.getElementById('builder-target-wrapper');

        typeSelect.addEventListener('change', function(e) {
            var val = e.target.value;
            var subjectLabel = document.getElementById('builder-subject-label');
            
            if (!val) {
                targetContainer.style.display = 'none';
                return;
            }
            
            targetContainer.style.display = 'block';
            
            // Adjust the subject select (Teacher vs Course)
            if (val === 'max_daily') {
                subjectLabel.innerText = "Select Teacher";
                populateSubjectSelect(instructors, true);
            } else {
                subjectLabel.innerText = "Select Course";
                populateSubjectSelect(courses, false);
            }

            // Adjust the target values
            if (val === 'require_room') {
                targetLabel.innerText = "Select Classroom";
                var html = '<select id="builder-target-val">';
                rooms.forEach(function(r) {
                    html += '<option value="' + r.name + '">' + r.name + ' (Cap: ' + r.capacity + ')</option>';
                });
                html += '</select>';
                targetWrapper.innerHTML = html;
            } else if (val === 'no_overlap' || val === 'same_day') {
                targetLabel.innerText = "Select Course 2";
                var html = '<select id="builder-target-val">';
                courses.forEach(function(c) {
                    html += '<option value="' + c.name + '">' + c.name + '</option>';
                });
                html += '</select>';
                targetWrapper.innerHTML = html;
            } else if (val === 'max_daily') {
                targetLabel.innerText = "Max Sessions per Day";
                targetWrapper.innerHTML = '<input type="number" id="builder-target-val" placeholder="e.g. 4" min="1" value="3">';
            } else if (val === 'morning') {
                targetLabel.innerText = "Preference Weight (1-10)";
                targetWrapper.innerHTML = '<input type="number" id="builder-target-val" placeholder="e.g. 5" min="1" max="10" value="5">';
            } else if (val === 'avoid_day') {
                targetLabel.innerText = "Details";
                targetWrapper.innerHTML = `
                    <div style="display: flex; gap: 8px;">
                        <select id="builder-target-day" style="flex: 1;">
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                        </select>
                        <input type="number" id="builder-target-weight" placeholder="Weight" min="1" max="10" value="5" style="width: 80px;">
                    </div>
                `;
            }
        });

        // Insert Constraint Button
        document.getElementById('add-constraint-btn').addEventListener('click', function() {
            var subject = document.getElementById('builder-course').value;
            var type = typeSelect.value;
            
            if (!subject || !type) {
                window.showToast("Please select a Course/Teacher and Constraint Type", "error");
                return;
            }
            
            var dslString = "";
            
            if (type === 'avoid_day') {
                var day = document.getElementById('builder-target-day').value;
                var weight = document.getElementById('builder-target-weight').value;
                if (!day || !weight) {
                    window.showToast("Please specify the target day and weight", "error");
                    return;
                }
                dslString = 'prefer avoid_day ' + subject + ' ' + day + ' weight ' + weight;
            } else {
                var targetEl = document.getElementById('builder-target-val');
                if (!targetEl || !targetEl.value) {
                    window.showToast("Please specify the target value", "error");
                    return;
                }
                var target = targetEl.value;
                
                if (type === 'require_room') {
                    dslString = 'constraint require_room ' + subject + ' ' + target;
                } else if (type === 'no_overlap') {
                    if (subject === target) {
                        window.showToast("Cannot create overlap rule with the same course", "error");
                        return;
                    }
                    dslString = 'constraint no_overlap ' + subject + ' ' + target;
                } else if (type === 'same_day') {
                    if (subject === target) {
                        window.showToast("Cannot create same_day rule with the same course", "error");
                        return;
                    }
                    dslString = 'constraint same_day ' + subject + ' ' + target;
                } else if (type === 'max_daily') {
                    dslString = 'constraint max_daily ' + subject + ' ' + target;
                } else if (type === 'morning') {
                    dslString = 'prefer morning ' + subject + ' weight ' + target;
                }
            }
            
            // Append to CodeMirror
            var currentVal = editor.getValue();
            var suffix = currentVal.endsWith('\n') || currentVal === '' ? '' : '\n';
            editor.setValue(currentVal + suffix + dslString + '\n');
            editor.setCursor(editor.lineCount(), 0);
            
            // Save to localStorage
            localStorage.setItem('dsl_text', editor.getValue());
            window.showToast("Constraint inserted!", "success");
        });
        
        // Parse Button Logic
        document.getElementById('parse-btn').addEventListener('click', async function() {
            var text = editor.getValue();
            var resultContainer = document.getElementById('parse-result-container');
            var resultPre = document.getElementById('parse-result');
            
            try {
                var res = await api.post('/dsl/parse', {text: text});
                resultContainer.style.display = 'block';
                if (res.success) {
                    resultPre.style.color = 'var(--accent-success)';
                    resultPre.style.borderColor = 'rgba(0, 255, 170, 0.3)';
                    resultPre.innerText = "Success:\n" + res.ast_summary;
                    window.showToast("Syntax is Valid!", "success");
                } else {
                    resultPre.style.color = 'var(--accent-danger)';
                    resultPre.style.borderColor = 'rgba(255, 0, 85, 0.3)';
                    resultPre.innerText = "Error: " + res.error;
                    window.showToast("DSL Syntax Error", "error");
                }
            } catch(e) {
                resultContainer.style.display = 'block';
                resultPre.style.color = 'var(--accent-danger)';
                resultPre.style.borderColor = 'rgba(255, 0, 85, 0.3)';
                resultPre.innerText = "Error: " + e.message;
                window.showToast("DSL Syntax Error", "error");
            }
        });
    }
};
