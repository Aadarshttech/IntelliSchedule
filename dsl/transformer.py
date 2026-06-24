from lark import Transformer, v_args

@v_args(inline=True)
class DSLTransformer(Transformer):
    def start(self, *statements):
        ast = {"courses": [], "rooms": [], "instructors": [], "groups": [], "timeslots": [], "constraints": [], "preferences": []}
        for stmt in statements:
            if not stmt: continue
            if stmt["type"] == "course":
                ast["courses"].append(stmt)
            elif stmt["type"] == "room":
                ast["rooms"].append(stmt)
            elif stmt["type"] == "instructor":
                ast["instructors"].append(stmt)
            elif stmt["type"] == "group":
                ast["groups"].append(stmt)
            elif stmt["type"] == "timeslot":
                ast["timeslots"].append(stmt)
            elif stmt["type"] == "constraint":
                ast["constraints"].append(stmt)
            elif stmt["type"] == "preference":
                ast["preferences"].append(stmt)
        return ast

    def statement(self, item):
        return item
    
    def definition(self, item):
        return item

    def course(self, name, *attrs):
        course_obj = {"type": "course", "id": str(name)}
        for attr in attrs:
            course_obj.update(attr)
        return course_obj

    def c_name(self, val): return {"name": str(val)[1:-1] if str(val).startswith('"') else str(val)}
    def c_credits(self, val): return {"credits": int(val)}
    def c_students(self, val): return {"students": int(val)}
    def c_sessions(self, val): return {"sessions_per_week": int(val)}
    def c_type(self, val): return {"room_type": str(val)}

    @v_args(inline=False)
    def room(self, items):
        return {"type": "room", "id": str(items[0]), "capacity": int(items[1]), "room_type": str(items[2])}

    @v_args(inline=False)
    def instructor(self, items):
        name = str(items[0])
        teaches = []
        attrs = []
        for item in items[1:]:
            if isinstance(item, list):
                # could be teaches list or attr list
                pass
            elif isinstance(item, dict):
                attrs.append(item)
            elif isinstance(item, str):
                teaches.append(item) 
        
        inst_obj = {"type": "instructor", "id": name, "courses": teaches}
        for attr in attrs:
            inst_obj.update(attr)
        return inst_obj

    def i_max_hours(self, val): return {"max_hours": int(val)}
    
    @v_args(inline=False)
    def i_available(self, items): 
        return {"available": items[0]}

    @v_args(inline=False)
    def avail_list(self, items):
        return items

    def avail_item(self, day, start, end):
        return {"day": str(day), "start_time": str(start), "end_time": str(end)}

    @v_args(inline=False)
    def group(self, items):
        name = str(items[0])
        size = int(items[1])
        takes = [str(x) for x in items[2:]]
        return {"type": "group", "id": name, "size": size, "courses": takes}

    def timeslot(self, day, start, end):
        return {"type": "timeslot", "day": str(day), "start_time": str(start), "end_time": str(end)}

    def constraint(self, item):
        item["type"] = "constraint"
        return item

    def c_no_overlap(self, c1, c2): return {"name": "no_overlap", "courses": [str(c1), str(c2)]}
    def c_require_room(self, c, r): return {"name": "require_room", "course": str(c), "room": str(r)}
    def c_same_day(self, c1, c2): return {"name": "same_day", "courses": [str(c1), str(c2)]}
    def c_max_daily(self, inst, limit): return {"name": "max_daily", "instructor": str(inst), "limit": int(limit)}
    def c_instructor_group_no_day(self, inst, grp, day): return {"name": "instructor_group_no_day", "instructor": str(inst), "group": str(grp), "day": str(day)}

    def preference(self, item):
        item["type"] = "preference"
        return item

    def p_morning(self, c, w): return {"name": "morning", "course": str(c), "weight": int(w)}
    def p_avoid_day(self, c, d, w): return {"name": "avoid_day", "course": str(c), "day": str(d), "weight": int(w)}
    def p_consecutive(self, c, w): return {"name": "consecutive", "course": str(c), "weight": int(w)}
    def p_compact(self, g, w): return {"name": "compact", "group": str(g), "weight": int(w)}
    def p_instructor_morning(self, inst, day, w): return {"name": "instructor_morning", "instructor": str(inst), "day": str(day), "weight": int(w)}
    def p_instructor_afternoon(self, inst, day, w): return {"name": "instructor_afternoon", "instructor": str(inst), "day": str(day), "weight": int(w)}
