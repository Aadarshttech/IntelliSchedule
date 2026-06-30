<div align="center">
  <h1>IntelliSchedule</h1>
  <p><strong>A Next-Generation AI-Powered Timetable Optimization System</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3.9+-blue.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Google%20OR--Tools-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="OR-Tools" />
    <img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" />
  </p>
</div>

---

## 🌟 Overview

**IntelliSchedule** is a high-performance, intelligent scheduling system designed to eliminate the complexity of timetable generation. By leveraging advanced constraint programming, it solves complex scheduling puzzles, resolving conflicts across rooms, instructors, and time slots in seconds. 

Whether it's for university lectures, employee shifts, or conference tracks, IntelliSchedule calculates the most optimal, conflict-free roster.

## 🚀 Key Features

- **🧠 Intelligent Constraint Solver:** Powered by Google's OR-Tools to solve NP-hard scheduling problems efficiently.
- **⚡ High-Performance API:** Built with FastAPI for asynchronous, lightning-fast schedule generation and data retrieval.
- **📜 Custom Scheduling DSL:** Features a proprietary Domain Specific Language (DSL) built with `lark` to define natural-language-like constraints and rules.
- **📊 Interactive Dashboard:** A modular, vanilla JavaScript frontend for seamless data input, schedule visualization, and conflict monitoring.
- **🗄️ Relational Data Management:** robust SQLAlchemy ORM integration for managing complex relationships between entities.

## 🛠️ Technology Stack

### Backend Engine
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Optimizer Engine:** [Google OR-Tools](https://developers.google.com/optimization)
- **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/)
- **DSL Parser:** [Lark](https://github.com/lark-parser/lark)

### Frontend Interface
- **Architecture:** Pure Vanilla JavaScript (Modular Views)
- **Styling:** Custom CSS
- **API Communication:** Async JS Fetch API

## 📂 Architecture

```text
IntelliSchedule/
├── api/             # FastAPI Route Definitions (Data, DSL, Schedule)
├── dsl/             # Custom Grammar and AST Transformers for constraints
├── models/          # SQLAlchemy Database Entities & Pydantic Schemas
├── solver/          # OR-Tools Optimization Engine & Constraint logic
└── static/          # Vanilla JS Frontend (Dashboard, Schedule Views)
```

## ⚙️ Quick Start

### Prerequisites
- Python 3.9+
- SQLite (or any supported SQL database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aadarshttech/IntelliSchedule.git
   cd IntelliSchedule
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the API & Web Server**
   ```bash
   python main.py
   ```
   > The server will start on `http://localhost:8000`. Access the frontend directly from the root URL.

## 🧩 The Custom DSL

IntelliSchedule allows administrators to define hard and soft constraints using a custom Domain Specific Language. This ensures rules are evaluated correctly by the optimizer before rendering the timetable.

*(Example rules can be defined via the built-in DSL Editor in the frontend).*

For more comprehensive details on how to write rules, see the [DSL Documentation](DSL_DOCUMENTATION.md).

---
<div align="center">
  <sub>Built with ❤️ by Aadarsh</sub>
</div>

