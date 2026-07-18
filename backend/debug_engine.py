from app.db.database import engine

print(engine.url)
print(engine.url.query)
