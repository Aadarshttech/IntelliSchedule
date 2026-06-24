def apply_preferences(engine):
    model = engine.model
    var = engine.variables

    for pref in engine.preferences:
        ptype = pref.get("name")
        weight = pref.get("weight", 1)
        
        if ptype == "morning":
            c = pref.get("course")
            for r in engine.rooms:
                for s in engine.timeslots:
                    if "12:00" <= s.get("start_time", "23:59"):
                        if (c, r["id"], s["id"]) in var:
                            penalty = model.NewBoolVar(f"pen_morn_{c}_{r['id']}_{s['id']}")
                            model.Add(penalty == var[(c, r["id"], s["id"])])
                            engine.penalties.append(penalty * weight)
        
        elif ptype == "avoid_day":
            c = pref.get("course")
            target_day = pref.get("day")
            for r in engine.rooms:
                for s in engine.timeslots:
                    if s.get("day", "").lower() == target_day.lower():
                        if (c, r["id"], s["id"]) in var:
                            penalty = model.NewBoolVar(f"pen_avoid_{c}_{r['id']}_{s['id']}")
                            model.Add(penalty == var[(c, r["id"], s["id"])])
                            engine.penalties.append(penalty * weight)

        elif ptype == "instructor_afternoon":
            inst = pref.get("instructor")
            target_day = pref.get("day")
            # find courses taught by this instructor
            inst_obj = next((i for i in engine.instructors if i["id"] == inst), None)
            if inst_obj:
                courses_taught = inst_obj.get("courses", [])
                for c in courses_taught:
                    for r in engine.rooms:
                        for s in engine.timeslots:
                            # afternoon constraint on target day: penalize if scheduled before 12:00
                            if s.get("day", "").lower() == target_day.lower() and s.get("start_time", "00:00") < "12:00":
                                if (c, r["id"], s["id"]) in var:
                                    penalty = model.NewBoolVar(f"pen_inst_aft_{inst}_{c}_{r['id']}_{s['id']}")
                                    model.Add(penalty == var[(c, r["id"], s["id"])])
                                    engine.penalties.append(penalty * weight)
