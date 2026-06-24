# IntelliSchedule: How It Works (The Complete Pipeline)

Welcome to the IntelliSchedule system! This document explains the complete pipeline of how the system takes raw school data and transforms it into a perfect, conflict-free timetable using Artificial Intelligence.

The pipeline is divided into **four main stages**:

---

## 1. Data Input & Storage (The Foundation)
Before the AI can do anything, it needs to know what it is scheduling.
* **The Interface:** Administrators use the clean frontend UI to input the core entities: **Batches** (Student Groups), **Courses**, **Instructors**, and **Rooms**.
* **The Backend:** The frontend sends this data to the Python backend built with **FastAPI**.
* **The Database:** The backend stores everything securely in a local **SQLite Database** (`timetable.db`).

---

## 2. The Smart Terminal (DSL Constraints)
Not all scheduling rules are standard. Sometimes specific teachers have specific demands. This is where the **Domain Specific Language (DSL)** comes in.
* **The Terminal:** On the Dashboard, there is an interactive terminal where users can type human-readable rules.
  * *Example:* `constraint instructor_group_no_day Sunil_Regmi COMP_SEM4 Friday` (Sunil refuses to teach the COMP_SEM4 batch on Fridays).
* **The Parser:** When submitted, the backend uses a tool called `lark` to read this text, understand the grammar, and convert it into strict mathematical rules that the AI can understand.

---

## 3. The Backend AI Generator (Google OR-Tools)
This is the "Brain" of the system. Once the data and constraints are ready, the AI takes over.
* **The Engine:** We use **Google OR-Tools** (a powerful constraint programming solver).
* **The Logic:** The solver looks at billions of potential schedule combinations. It aggressively filters out bad combinations using **Hard Constraints**, such as:
  * A teacher cannot be in two rooms at the exact same time.
  * A student batch cannot have two overlapping classes.
  * A batch cannot have the exact same class twice in one day.
  * It strictly enforces the custom DSL rules typed into the terminal.
* **The Result:** The AI mathematically proves and generates an optimal, 100% conflict-free schedule, which is then saved back to the database.

---

## 4. Frontend Visualization & Drag-and-Drop
Once the AI is finished, the schedule needs to be presented beautifully and allow for human tweaks.
* **The Grid:** The `/schedule` page reads the data and renders a beautiful weekly grid (`schedule.js`). It intelligently places classes and breaks into the correct timeslots.
* **Manual Tweaking:** Humans still have the final say! Users can manually drag and drop class cards on the grid to make minor adjustments.
* **Real-time Validation:** Even during manual tweaks, the frontend remains smart. If a user tries to drag a class into an illegal spot (e.g., trying to put a class on a day that already has that class, or violating an AI constraint), the UI will instantly **block the drop** and flash an error message, protecting the integrity of the timetable!

---

### Summary of the Flow
**User Inputs Data** ➔ **User Types Custom Rules in Terminal** ➔ **Backend AI Solves the Math Puzzle** ➔ **Frontend Displays Grid & Protects Drag-and-Drop Tweaks**.
