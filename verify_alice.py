import psycopg2
import hashlib
import hmac
import binascii

DB = dict(dbname='auth_db', user='postgres', password='vaibhav', host='localhost')

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users_auth WHERE email = %s LIMIT 1", ('alice@example.com',))
    row = cur.fetchone()
    if not row:
        print('NO_USER')
        return
    stored = row[0]
    print('STORED_HASH_LEN:', len(stored))
    print('STORED_HASH_SNIPPET:', stored[:120])

    # verify alicepass
    try:
        parts = stored.split('$')
        if parts[0] != 'pbkdf2':
            print('UNKNOWN_FORMAT')
            return
        iterations = int(parts[1])
        salt = binascii.unhexlify(parts[2])
        expected = binascii.unhexlify(parts[3])
        dk = hashlib.pbkdf2_hmac('sha256', b'alicepass', salt, iterations)
        if hmac.compare_digest(dk, expected):
            print('VERIFIED')
        else:
            print('MISMATCH')
    except Exception as e:
        print('ERROR', e)

if __name__ == '__main__':
    main()
