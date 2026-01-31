import psycopg2

DB_PARAMS = {
    'dbname': 'auth_db',
    'user': 'postgres',
    'password': 'vaibhav',
    'host': 'localhost',
}

HASHES = [
    ("pbkdf2$200000$1ffaa1edfec9d32f91b9e7119f93776a$dc3b47942c7f8001147fa6c92ec125f31548bc8408032664e05657f1db3ceb4a", 1002),
    ("pbkdf2$200000$1810c195521cca4ba4b01db156e99703$54befd411779bb286a58d295158042605e473cf86e49bf3301627bd6fc964a60", 1001),
    ("pbkdf2$200000$4c2c59af506efb6b2f5ae861721a7f05$28f143c74e93bd963f8e32d2aefb37140abbd3f6f0c524c4f50a53c9cb370caf", 1003),
]


def main():
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    for pw, uid in HASHES:
        cur.execute("UPDATE users_auth SET password_hash = %s WHERE user_id = %s", (pw, uid))
    conn.commit()

    cur.execute("SELECT user_id, length(password_hash) AS len, substring(password_hash for 200) FROM users_auth WHERE user_id IN (1001,1002,1003) ORDER BY user_id")
    rows = cur.fetchall()
    for r in rows:
        print(r)

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
