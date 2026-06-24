import sqlite3
from solver.engine import TimetableSolver
from api.routes import build_solver_data

data = build_solver_data()
solver = TimetableSolver(data)
solver.build_variables()
solver.add_hard_constraints()
print("Constraints added.")
for d in set(s.get("day") for s in data["timeslots"]):
    print(d)
