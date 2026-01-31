import os
import binascii
import hashlib


def get_password_hash(password: str, iterations: int = 200_000) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"pbkdf2${iterations}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"


def gen(pw):
    return get_password_hash(pw)


if __name__ == '__main__':
    print('ALICE|' + gen('alicepass'))
    print('OWNER|' + gen('ownerpass'))
    print('BOB|' + gen('bobpass'))
