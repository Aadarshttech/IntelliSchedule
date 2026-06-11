const DataInputView = {
    render() {
        return `
            <div class="card">
                <h3>Data Management</h3>
                <p>In a full system, you would manage courses, rooms, instructors here.</p>
                <button class="btn" id="load-sample-btn">Load Sample Data (Backend Script Needed)</button>
            </div>
        `;
    },
    init() {
        document.getElementById('load-sample-btn')?.addEventListener('click', () => {
            alert('This would trigger a backend data population script.');
        });
    }
};
