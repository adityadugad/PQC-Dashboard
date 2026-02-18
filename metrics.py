import time
import secrets
from cryptography.hazmat.primitives.asymmetric import rsa, x25519, padding


# =========================================================
# HELPER → MEASURE THROUGHPUT
# =========================================================
def measure_throughput(func, runs=50):
    start = time.perf_counter()
    for _ in range(runs):
        func()
    end = time.perf_counter()
    return runs / (end - start)


# =========================================================
# PQC (SIMULATED CRYSTALS-KYBER)
# =========================================================
def pqc_metrics():

    # ---------- KEYGEN ----------
    t0 = time.perf_counter()
    secrets.token_bytes(32)
    t1 = time.perf_counter()

    # ---------- ENCRYPT ----------
    t2 = time.perf_counter()
    secrets.token_bytes(768)
    t3 = time.perf_counter()

    # ---------- DECRYPT ----------
    t4 = time.perf_counter()
    secrets.token_bytes(32)
    t5 = time.perf_counter()

    keygen = (t1 - t0) * 1000
    encap = (t3 - t2) * 1000
    decap = (t5 - t4) * 1000

    # ---------- THROUGHPUT ----------
    throughput = measure_throughput(lambda: secrets.token_bytes(32))

    return {
        "algorithm": "Kyber (Simulated)",
        "keygen_ms": keygen,
        "encrypt_ms": encap,
        "decrypt_ms": decap,
        "total_ms": keygen + encap + decap,

        # fixed metrics
        "public_key": 800,
        "ciphertext": 768,

        # supremacy metric
        "quantum_score": 1,   # quantum safe

        # performance metric
        "throughput_ops": throughput
    }


# =========================================================
# RSA 2048
# =========================================================
def rsa_metrics():

    # ---------- KEYGEN ----------
    t0 = time.perf_counter()
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    t1 = time.perf_counter()

    # ---------- ENCRYPT ----------
    t2 = time.perf_counter()
    ct = key.public_key().encrypt(b"test", padding.PKCS1v15())
    t3 = time.perf_counter()

    # ---------- DECRYPT ----------
    t4 = time.perf_counter()
    key.decrypt(ct, padding.PKCS1v15())
    t5 = time.perf_counter()

    keygen = (t1 - t0) * 1000
    enc = (t3 - t2) * 1000
    dec = (t5 - t4) * 1000

    # ---------- THROUGHPUT ----------
    throughput = measure_throughput(
        lambda: rsa.generate_private_key(public_exponent=65537, key_size=2048),
        runs=5
    )

    return {
        "algorithm": "RSA-2048",
        "keygen_ms": keygen,
        "encrypt_ms": enc,
        "decrypt_ms": dec,
        "total_ms": keygen + enc + dec,

        # approx sizes
        "public_key": 450,
        "ciphertext": 256,

        "quantum_score": 0,  # broken by quantum

        "throughput_ops": throughput
    }


# =========================================================
# ECDH X25519
# =========================================================
def ecdh_metrics():

    # ---------- KEYGEN ----------
    t0 = time.perf_counter()
    priv = x25519.X25519PrivateKey.generate()
    peer = x25519.X25519PrivateKey.generate().public_key()
    t1 = time.perf_counter()

    # ---------- EXCHANGE ----------
    t2 = time.perf_counter()
    priv.exchange(peer)
    t3 = time.perf_counter()

    keygen = (t1 - t0) * 1000
    exchange = (t3 - t2) * 1000

    # ---------- THROUGHPUT ----------
    throughput = measure_throughput(
        lambda: x25519.X25519PrivateKey.generate()
    )

    return {
        "algorithm": "ECDH X25519",
        "keygen_ms": keygen,
        "encrypt_ms": exchange,
        "decrypt_ms": 0,
        "total_ms": keygen + exchange,

        "public_key": 32,
        "ciphertext": 0,

        "quantum_score": 0,

        "throughput_ops": throughput
    }


# =========================================================
# RETURN ALL METRICS TOGETHER
# =========================================================
def get_all_metrics():
    return {
        "pqc": pqc_metrics(),
        "rsa": rsa_metrics(),
        "ecdh": ecdh_metrics()
    }
