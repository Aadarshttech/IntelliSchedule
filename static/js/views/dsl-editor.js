const DslEditorView = {
    render() {
        return `
            <div class="card" style="height: 60vh;">
                <h3>Constraints Editor (.tts)</h3>
                <textarea id="dsl-textarea"></textarea>
                <br>
                <button class="btn" id="parse-btn" style="margin-top: 10px;">Parse & Validate</button>
                <pre id="parse-result" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px; color: var(--accent-cyan);"></pre>
            </div>
        `;
    },
    init() {
        const dslTextarea = document.getElementById('dsl-textarea');
        if (!dslTextarea) return;
        
        const editor = CodeMirror.fromTextArea(dslTextarea, {
            lineNumbers: true,
            theme: 'material-ocean',
            mode: 'javascript' // rough approximation for highlighting
        });
        
        document.getElementById('parse-btn').addEventListener('click', async () => {
            const text = editor.getValue();
            try {
                const res = await api.post('/dsl/parse', {text});
                document.getElementById('parse-result').innerText = JSON.stringify(res, null, 2);
            } catch(e) {
                document.getElementById('parse-result').innerText = "Error parsing DSL: " + e;
            }
        });
    }
};
