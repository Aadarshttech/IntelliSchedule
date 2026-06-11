const DslEditorView = {
    render() {
        return `
            <div class="card" style="display: flex; flex-direction: column; height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        Constraints Editor (.tts)
                    </h3>
                    <button class="btn primary" id="parse-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Parse & Validate
                    </button>
                </div>
                <div style="flex: 1; min-height: 400px; margin-bottom: 16px;">
                    <textarea id="dsl-textarea"># Example Constraints
Require Course "CS101" RoomType "Lecture"
Require Course "CS101" RoomCapacity 100
</textarea>
                </div>
                <div id="parse-result-container" style="display: none;">
                    <h4>Validation Result</h4>
                    <pre id="parse-result" style="margin-top: 10px; padding: 16px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid var(--border-color); overflow-x: auto; font-family: Consolas, monospace; font-size: 13px;"></pre>
                </div>
            </div>
        `;
    },
    init() {
        const dslTextarea = document.getElementById('dsl-textarea');
        if (!dslTextarea) return;
        
        const editor = CodeMirror.fromTextArea(dslTextarea, {
            lineNumbers: true,
            theme: 'material-ocean',
            mode: 'javascript' 
        });
        
        document.getElementById('parse-btn').addEventListener('click', async () => {
            const text = editor.getValue();
            const resultContainer = document.getElementById('parse-result-container');
            const resultPre = document.getElementById('parse-result');
            
            try {
                const res = await api.post('/dsl/parse', {text});
                resultContainer.style.display = 'block';
                resultPre.style.color = 'var(--accent-success)';
                resultPre.style.borderColor = 'rgba(0, 255, 170, 0.3)';
                resultPre.innerText = JSON.stringify(res, null, 2);
                window.showToast("DSL parsed successfully!", "success");
            } catch(e) {
                resultContainer.style.display = 'block';
                resultPre.style.color = 'var(--accent-danger)';
                resultPre.style.borderColor = 'rgba(255, 0, 85, 0.3)';
                resultPre.innerText = "Error parsing DSL:\n" + (e.message || JSON.stringify(e));
                window.showToast("DSL Parsing Failed", "error");
            }
        });
    }
};
