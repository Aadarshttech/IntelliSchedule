# IntelliSchedule: Comprehensive System Architecture & Pipeline

Welcome to the IntelliSchedule system! This document provides a deep, comprehensive look into how the project operates under the hood. It explains the exact data flow, the algorithms, the mathematical models, and the technologies used to transform raw school data into a mathematically perfect, conflict-free timetable using Artificial Intelligence.

---

## 🏗️ 1. Technology Stack Overview
IntelliSchedule is a modern, full-stack application built for performance and complex mathematical computation:
* **Frontend:** Vanilla HTML, CSS, and JavaScript (SPA-like architecture with dynamic DOM manipulation and HTML5 Drag-and-Drop API).
* **Backend Framework:** FastAPI (Python) for ultra-fast, asynchronous API endpoints.
* **Database:** SQLite with SQLAlchemy ORM for relational data storage and integrity.
* **AI & Mathematics Engine:** Google OR-Tools (Constraint Programming Solver) for NP-hard scheduling optimization.
* **Language Parsing:** Lark (a modern parsing library for Python) for the custom Domain Specific Language (DSL).

---

## 📥 2. Data Input & Storage (The Foundation)
Before the AI can optimize anything, the system requires a structured representation of the school's resources.

* **Relational Data Entry:** Administrators use the frontend UI to input core entities. This data is fully relational:
  * **Student Batches (Groups):** Defined with specific sizes and a list of required courses.
  * **Courses:** Configured with required "sessions per week".
  * **Instructors:** Linked to the specific courses they teach and the specific batches they prefer to instruct.
  * **Rooms:** Defined with specific capacities to ensure large batches aren't placed in small rooms.
* **State Management:** The frontend communicates with the FastAPI backend via RESTful endpoints (e.g., `POST /api/courses`), which sanitizes the input and writes it to the SQLite Database (`timetable.db`).

---

## 💻 3. The Smart Terminal (Domain Specific Language)
Standard scheduling software often fails because it cannot handle unique, edge-case human demands (e.g., "Professor Smith cannot teach the Seniors on Friday afternoons"). To solve this, IntelliSchedule features a custom **Domain Specific Language (DSL)**.

* **The Terminal Interface:** Located on the Dashboard, users can type natural, human-readable rules into an interactive code editor.
  * *Example 1:* `constraint instructor_group_no_day Sunil_Regmi COMP_SEM4 Friday`
  * *Example 2:* `prefer instructor_afternoon Amrit_Dahal Tuesday weight 10`
* **Lexing and Parsing (The Compiler):** 
  * When the user clicks "Generate", the raw text is sent to the backend.
  * The system uses `Lark` (`grammar.lark`) to parse the text. It breaks the text down into tokens and builds a syntax tree.
  * A custom transformer (`transformer.py`) walks through this tree and converts the human text into structured JSON-like mathematical objects (e.g., converting "Sunil_Regmi" into Instructor ID `4`).

---

## 🧠 4. The Backend AI Generator (Google OR-Tools)
This is the core "Brain" of the system. Timetabling is a classic NP-Hard mathematical problem. To solve it, we model it as a **Constraint Satisfaction Problem (CSP)** using Google OR-Tools.

* **Variable Creation:** 
  The solver creates thousands of Boolean variables (True/False) representing every possible combination of `(Course, Room, Timeslot)`.
* **Hard Constraints (The Non-Negotiables):**
  The solver aggressively filters out invalid universes by applying strict mathematical boundaries:
  * **Room Collisions:** `AddAtMostOne` — Only one course can exist in a specific room at a specific timeslot.
  * **Instructor Collisions:** `AddAtMostOne` — A specific instructor cannot be assigned to two different rooms at the exact same timeslot.
  * **Batch Collisions:** A specific student batch cannot have two overlapping classes.
  * **Daily Limits:** A batch is mathematically forbidden from having the exact same class twice in one day (`sum(sessions_today) <= 1`).
  * **DSL Enforcement:** All custom rules typed into the terminal are injected here as hard mathematical locks.
* **Soft Constraints & Optimization (Preferences):**
  Rules like `prefer instructor_morning` don't break the schedule if violated, but they add a "penalty score". The AI uses `Minimize(sum(penalties))` to search through the valid schedules and pick the one that makes teachers the happiest.
* **Resolution:** The AI mathematically proves the optimal schedule, generates the exact placements, and saves the final `Schedule` object to the SQLite database.

---

## 🎨 5. Frontend Visualization & Smart Drag-and-Drop
Once the AI is finished, the output is pulled by the frontend and rendered into an interactive, visual format.

* **Dynamic Grid Rendering:** The `/schedule` page pulls the schedule data and dynamically injects HTML to build a beautiful weekly grid (`schedule.js`). It maps timeslots to columns and days to rows, calculating exact pixel placements.
* **Client-Side Generation & Validation:** To ensure the UI always remains in sync with the rules, the frontend Javascript actively reads the DSL rules cached in the browser's `localStorage`.
* **Manual Tweaking (HTML5 Drag-and-Drop):** 
  * Administrators have the final say and can manually drag and drop class cards on the grid.
  * **Real-time Collision Detection:** When a card is dropped, the system intercepts the event. It calculates the target cell's Day and Timeslot.
  * **Integrity Protection:** The UI runs a check: Does this new spot violate the "no same class twice a day" rule? Does it violate a DSL rule typed into the terminal? If yes, the UI instantly **blocks the drop** and flashes a red error toast, guaranteeing that human error cannot accidentally ruin the AI's perfect timetable.

---

### 🔄 Summary of the Complete Pipeline
1. **Data Entry:** Relational data is stored via FastAPI into SQLite.
2. **Custom Rules:** User types edge-case demands into the DSL Terminal.
3. **Compilation:** The backend parses the DSL into mathematical objects.
4. **AI Solving:** Google OR-Tools models the constraints, searches millions of states, and outputs an optimal, conflict-free matrix.
5. **Visualization:** The frontend renders the grid and strictly protects it during manual drag-and-drop tweaks.
