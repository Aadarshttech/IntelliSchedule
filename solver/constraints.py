def apply_constraints(engine):
    model = engine.model
    var = engine.variables

    for constr in engine.constraints:
        ctype = constr.get("name")
        if ctype == "no_overlap":
            c1, c2 = constr.get("courses", [None, None])
            if not c1 or not c2: continue
            for s in engine.timeslots:
                s_id = s["id"]
                # c1 and c2 can't be in the same timeslot
                model.AddAtMostOne([var[(c1, r["id"], s_id)] for r in engine.rooms] + 
                                   [var[(c2, r["id"], s_id)] for r in engine.rooms])
        elif ctype == "require_room":
            c, target_r = constr.get("course"), constr.get("room")
            if not c or not target_r: continue
            for r in engine.rooms:
                if r["id"] != target_r:
                    for s in engine.timeslots:
                        if (c, r["id"], s["id"]) in var:
                            model.Add(var[(c, r["id"], s["id"])] == 0)
        elif ctype == "same_day":
            c1, c2 = constr.get("courses", [None, None])
            if not c1 or not c2: continue
            
            # Group timeslots by day
            days = set(s["day"] for s in engine.timeslots)
            for d in days:
                ts_d = [s["id"] for s in engine.timeslots if s["day"] == d]
                
                c1_slots = [var[(c1, r["id"], s_id)] for r in engine.rooms for s_id in ts_d if (c1, r["id"], s_id) in var]
                c2_slots = [var[(c2, r["id"], s_id)] for r in engine.rooms for s_id in ts_d if (c2, r["id"], s_id) in var]
                
                if c1_slots and c2_slots:
                    c1_active = model.NewBoolVar(f"same_day_active_{c1}_{d}")
                    c2_active = model.NewBoolVar(f"same_day_active_{c2}_{d}")
                    
                    model.Add(sum(c1_slots) >= 1).OnlyEnforceIf(c1_active)
                    model.Add(sum(c1_slots) == 0).OnlyEnforceIf(c1_active.Not())
                    
                    model.Add(sum(c2_slots) >= 1).OnlyEnforceIf(c2_active)
                    model.Add(sum(c2_slots) == 0).OnlyEnforceIf(c2_active.Not())
                    
                    model.Add(c1_active == c2_active)
        elif ctype == "max_daily":
            inst_id = constr.get("instructor")
            limit = constr.get("limit", 1)
            if not inst_id: continue
            
            # Find courses taught by this instructor
            instructor_courses = []
            for inst in engine.data.get("instructors", []):
                if inst["id"] == inst_id:
                    instructor_courses = inst.get("courses", [])
                    break
            
            if not instructor_courses: continue
            
            # Group timeslots by day
            days = set(s["day"] for s in engine.timeslots)
            for d in days:
                ts_d = [s["id"] for s in engine.timeslots if s["day"] == d]
                
                # Instructor cannot teach more than limit sessions on day d
                model.Add(
                    sum(var[(c_id, r["id"], s_id)] 
                        for c_id in instructor_courses 
                        for r in engine.rooms 
                        for s_id in ts_d 
                        if (c_id, r["id"], s_id) in var) <= limit
                )
        elif ctype == "instructor_group_no_day":
            inst_id = constr.get("instructor")
            grp_id = constr.get("group")
            day = constr.get("day")
            if not inst_id or not grp_id or not day: continue
            
            # Find courses taught by instructor
            instructor_courses = []
            for inst in engine.data.get("instructors", []):
                if inst["id"] == inst_id:
                    instructor_courses = inst.get("courses", [])
                    break
                    
            # Find courses taken by group
            group_courses = []
            for grp in engine.data.get("groups", []):
                if grp["id"] == grp_id:
                    group_courses = grp.get("courses", [])
                    break
                    
            common_courses = set(instructor_courses).intersection(set(group_courses))
            if not common_courses: continue
            
            # Prevent scheduling these common courses on the specified day
            ts_d = [s["id"] for s in engine.timeslots if s["day"].lower() == day.lower()]
            for c_id in common_courses:
                for r in engine.rooms:
                    for s_id in ts_d:
                        if (c_id, r["id"], s_id) in var:
                            model.Add(var[(c_id, r["id"], s_id)] == 0)
