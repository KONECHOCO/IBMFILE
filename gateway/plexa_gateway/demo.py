"""Builds the demo SQLite database (fictional sample data, always labelled as demo).

It gives new users — and app store reviewers — something real to query
before they connect their own databases.
"""
import random
import sqlite3
from datetime import date, timedelta

from . import config

DEMO_FILE = "demo.sqlite"

_COMPANIES = ["Aurora Logistica", "Borealis Foods", "Cobalto Meccanica", "Delta Tessile", "Eolo Energia",
              "Faro Ottica", "Gemma Gioielli", "Helios Solar", "Iride Pharma", "Lago Blu Hotels",
              "Mistral Cantieri", "Nettuno Pesca", "Orione Software", "Pietra Edilizia", "Quercia Arredi",
              "Rubino Moda", "Saturno Trasporti", "Tirreno Vini", "Urano Ricambi", "Vesta Ceramiche"]
_CITIES = [("Milano", "IT"), ("Torino", "IT"), ("Bologna", "IT"), ("Roma", "IT"), ("Napoli", "IT"),
           ("München", "DE"), ("Lyon", "FR"), ("Madrid", "ES"), ("Wien", "AT"), ("Zürich", "CH")]
_PRODUCTS = [("Bulloni M8 inox", "Ferramenta", 0.35), ("Pannello solare 400W", "Energia", 189.0),
             ("Cavo FG16 3x2,5", "Elettrico", 2.10), ("Valvola a sfera 1\"", "Idraulica", 14.90),
             ("Inverter ibrido 6kW", "Energia", 1290.0), ("Guanti nitrile (100)", "Sicurezza", 8.50),
             ("Casco EN397", "Sicurezza", 22.0), ("Trapano a percussione", "Utensili", 119.0),
             ("Silicone neutro", "Edilizia", 4.80), ("Pallet EPAL", "Logistica", 11.0),
             ("Batteria LiFePO4 5kWh", "Energia", 2150.0), ("Nastro americano", "Ferramenta", 3.20)]
_FIRST = ["Giulia", "Marco", "Sofia", "Luca", "Chiara", "Matteo", "Anna", "Paolo", "Elena", "Davide",
          "Sara", "Andrea", "Laura", "Simone", "Marta", "Fabio"]
