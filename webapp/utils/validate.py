is_non_null_and_non_empty = lambda field: field and len(field) > 0

def is_all_non_null_and_non_empty(fields):
    for field in fields:
        if not is_non_null_and_non_empty(field): return False
    return True