import sqlite3
db = sqlite3.connect(r'C:\Users\alber\AppData\Roaming\@freedom-studio\desktop\data\freedom-studio.db')
cur = db.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', [r[0] for r in cur.fetchall()])
cur.execute("SELECT * FROM settings")
print('All settings:', cur.fetchall())
# Delete setupComplete to reset wizard
cur.execute("DELETE FROM settings WHERE key='setupComplete'")
db.commit()
print('Deleted setupComplete - wizard will show on next launch')
db.close()