_LAST = ["Rossi", "Bianchi", "Ferrari", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo"]
_DEPTS = ["Vendite", "Amministrazione", "Logistica", "IT", "Produzione", "Acquisti"]


def build(path) -> None:
    rnd = random.Random(400)
    path.unlink(missing_ok=True)
    db = sqlite3.connect(path)
    db.executescript("""
        CREATE TABLE CUSTOMERS (CUST_ID INTEGER PRIMARY KEY, COMPANY_NAME TEXT, CITY TEXT, COUNTRY TEXT,
            EMAIL TEXT, CREDIT_LIMIT REAL, OPEN_BALANCE REAL, STATUS TEXT, CREATED_ON TEXT);
        CREATE TABLE PRODUCTS (PRODUCT_ID INTEGER PRIMARY KEY, DESCRIPTION TEXT, CATEGORY TEXT,
            UNIT_PRICE REAL, STOCK_QTY INTEGER);
        CREATE TABLE ORDERS (ORDER_ID INTEGER PRIMARY KEY, CUST_ID INTEGER REFERENCES CUSTOMERS,
            ORDER_DATE TEXT, STATUS TEXT, TOTAL_AMOUNT REAL);
        CREATE TABLE ORDER_LINES (ORDER_ID INTEGER REFERENCES ORDERS, LINE_NO INTEGER,
            PRODUCT_ID INTEGER REFERENCES PRODUCTS, QUANTITY INTEGER, UNIT_PRICE REAL, LINE_AMOUNT REAL,
            PRIMARY KEY (ORDER_ID, LINE_NO));
        CREATE TABLE EMPLOYEES (EMP_ID INTEGER PRIMARY KEY, FULL_NAME TEXT, DEPARTMENT TEXT, JOB_TITLE TEXT,
            HIRE_DATE TEXT, SALARY REAL, EMAIL TEXT);
        CREATE VIEW V_SALES_BY_COUNTRY AS
            SELECT c.COUNTRY, COUNT(DISTINCT o.ORDER_ID) AS ORDERS, ROUND(SUM(o.TOTAL_AMOUNT), 2) AS REVENUE
            FROM ORDERS o JOIN CUSTOMERS c ON c.CUST_ID = o.CUST_ID GROUP BY c.COUNTRY;
    """)
    for i, name in enumerate(_COMPANIES, start=1001):
        city, country = rnd.choice(_CITIES)
        slug = name.lower().replace(" ", "")
        db.execute("INSERT INTO CUSTOMERS VALUES (?,?,?,?,?,?,?,?,?)", (
            i, name, city, country, f"amministrazione@{slug}.example", rnd.choice([25000, 50000, 100000, 250000]),
            0.0, rnd.choice("AAAAS"), (date(2019, 1, 1) + timedelta(days=rnd.randint(0, 1800))).isoformat()))
    for i, (desc, cat, price) in enumerate(_PRODUCTS, start=1):
        db.execute("INSERT INTO PRODUCTS VALUES (?,?,?,?,?)", (i, desc, cat, price, rnd.randint(0, 5000)))
    start = date(2025, 1, 1)
    for order_id in range(50001, 50401):
        cust = rnd.randint(1001, 1000 + len(_COMPANIES))
        day = (start + timedelta(days=rnd.randint(0, 640))).isoformat()
        total = 0.0
        for line in range(1, rnd.randint(1, 5) + 1):
            pid = rnd.randint(1, len(_PRODUCTS))
            price = _PRODUCTS[pid - 1][2]
            qty = rnd.randint(1, 40)
            amount = round(price * qty, 2)
            total += amount
            db.execute("INSERT INTO ORDER_LINES VALUES (?,?,?,?,?,?)", (order_id, line, pid, qty, price, amount))
        status = rnd.choice(["SHIPPED", "SHIPPED", "SHIPPED", "INVOICED", "OPEN", "CANCELLED"])
        db.execute("INSERT INTO ORDERS VALUES (?,?,?,?,?)", (order_id, cust, day, status, round(total, 2)))
    db.execute("""UPDATE CUSTOMERS SET OPEN_BALANCE = COALESCE((SELECT ROUND(SUM(TOTAL_AMOUNT), 2) FROM ORDERS
                  WHERE ORDERS.CUST_ID = CUSTOMERS.CUST_ID AND ORDERS.STATUS IN ('OPEN','INVOICED')), 0)""")
    for emp_id in range(8001, 8041):
        first, last = rnd.choice(_FIRST), rnd.choice(_LAST)
        dept = rnd.choice(_DEPTS)
        db.execute("INSERT INTO EMPLOYEES VALUES (?,?,?,?,?,?,?)", (
            emp_id, f"{first} {last}", dept, f"Specialista {dept}",
            (date(2012, 1, 1) + timedelta(days=rnd.randint(0, 4800))).isoformat(),
            float(rnd.randrange(28000, 85000, 500)), f"{first}.{last}@azienda-demo.example".lower()))
    db.commit()
    db.close()


def ensure(store) -> None:
    path = config.DATA_DIR / DEMO_FILE
    if not path.exists():
        build(path)
    if not any(c["is_demo"] for c in store.list_connections()):
        store.save_connection({
            "name": "Demo — Sample database",
            "driver": "sqlite",
            "database": DEMO_FILE,
            "is_demo": True,
        })


def ensure_demo_user(store, password_hash: str) -> None:
    """Shared public-demo account: read-only analyst, password reset at every start."""
    from . import config
    existing = store.get_user_by_name(config.DEMO_USER)
    if existing:
        store.set_password(existing["id"], password_hash)
    else:
        store.create_user(config.DEMO_USER, password_hash, "analyst")
