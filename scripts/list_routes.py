from app.main import app
for r in app.routes:
    methods = getattr(r, 'methods', None)
    print(r.path, methods, r.name)
