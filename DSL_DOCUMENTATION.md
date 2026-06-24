# Timetable System: Technical Documentation

## 1. System Architecture overview
This project is a web-based Timetable Scheduling System. It allows users to input scheduling data (courses, teachers, rooms, groups) and uses an intelligent engine to generate collision-free timetables. 

**How it's built (Tech Stack):**
* **Frontend:** Vanilla JavaScript, HTML, and CSS. No heavy frameworks (like React or Angular) are used. It relies on standard browser APIs and AJAX requests to communicate with the backend.
* **Backend:** Python using the **FastAPI** framework. It serves both the static frontend files and the REST API endpoints.
* **Database:** **SQLite**, managed via **SQLAlchemy ORM**. This provides a simple, file-based database that requires no external database servers to run.

---

## 2. General Workflow
1. **Data Entry:** The user inputs base entities (Semesters, Teachers, Rooms, Courses) via the UI (`data-input.js`). The frontend sends this data to the FastAPI backend, which saves it to the SQLite database.
2. **Constraint Definition (DSL):** The user defines hard rules (e.g., "teacher A cannot teach on Mondays") and soft preferences (e.g., "prefer morning classes") using a text-based Domain-Specific Language (DSL) in the browser.
3. **DSL Parsing:** The frontend sends the DSL text to the backend. The backend uses the `lark` library to parse this text into structured Python rules.
4. **Timetable Generation:** The user clicks "Build Timetable". The backend's Constraint Solver engine (`solver/engine.py`) takes the database entities and the parsed DSL rules, and attempts to map every class to a timeslot and room without creating collisions (like double-booking a teacher or a room).
5. **Display & Editing:** The generated schedule is returned to the frontend. The user can view it in a grid format, drag-and-drop to make manual adjustments, and shuffle the timetable for alternative layouts.

---

## 3. How FastAPI Works in This Project
FastAPI is the Python web framework that powers the backend server. Here is how it functions in this project:

### A. Server Startup (`main.py`)
1. **Starts the Application:** When the backend starts (running `uvicorn main:app`), `main.py` initializes the FastAPI application (`app = FastAPI()`).
2. **Setup Database:** It automatically connects to the SQLite database and creates any missing tables using SQLAlchemy ORM metadata (`Base.metadata.create_all`).
3. **Serves Frontend Files:** It mounts the `static/` folder to the root URL `/`. This instructs FastAPI to serve all HTML, CSS, and JS assets directly to the browser.
4. **Registers Routers:** It includes all API sub-routers (configured in the `api/` directory) under the `/api` prefix.

### B. Serving the Web Page
When a user opens `http://localhost:8000/` in a browser:
1. FastAPI catches the request at `/` and serves the frontend's main entry point, `static/index.html`.
2. The browser loads `index.html`, which in turn requests and loads the CSS files and frontend JavaScript view files (like `app.js`, `views/schedule.js`, and `views/data-input.js`).

### C. Handling API Requests (e.g., Generating a Timetable)
When you interact with the UI, the frontend JavaScript communicates with FastAPI using standard API calls:
1. **HTTP Requests:** For example, clicking "Build Timetable" makes JavaScript send a `POST` request to `/api/schedule/generate` containing the DSL constraint text.
2. **FastAPI Route Matching:** FastAPI maps the incoming URL to the corresponding endpoint function in `api/routes_schedule.py`.
3. **Data Validation (Pydantic):** FastAPI automatically checks the incoming data against schemas defined in `models/schemas.py`. If data is invalid, FastAPI returns a `422 Unprocessable Entity` error back to the frontend before running any backend logic.
4. **Execution & Database Updates:** The route function triggers the Lark parser to process the DSL text, runs the solver engine to generate a conflict-free schedule, and commits the results to the SQLite database via SQLAlchemy.
5. **JSON Response:** FastAPI automatically turns the python dictionaries/objects of the generated schedule into JSON format and sends it back as the HTTP response, which the frontend JS displays on the screen.

---

## 4. Why use a DSL (Domain-Specific Language)?
A **Domain-Specific Language (DSL)** is a custom mini-language designed just for a specific problem.
* **Declarative:** You simply type rules like `constraint no_overlap Math101 Physics101` instead of coding complex Python logic.
* **Decoupled:** Administrators can update rules in the frontend text editor dynamically, without touching the backend code.

## 5. Where and How is `lark` Used?
**Lark** is the parsing engine used in the `dsl/` directory. It reads your raw DSL text and translates it into data the solver can understand:
* **`dsl/grammar.lark`**: Defines the grammar rules of your language.
* **`dsl/parser.py`**: Uses Lark to read the text and create an Abstract Syntax Tree (AST).
* **`dsl/transformer.py`**: Walks through the AST and converts the raw text tokens into a Python dictionary.

## 6. Is `lex` Used?
**No standalone `lex` tool is used.** 
You won't find `lex` or `flex` files here. However, lexical analysis still occurs internally because **Lark has its own built-in lexer**. The terminal rules in `grammar.lark` (like `DAY: "Monday"i` or `TIME: /\d{1,2}:\d{2}/`) act as the lexer instructions, breaking the string down into chunks before parsing begins.
