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
