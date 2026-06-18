from ortools.sat.python import cp_model
from typing import Dict, List, Any

class TimetableSolver:
    def __init__(self, data: Dict[str, Any]):
        self.model = cp_model.CpModel()
        self.data = data
        self.variables = {}
        self.penalties = []
        
        self.courses = data.get("courses", [])
        self.rooms = data.get("rooms", [])
        self.instructors = data.get("instructors", [])
        self.timeslots = data.get("timeslots", [])
        self.groups = data.get("groups", [])
        
        self.constraints = data.get("constraints", [])
        self.preferences = data.get("preferences", [])

    def build_variables(self):
        for c in self.courses:
            for r in self.rooms:
                for s in self.timeslots:
                    self.variables[(c["id"], r["id"], s["id"])] = self.model.NewBoolVar(f'x_{c["id"]}_{r["id"]}_{s["id"]}')

    def add_hard_constraints(self):
        for c in self.courses:
            required_sessions = c.get("sessions_per_week", 1)
            self.model.Add(
                sum(self.variables[(c["id"], r["id"], s["id"])] for r in self.rooms for s in self.timeslots) == required_sessions
            )

        for r in self.rooms:
            for s in self.timeslots:
                self.model.AddAtMostOne(
                    [self.variables[(c["id"], r["id"], s["id"])] for c in self.courses]
                )

        for instructor in self.instructors:
            courses_taught = [c for c in self.courses if c["id"] in instructor.get("courses", [])]
            for s in self.timeslots:
                self.model.AddAtMostOne(
                    [self.variables[(c["id"], r["id"], s["id"])] for c in courses_taught for r in self.rooms]
                )

        # Student groups cannot have overlapping classes
        for group in self.groups:
            group_courses = [c for c in self.courses if c["id"] in group.get("courses", [])]
            for s in self.timeslots:
                self.model.AddAtMostOne(
                    [self.variables[(c["id"], r["id"], s["id"])] for c in group_courses for r in self.rooms]
                )
                
        for c in self.courses:
            for r in self.rooms:
                c_room_type = c.get("room_type") or c.get("type")
                if c.get("students", 0) > r.get("capacity", 0) or (c_room_type and c_room_type != r.get("room_type", "")):
                    for s in self.timeslots:
                        self.model.Add(self.variables[(c["id"], r["id"], s["id"])] == 0)


    def add_dsl_constraints(self):
        from .constraints import apply_constraints
        apply_constraints(self)

    def add_dsl_preferences(self):
        from .optimizer import apply_preferences
        apply_preferences(self)

    def solve(self, time_limit_seconds=30):
        self.build_variables()
        self.add_hard_constraints()
        self.add_dsl_constraints()
        self.add_dsl_preferences()

        if self.penalties:
            self.model.Minimize(sum(self.penalties))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        status = solver.Solve(self.model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            schedule = []
            for c in self.courses:
                for r in self.rooms:
                    for s in self.timeslots:
                        if solver.Value(self.variables[(c["id"], r["id"], s["id"])]):
                            group_ids = [g["id"] for g in self.groups if c["id"] in g.get("courses", [])]
                            
                            # Find instructor who teaches this course and teaches at least one of the groups (if group assignments exist)
                            instructor_id = None
                            for i in self.instructors:
                                if c["id"] in i.get("courses", []):
                                    i_groups = i.get("groups", [])
                                    if not i_groups or any(g_id in i_groups for g_id in group_ids):
                                        instructor_id = i["id"]
                                        break
                            
                            # Fallback if no matching instructor found
                            if not instructor_id:
                                instructor_id = next((i["id"] for i in self.instructors if c["id"] in i.get("courses", [])), None)
                            
                            schedule.append({
                                "course_id": c["id"],
                                "room_id": r["id"],
                                "timeslot_id": s["id"],
                                "instructor_id": instructor_id,
                                "group_ids": group_ids
                            })
            return {"status": "SUCCESS", "schedule": schedule}
        else:
            return {"status": "INFEASIBLE"}
