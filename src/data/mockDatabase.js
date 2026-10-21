export const DATABASES = [
  {
    id: "PUB400",
    name: "PUB400 (Public IBM i Cloud)",
    type: "IBM i 7.5 Power System",
    port: 446,
    protocol: "DRDA / DDM Host Server",
    host: "pub400.com",
    ipAddress: "185.113.5.134",
    username: "PUB400_USER",
    password: "••••••••••••",
    databaseName: "PUB400",
    libraryList: "QIWS, QGPL, QTEMP",
    subsystem: "QBASE / *SYSBAS",
    ccsid: "37 (USA / Western EBCDIC)",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 15,
    poolSize: 10,
    status: "CONNECTED",
    latency: "31.4 ms",
    version: "IBM i V7R5 TR3 (OS/400)",
    color: "#0f62fe",
  },
  {
    id: "IBMi",
    name: "IBM i (AS/400) — Db2 for i Corporate",
    type: "IBM i Power10 LPAR",
    port: 446,
    protocol: "DRDA / Native QSYS",
    host: "as400-pr01.corp.internal",
    username: "QUSER_PROD",
    password: "••••••••••••",
    databaseName: "PRODLIB",
    libraryList: "PRODLIB, QGPL, FINLIB, QTEMP",
    subsystem: "QBASE / *SYSBAS",
    ccsid: "280 (Italy / Euro EBCDIC)",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 15,
    poolSize: 30,
    status: "CONNECTED",
    latency: "1.4 ms",
    version: "IBM i V7R5 TR3",
    color: "#0f62fe",
  },
  {
    id: "Oracle23c",
    name: "Oracle 23c Enterprise",
    type: "Oracle Autonomous DB",
    port: 1521,
    protocol: "TNS / Net8",
    host: "ora-rac02.enterprise.net",
    username: "HR_CORP_ADMIN",
    password: "••••••••••••",
    databaseName: "ORCLPDB1.CORP",
    libraryList: "HR_CORP, FIN_DATA",
    subsystem: "RAC_NODE_02",
    ccsid: "AL32UTF8",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 20,
    poolSize: 20,
    status: "CONNECTED",
    latency: "3.2 ms",
    version: "Release 23.4.0.24",
    color: "#da1e28",
  },
  {
    id: "PostgreSQL16",
    name: "PostgreSQL 16 Cluster",
    type: "Enterprise PG Pooler",
    port: 5432,
    protocol: "PostgreSQL LibPQ",
    host: "pg-prod-us-east.aws.internal",
    username: "pg_read_governance",
    password: "••••••••••••",
    databaseName: "billing_prod",
    libraryList: "public, billing, analytics",
    subsystem: "pg_bouncer_pool",
    ccsid: "UTF-8",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 10,
    poolSize: 40,
    status: "CONNECTED",
    latency: "4.1 ms",
    version: "v16.2 pg_bouncer",
    color: "#1192e8",
  },
  {
    id: "SnowflakeDW",
    name: "Snowflake Cloud DW",
    type: "Cloud Data Warehouse",
    port: 443,
    protocol: "SnowSQL / Arrow Flight",
    host: "corp-dw.snowflakecomputing.com",
    username: "SF_GOVERNANCE_ROLE",
    password: "••••••••••••",
    databaseName: "ENTERPRISE_DW",
    libraryList: "PUBLIC, REPORTING",
    subsystem: "VIRTUAL_WH_XL",
    ccsid: "UTF-8",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 30,
    poolSize: 15,
    status: "CONNECTED",
    latency: "12.8 ms",
    version: "Virtual WH X-LARGE",
    color: "#009d9a",
  },
  {
    id: "MSSQL",
    name: "Microsoft SQL Server 2022",
    type: "AlwaysOn High-Availability",
    port: 1433,
    protocol: "TDS / JDBC 12.4",
    host: "sql-cl01.hq.internal",
    username: "sql_auditor_app",
    password: "••••••••••••",
    databaseName: "CorporateERP_2026",
    libraryList: "dbo, finance",
    subsystem: "SQL_ALWAYS_ON_AG",
    ccsid: "Latin1_General_CI_AS",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 15,
    poolSize: 25,
    status: "CONNECTED",
    latency: "2.8 ms",
    version: "SQL Server 2022 CU11",
    color: "#ee5396",
  },
  {
    id: "MySQL8",
    name: "MySQL 8.4 LTS Enterprise",
    type: "InnoDB Enterprise Cluster",
    port: 3306,
    protocol: "MySQL Native X-Protocol",
    host: "mysql-core.eu-central.net",
    username: "store_readonly_svc",
    password: "••••••••••••",
    databaseName: "store_db",
    libraryList: "store_db, audit_log",
    subsystem: "Cluster_Group_01",
    ccsid: "utf8mb4",
    ssl: true,
    readOnlyEnforced: true,
    connectionTimeout: 15,
    poolSize: 20,
    status: "CONNECTED",
    latency: "3.7 ms",
    version: "8.4.1 commercial",
    color: "#fa4d56",
  }
];

export const MOCK_TABLES = {
  PUB400: [
    {
      id: "QCUSTCDT",
      name: "QIWS / QCUSTCDT",
      type: "Physical File (PF)",
      description: "IBM i Benchmark Customer Credit Data (Db2 for i)",
      columns: [
        { name: "CUSNUM", type: "DECIMAL(6,0)", desc: "Customer Account Number", pii: false, pk: true },
        { name: "LSTNAM", type: "CHAR(10)", desc: "Customer Last Name", pii: true },
        { name: "INIT", type: "CHAR(3)", desc: "Customer Initials", pii: false },
        { name: "STREET", type: "CHAR(15)", desc: "Street Address", pii: true },
        { name: "CITY", type: "CHAR(12)", desc: "City", pii: false },
        { name: "STATE", type: "CHAR(2)", desc: "State Code", pii: false },
        { name: "ZIPCOD", type: "DECIMAL(5,0)", desc: "Zip Code", pii: false },
        { name: "CDTLMT", type: "DECIMAL(4,0)", desc: "Credit Limit ($)", pii: false },
        { name: "CHGCOD", type: "DECIMAL(1,0)", desc: "Charge Code", pii: false },
        { name: "BALDUE", type: "DECIMAL(6,2)", desc: "Balance Due ($)", pii: false },
        { name: "CDTDUE", type: "DECIMAL(6,2)", desc: "Credit Due ($)", pii: false }
      ],
      data: [
        { CUSNUM: 938472, LSTNAM: "Henning", INIT: "G K", STREET: "4850 Elm St", CITY: "Dallas", STATE: "TX", ZIPCOD: 75201, CDTLMT: 5000, CHGCOD: 3, BALDUE: 37.00, CDTDUE: 0.00 },
        { CUSNUM: 839283, LSTNAM: "Jones", INIT: "B D", STREET: "345 State St", CITY: "New York", STATE: "NY", ZIPCOD: 10001, CDTLMT: 4000, CHGCOD: 1, BALDUE: 100.00, CDTDUE: 0.00 },
        { CUSNUM: 392842, LSTNAM: "Vine", INIT: "S S", STREET: "123 Vine Rd", CITY: "San Jose", STATE: "CA", ZIPCOD: 95101, CDTLMT: 7000, CHGCOD: 1, BALDUE: 439.00, CDTDUE: 0.00 },
        { CUSNUM: 392843, LSTNAM: "Johnson", INIT: "J A", STREET: "3 Edgar St", CITY: "Chicago", STATE: "IL", ZIPCOD: 60601, CDTLMT: 2000, CHGCOD: 2, BALDUE: 398.75, CDTDUE: 50.00 },
        { CUSNUM: 938294, LSTNAM: "Tyree", INIT: "E F", STREET: "34 Lake St", CITY: "Austin", STATE: "TX", ZIPCOD: 78701, CDTLMT: 6000, CHGCOD: 2, BALDUE: 8.00, CDTDUE: 0.00 },
        { CUSNUM: 583920, LSTNAM: "Stevens", INIT: "K L", STREET: "208 George St", CITY: "Atlanta", STATE: "GA", ZIPCOD: 30301, CDTLMT: 9000, CHGCOD: 1, BALDUE: 58.75, CDTDUE: 15.00 }
      ]
    },
    {
      id: "QEMP",
      name: "QIWS / QEMP",
      type: "Physical File (PF)",
      description: "IBM i Official Employee Department Roster",
      columns: [
        { name: "EMPNO", type: "CHAR(6)", desc: "Employee Identification Number", pii: false, pk: true },
        { name: "FIRSTNME", type: "VARCHAR(12)", desc: "First Name", pii: true },
        { name: "LASTNAME", type: "VARCHAR(15)", desc: "Last Name", pii: true },
        { name: "WORKDEPT", type: "CHAR(3)", desc: "Department Code", pii: false },
        { name: "PHONENO", type: "CHAR(4)", desc: "Internal Extension", pii: false },
        { name: "SALARY", type: "DECIMAL(9,2)", desc: "Annual Salary ($)", pii: true }
      ],
      data: [
        { EMPNO: "000010", FIRSTNME: "CHRISTINE", LASTNAME: "HAAS", WORKDEPT: "A00", PHONENO: "3978", SALARY: 152750.00 },
        { EMPNO: "000020", FIRSTNME: "MICHAEL", LASTNAME: "THOMPSON", WORKDEPT: "B01", PHONENO: "3476", SALARY: 94250.00 },
        { EMPNO: "000030", FIRSTNME: "SALLY", LASTNAME: "KWAN", WORKDEPT: "C01", PHONENO: "4738", SALARY: 88250.00 }
      ]
    }
  ],
  IBMi: [
    {
      id: "CUSTMAST",
      name: "PRODLIB / CUSTMAST",
      type: "Physical File (PF)",
      description: "Anagrafica Clienti e Fido Accordato (Db2/400)",
      columns: [
        { name: "CUST_ID", type: "DECIMAL(8,0)", desc: "Codice Cliente Univoco", pii: false, pk: true },
        { name: "COMPANY_NAME", type: "CHAR(40)", desc: "Ragione Sociale", pii: false },
        { name: "VAT_TAX_ID", type: "CHAR(16)", desc: "Codice Fiscale / Partita IVA", pii: true },
        { name: "IBAN_CODE", type: "CHAR(34)", desc: "Coordinate Bancarie IBAN", pii: true },
        { name: "OPEN_BALANCE", type: "DECIMAL(11,2)", desc: "Saldo Contabile Aperto (€)", pii: false },
        { name: "CREDIT_LIMIT", type: "DECIMAL(11,2)", desc: "Limite Fido Accordato (€)", pii: false },
        { name: "CITY", type: "CHAR(25)", desc: "Città Sede Legale", pii: false },
        { name: "COUNTRY", type: "CHAR(2)", desc: "Codice Nazione ISO", pii: false },
        { name: "STATUS", type: "CHAR(1)", desc: "Stato (A=Attivo, S=Sospeso, B=Bloccato)", pii: false }
      ],
      data: [
        { CUST_ID: 10045812, COMPANY_NAME: "Ferrari Meccanica SpA", VAT_TAX_ID: "IT01849200361", IBAN_CODE: "IT60X0542811101000000123456", OPEN_BALANCE: 84500.00, CREDIT_LIMIT: 250000.00, CITY: "Maranello", COUNTRY: "IT", STATUS: "A" },
        { CUST_ID: 10045813, COMPANY_NAME: "Siemens Logistics GmbH", VAT_TAX_ID: "DE129274202", IBAN_CODE: "DE89370400440532013000", OPEN_BALANCE: 142300.50, CREDIT_LIMIT: 500000.00, CITY: "Munich", COUNTRY: "DE", STATUS: "A" },
        { CUST_ID: 10045814, COMPANY_NAME: "Airbus Defense & Space", VAT_TAX_ID: "FR383933415", IBAN_CODE: "FR7630006000011234567890189", OPEN_BALANCE: 218900.00, CREDIT_LIMIT: 800000.00, CITY: "Toulouse", COUNTRY: "FR", STATUS: "A" },
        { CUST_ID: 10045815, COMPANY_NAME: "Banco Santander Global", VAT_TAX_ID: "ESB82473070", IBAN_CODE: "ES9121000418450200051332", OPEN_BALANCE: 31200.00, CREDIT_LIMIT: 150000.00, CITY: "Madrid", COUNTRY: "ES", STATUS: "A" },
        { CUST_ID: 10045816, COMPANY_NAME: "Hitachi Energy Corp", VAT_TAX_ID: "JP90100010088", IBAN_CODE: "JP0010001008892147854123", OPEN_BALANCE: 96400.00, CREDIT_LIMIT: 400000.00, CITY: "Tokyo", COUNTRY: "JP", STATUS: "A" },
        { CUST_ID: 10045817, COMPANY_NAME: "Luxottica Group SpA", VAT_TAX_ID: "IT00891040255", IBAN_CODE: "IT45P0200809434000100459812", OPEN_BALANCE: 58200.00, CREDIT_LIMIT: 300000.00, CITY: "Agordo", COUNTRY: "IT", STATUS: "A" },
        { CUST_ID: 10045818, COMPANY_NAME: "Nestlé Suisse SA", VAT_TAX_ID: "CHE105953049", IBAN_CODE: "CH9300762011623852957", OPEN_BALANCE: 12900.00, CREDIT_LIMIT: 200000.00, CITY: "Vevey", COUNTRY: "CH", STATUS: "A" },
        { CUST_ID: 10045819, COMPANY_NAME: "Pirelli Tyre SpA", VAT_TAX_ID: "IT00886860155", IBAN_CODE: "IT32B0306909606100000019482", OPEN_BALANCE: 175400.00, CREDIT_LIMIT: 600000.00, CITY: "Milano", COUNTRY: "IT", STATUS: "A" },
        { CUST_ID: 10045820, COMPANY_NAME: "BASF Coatings GmbH", VAT_TAX_ID: "DE143621458", IBAN_CODE: "DE44500105175407324931", OPEN_BALANCE: 64100.00, CREDIT_LIMIT: 250000.00, CITY: "Münster", COUNTRY: "DE", STATUS: "S" },
        { CUST_ID: 10045821, COMPANY_NAME: "STMicroelectronics NV", VAT_TAX_ID: "NL007787321B01", IBAN_CODE: "NL91ABNA0417164300", OPEN_BALANCE: 310500.00, CREDIT_LIMIT: 1000000.00, CITY: "Geneva", COUNTRY: "CH", STATUS: "A" }
      ]
    },
    {
      id: "INVENT01",
      name: "PRODLIB / INVENT01",
      type: "Physical File (PF)",
      description: "Giacenze Magazzino Centrale e Punti di Riordino",
      columns: [
        { name: "SKU_CODE", type: "CHAR(12)", desc: "Codice Articolo Magazzino", pii: false, pk: true },
        { name: "ITEM_DESC", type: "CHAR(40)", desc: "Descrizione Tecnica Componente", pii: false },
        { name: "QTY_ON_HAND", type: "DECIMAL(9,0)", desc: "Quantità Disponibile a Stock", pii: false },
        { name: "REORDER_POINT", type: "DECIMAL(7,0)", desc: "Soglia Minima di Riordino", pii: false },
        { name: "UNIT_COST", type: "DECIMAL(9,2)", desc: "Costo Medio Unitario (€)", pii: false },
        { name: "WAREHOUSE_LOC", type: "CHAR(8)", desc: "Ubicazione Scaffale", pii: false },
        { name: "STATUS_FLAG", type: "CHAR(1)", desc: "Flag Stato Stock", pii: false }
      ],
      data: [
        { SKU_CODE: "PWR-AS400-01", ITEM_DESC: "Alimentatore Ridondante Power10", QTY_ON_HAND: 14, REORDER_POINT: 20, UNIT_COST: 1850.00, WAREHOUSE_LOC: "BAY-04-A", STATUS_FLAG: "W" },
        { SKU_CODE: "SAS-SSD-384T", ITEM_DESC: "Drive NVMe 3.84TB SAS per IBM i", QTY_ON_HAND: 82, REORDER_POINT: 50, UNIT_COST: 620.00, WAREHOUSE_LOC: "BAY-01-C", STATUS_FLAG: "N" },
        { SKU_CODE: "FBR-HBA-32GB", ITEM_DESC: "Scheda Fibra PCIe 32Gbps Dual Port", QTY_ON_HAND: 9, REORDER_POINT: 15, UNIT_COST: 1120.00, WAREHOUSE_LOC: "BAY-02-B", STATUS_FLAG: "W" },
        { SKU_CODE: "RAM-DDR5-64G", ITEM_DESC: "Modulo RAM ECC 64GB Registered", QTY_ON_HAND: 140, REORDER_POINT: 60, UNIT_COST: 390.00, WAREHOUSE_LOC: "BAY-03-A", STATUS_FLAG: "N" },
        { SKU_CODE: "SEC-HSM-2026", ITEM_DESC: "Modulo Crittografico Hardware HSM", QTY_ON_HAND: 4, REORDER_POINT: 10, UNIT_COST: 5400.00, WAREHOUSE_LOC: "VAULT-01", STATUS_FLAG: "C" },
        { SKU_CODE: "LAN-100G-OP4", ITEM_DESC: "Transceiver Ottico QSFP28 100G", QTY_ON_HAND: 38, REORDER_POINT: 25, UNIT_COST: 430.00, WAREHOUSE_LOC: "BAY-02-E", STATUS_FLAG: "N" }
      ]
    },
    {
      id: "GLTRAN",
      name: "FINLIB / GLTRAN",
      type: "Physical File (PF)",
      description: "Movimenti di Prima Nota e Partitario Generale",
      columns: [
        { name: "TRANS_ID", type: "DECIMAL(10,0)", desc: "Numero Protocollo Registrazione", pii: false, pk: true },
        { name: "TRANS_DATE", type: "DATE", desc: "Data Contabile", pii: false },
        { name: "ACCOUNT_NO", type: "CHAR(12)", desc: "Conto Mastro Piano dei Conti", pii: false },
        { name: "DEBIT_AMT", type: "DECIMAL(12,2)", desc: "Importo Dare (€)", pii: false },
        { name: "CREDIT_AMT", type: "DECIMAL(12,2)", desc: "Importo Avere (€)", pii: false },
        { name: "DESCR", type: "CHAR(50)", desc: "Causale e Descrizione Movimento", pii: false }
      ],
      data: [
        { TRANS_ID: 98120401, TRANS_DATE: "2026-10-18", ACCOUNT_NO: "100.01.002", DEBIT_AMT: 84500.00, CREDIT_AMT: 0.00, DESCR: "Incasso Bonifico SEPA Ferrari Meccanica" },
        { TRANS_ID: 98120402, TRANS_DATE: "2026-10-19", ACCOUNT_NO: "400.10.050", DEBIT_AMT: 0.00, CREDIT_AMT: 142300.50, DESCR: "Emissione Fattura 2026/F0941 Siemens" },
        { TRANS_ID: 98120403, TRANS_DATE: "2026-10-20", ACCOUNT_NO: "100.01.002", DEBIT_AMT: 218900.00, CREDIT_AMT: 0.00, DESCR: "Regolazione Contabile Airbus Toulouse" },
        { TRANS_ID: 98120404, TRANS_DATE: "2026-10-21", ACCOUNT_NO: "300.05.012", DEBIT_AMT: 12450.00, CREDIT_AMT: 0.00, DESCR: "Canone Manutenzione Sistemi IBM i Q3" }
      ]
    }
  ],
  Oracle23c: [
    {
      id: "EMPLOYEES",
      name: "HR_CORP.EMPLOYEES",
      type: "Table",
      description: "Personale, Salari e Qualifiche Dipendenti",
      columns: [
        { name: "EMP_ID", type: "NUMBER(6)", desc: "Badge ID Dipendente", pii: false, pk: true },
        { name: "FULL_NAME", type: "VARCHAR2(60)", desc: "Nome e Cognome", pii: true },
        { name: "JOB_TITLE", type: "VARCHAR2(50)", desc: "Ruolo Aziendale", pii: false },
        { name: "DEPARTMENT", type: "VARCHAR2(40)", desc: "Dipartimento", pii: false },
        { name: "SALARY", type: "NUMBER(9,2)", desc: "Retribuzione Annua Lorda (€)", pii: true },
        { name: "TAX_CODE", type: "VARCHAR2(20)", desc: "Codice Fiscale Personale", pii: true },
        { name: "HIRE_DATE", type: "DATE", desc: "Data Assunzione", pii: false }
      ],
      data: [
        { EMP_ID: 8011, FULL_NAME: "Elena Rossi", JOB_TITLE: "Chief Data Architect", DEPARTMENT: "IT Architecture", SALARY: 115000.00, TAX_CODE: "RSSLNE78A41F205W", HIRE_DATE: "2018-03-01" },
        { EMP_ID: 8012, FULL_NAME: "Marco Bianchi", JOB_TITLE: "Senior IBM i Specialist", DEPARTMENT: "Systems Engineering", SALARY: 88500.00, TAX_CODE: "BNCMRA82M15H501Y", HIRE_DATE: "2015-09-15" },
        { EMP_ID: 8013, FULL_NAME: "Sophie Dubois", JOB_TITLE: "Security & Compliance Officer", DEPARTMENT: "Legal & Risk", SALARY: 95000.00, TAX_CODE: "DBSPH89L44Z110P", HIRE_DATE: "2020-01-10" },
        { EMP_ID: 8014, FULL_NAME: "Alexander Weber", JOB_TITLE: "Lead Backend Developer", DEPARTMENT: "Software Engineering", SALARY: 92000.00, TAX_CODE: "WBRLX84P12Z112K", HIRE_DATE: "2019-06-01" }
      ]
    }
  ],
  PostgreSQL16: [
    {
      id: "SUBSCRIPTIONS",
      name: "billing.subscriptions",
      type: "Table",
      description: "Contratti SaaS e Licenze Enterprise Attive",
      columns: [
        { name: "SUB_UUID", type: "UUID", desc: "Identificativo Abbonamento", pii: false, pk: true },
        { name: "CLIENT_NAME", type: "VARCHAR(80)", desc: "Cliente Licenziatario", pii: false },
        { name: "TIER", type: "VARCHAR(30)", desc: "Livello Piano (Enterprise/Gov)", pii: false },
        { name: "MRR_EUR", type: "NUMERIC(10,2)", desc: "Ricavo Mensile Ricorrente (€)", pii: false },
        { name: "NODES_COUNT", type: "INTEGER", desc: "Nodi LPAR Monitorati", pii: false },
        { name: "RENEWAL_DATE", type: "DATE", desc: "Scadenza Contratto", pii: false }
      ],
      data: [
        { SUB_UUID: "e4d291b0-9832-4112-9c12", CLIENT_NAME: "Fintech Alpine SpA", TIER: "Enterprise Power10 Platinum", MRR_EUR: 14500.00, NODES_COUNT: 8, RENEWAL_DATE: "2027-12-31" },
        { SUB_UUID: "c82110ea-7154-48fa-881b", CLIENT_NAME: "MedLife Pharmaceuticals", TIER: "Data Governance Suite", MRR_EUR: 22000.00, NODES_COUNT: 14, RENEWAL_DATE: "2027-06-30" },
        { SUB_UUID: "a0924bce-3184-4e31-897d", CLIENT_NAME: "EuroFreight Logistics BV", TIER: "U-Query + X-Lock Guard", MRR_EUR: 9800.00, NODES_COUNT: 4, RENEWAL_DATE: "2026-11-30" }
      ]
    }
  ],
  SnowflakeDW: [
    {
      id: "SALES_FACT",
      name: "ENTERPRISE_DW.SALES_FACT",
      type: "Warehouse Table",
      description: "Fatti di Vendita Consolidati Globale",
      columns: [
        { name: "SALE_KEY", type: "BIGINT", desc: "Chiave Surrogata", pii: false, pk: true },
        { name: "REGION", type: "VARCHAR(20)", desc: "Area Geografica", pii: false },
        { name: "PRODUCT_FAMILY", type: "VARCHAR(40)", desc: "Famiglia Prodotti", pii: false },
        { name: "NET_REVENUE", type: "NUMBER(14,2)", desc: "Ricavo Netto Consolidato (€)", pii: false },
        { name: "MARGIN_PCT", type: "NUMBER(5,2)", desc: "Margine Operativo %", pii: false }
      ],
      data: [
        { SALE_KEY: 900142, REGION: "EMEA-South", PRODUCT_FAMILY: "Power Systems Software", NET_REVENUE: 489000.00, MARGIN_PCT: 42.5 },
        { SALE_KEY: 900143, REGION: "EMEA-Central", PRODUCT_FAMILY: "Cyber Security X-Lock", NET_REVENUE: 612000.00, MARGIN_PCT: 58.1 },
        { SALE_KEY: 900144, REGION: "North America", PRODUCT_FAMILY: "Data Governance Cloud", NET_REVENUE: 1140000.00, MARGIN_PCT: 51.4 },
        { SALE_KEY: 900145, REGION: "APAC", PRODUCT_FAMILY: "U-Schedule Automation", NET_REVENUE: 320000.00, MARGIN_PCT: 46.2 }
      ]
    }
  ],
  MSSQL: [
    {
      id: "INVOICES",
      name: "dbo.Invoices",
      type: "Table",
      description: "Fatturazione Elettronica SDI e B2B",
      columns: [
        { name: "INVOICE_NUM", type: "VARCHAR(20)", desc: "Numero Fattura", pii: false, pk: true },
        { name: "CUSTOMER_NAME", type: "VARCHAR(80)", desc: "Destinatario Fattura", pii: false },
        { name: "TOTAL_AMOUNT", type: "DECIMAL(12,2)", desc: "Totale Fattura (€)", pii: false },
        { name: "TAX_AMOUNT", type: "DECIMAL(10,2)", desc: "Totale IVA (€)", pii: false },
        { name: "SDI_STATUS", type: "VARCHAR(20)", desc: "Esito Ricevuta SDI", pii: false }
      ],
      data: [
        { INVOICE_NUM: "2026/FT-0841", CUSTOMER_NAME: "Ferrari Meccanica SpA", TOTAL_AMOUNT: 103090.00, TAX_AMOUNT: 18590.00, SDI_STATUS: "CONSEGNATA" },
        { INVOICE_NUM: "2026/FT-0842", CUSTOMER_NAME: "Pirelli Tyre SpA", TOTAL_AMOUNT: 213988.00, TAX_AMOUNT: 38588.00, SDI_STATUS: "CONSEGNATA" },
        { INVOICE_NUM: "2026/FT-0843", CUSTOMER_NAME: "Luxottica Group SpA", TOTAL_AMOUNT: 71004.00, TAX_AMOUNT: 12804.00, SDI_STATUS: "IN_ELABORAZIONE" }
      ]
    }
  ],
  MySQL8: [
    {
      id: "ORDERS_ONLINE",
      name: "store_db.orders_online",
      type: "InnoDB Table",
      description: "Ordini Ricevuti da Portali E-Commerce",
      columns: [
        { name: "ORDER_ID", type: "INT", desc: "ID Ordine", pii: false, pk: true },
        { name: "CUSTOMER_EMAIL", type: "VARCHAR(80)", desc: "Email Acquirente", pii: true },
        { name: "ORDER_TOTAL", type: "DECIMAL(10,2)", desc: "Totale Ordine (€)", pii: false },
        { name: "ITEMS_COUNT", type: "INT", desc: "Numero Articoli", pii: false },
        { name: "PAYMENT_METHOD", type: "VARCHAR(30)", desc: "Canale di Pagamento", pii: false }
      ],
      data: [
        { ORDER_ID: 554201, CUSTOMER_EMAIL: "purchasing@ferrari.it", ORDER_TOTAL: 4250.00, ITEMS_COUNT: 6, PAYMENT_METHOD: "Bonifico Bancario Anticipato" },
        { ORDER_ID: 554202, CUSTOMER_EMAIL: "supply@siemens.de", ORDER_TOTAL: 8900.00, ITEMS_COUNT: 12, PAYMENT_METHOD: "Corporate Credit Account" },
        { ORDER_ID: 554203, CUSTOMER_EMAIL: "procurement@airbus.fr", ORDER_TOTAL: 15400.00, ITEMS_COUNT: 24, PAYMENT_METHOD: "EDI Transmit" }
      ]
    }
  ]
};

export const MOCK_XLOCK_DATA = {
  ports: [
    { port: 446, service: "DRDA / DDM (IBM i Remote DB)", status: "GUARDED", policy: "TLS 1.3 Strict", rateLimit: "150 req/sec" },
    { port: 50000, service: "Db2 Direct Instance", status: "GUARDED", policy: "Mutual Auth", rateLimit: "300 req/sec" },
    { port: 1521, service: "Oracle Net Listener", status: "MONITORED", policy: "Perimeter Check", rateLimit: "200 req/sec" },
    { port: 5432, service: "PostgreSQL Gateway", status: "MONITORED", policy: "SSL Require", rateLimit: "400 req/sec" }
  ],
  sockets: [
    { id: "SOCK-1", ip: "192.168.10.45", port: 446, protocol: "DRDA v5", user: "QUSER_PROD", state: "ESTABLISHED", throughput: "148 KB/s", latency: "1.2 ms", origin: "Milano HQ" },
    { id: "SOCK-2", ip: "10.240.1.18", port: 446, protocol: "DRDA v5", user: "QSECOFR_SVC", state: "ESTABLISHED", throughput: "220 KB/s", latency: "1.5 ms", origin: "LPAR Backup Service" },
    { id: "SOCK-3", ip: "192.168.12.89", port: 1521, protocol: "Oracle TNS", user: "HR_APP_SRV", state: "ESTABLISHED", throughput: "65 KB/s", latency: "3.1 ms", origin: "Frankfurt DC" },
    { id: "SOCK-4", ip: "45.134.22.9", port: 446, protocol: "DRDA", user: "UNKNOWN", state: "BLOCKED", throughput: "0 KB/s", latency: "0 ms", origin: "External Untrusted IP" }
  ],
  threats: [
    { id: "THR-101", timestamp: "Oggi, 18:42", threatType: "SQL Injection Probe (' OR 1=1 --)", sourceIp: "185.220.101.4", targetPort: 446, action: "IMMEDIATELY REJECTED & IP BLACKLISTED", severity: "CRITICAL" },
    { id: "THR-102", timestamp: "Oggi, 17:15", threatType: "Port 446 SYN Flood Scan", sourceIp: "91.240.118.82", targetPort: 446, action: "RATE LIMIT ENFORCED (DROPPED)", severity: "HIGH" },
    { id: "THR-103", timestamp: "Oggi, 15:30", threatType: "Massive Unregistered Table Dump", sourceIp: "192.168.15.220", targetPort: 446, action: "SESSION TERMINATED BY PERIMETER GUARD", severity: "MEDIUM" }
  ],
  whitelistIps: [
    { ip: "192.168.10.0/24", label: "VLAN Server Farm Milano", addedBy: "admin_sec", status: "ENABLED" },
    { ip: "10.240.0.0/16", label: "IBM Power10 Private Interconnect", addedBy: "sys_eng", status: "ENABLED" },
    { ip: "172.16.50.12", label: "U-Query Central Web Server", addedBy: "ibmfile_deploy", status: "ENABLED" }
  ]
};

export const MOCK_SCHEDULE_JOBS = [
  {
    id: "JOB-101",
    name: "Estratto Conti Clienti Scaduti per Direzione Finanza",
    querySource: "SELECT * FROM PRODLIB/CUSTMAST WHERE OPEN_BALANCE > 50000",
    frequency: "Ogni Lunedì alle 07:00 (Cron: 0 7 * * 1)",
    nextRun: "Lunedì 26 Ottobre, 07:00",
    targetChannel: "Email (SMTP / Outlook)",
    recipient: "direzione.finanza@ferrari.it, cfo@enterprise.net",
    format: "Excel (.xlsx)",
    status: "ACTIVE",
    lastDuration: "1.8s",
    lastRunSuccess: true
  },
  {
    id: "JOB-102",
    name: "Giacenze Sotto Soglia Riordino Magazzino Centrale",
    querySource: "SELECT * FROM PRODLIB/INVENT01 WHERE QTY_ON_HAND <= REORDER_POINT",
    frequency: "Ogni Giorno alle 18:30 (Cron: 30 18 * * *)",
    nextRun: "Oggi, 18:30",
    targetChannel: "SFTP Sicuro (SSH)",
    recipient: "sftp://edi.logistics.hub/inbound/stock_alerts/",
    format: "CSV",
    status: "ACTIVE",
    lastDuration: "0.9s",
    lastRunSuccess: true
  },
  {
    id: "JOB-103",
    name: "Registro Accessi Dati Sensibili PII (Audit RGPD)",
    querySource: "SELECT * FROM AUDIT_TRAIL WHERE PII_ACCESSED = 'YES'",
    frequency: "1° Giorno del Mese alle 00:00 (Cron: 0 0 1 * *)",
    nextRun: "1 Novembre 2026, 00:00",
    targetChannel: "SharePoint / S3 Cloud",
    recipient: "https://enterprise.sharepoint.com/sites/LegalCompliance/GDPR/",
    format: "PDF Dossier",
    status: "ACTIVE",
    lastDuration: "4.2s",
    lastRunSuccess: true
  },
  {
    id: "JOB-104",
    name: "Consolidato Ricavi e Margini Mensili",
    querySource: "SELECT * FROM ENTERPRISE_DW.SALES_FACT ORDER BY NET_REVENUE DESC",
    frequency: "Settimanale (Venerdì alle 20:00)",
    nextRun: "Venerdì 23 Ottobre, 20:00",
    targetChannel: "Condivisione LAN (SMB)",
    recipient: "\\\\nas01.corp.internal\\FinancialReports\\2026_Q4\\",
    format: "Excel (.xlsx)",
    status: "ACTIVE",
    lastDuration: "2.5s",
    lastRunSuccess: true
  }
];

export const MOCK_ACTIVITY_LOG = [
  {
    id: "ACT-8491",
    timestamp: "2026-10-21 18:32:14",
    user: "m.bianchi (Analyst)",
    role: "Business Data Analyst",
    dbTarget: "IBM i (AS/400)",
    action: "Query Eseguita",
    statement: "SELECT CUST_ID, COMPANY_NAME, OPEN_BALANCE FROM PRODLIB/CUSTMAST WHERE OPEN_BALANCE > 50000",
    rows: 10,
    durationMs: 42,
    piiMasked: true,
    ipAddress: "192.168.10.45",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    id: "ACT-8490",
    timestamp: "2026-10-21 17:55:02",
    user: "e.rossi (Architect)",
    role: "System Administrator",
    dbTarget: "IBM i (AS/400)",
    action: "Report Esportato",
    statement: "EXPORT TO EXCEL: PRODLIB/INVENT01 (All Records)",
    rows: 6,
    durationMs: 88,
    piiMasked: false,
    ipAddress: "192.168.10.12",
    sha256Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
  },
  {
    id: "ACT-8489",
    timestamp: "2026-10-21 17:15:20",
    user: "X-Lock 446 Kernel",
    role: "Security Guard Agent",
    dbTarget: "IBM i DRDA Port 446",
    action: "Connessione Bloccata",
    statement: "BLOCKED: SYN Probe from Blacklisted IP 91.240.118.82",
    rows: 0,
    durationMs: 1,
    piiMasked: true,
    ipAddress: "91.240.118.82",
    sha256Hash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce"
  },
  {
    id: "ACT-8488",
    timestamp: "2026-10-21 16:40:11",
    user: "s.dubois (Compliance)",
    role: "Data Protection Officer",
    dbTarget: "Oracle 23c Enterprise",
    action: "Query Eseguita",
    statement: "SELECT EMP_ID, FULL_NAME, DEPARTMENT, HIRE_DATE FROM HR_CORP.EMPLOYEES",
    rows: 4,
    durationMs: 31,
    piiMasked: true,
    ipAddress: "192.168.12.89",
    sha256Hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  },
  {
    id: "ACT-8487",
    timestamp: "2026-10-21 15:10:00",
    user: "U-Schedule Daemon",
    role: "System Cron Service",
    dbTarget: "PostgreSQL 16 Cluster",
    action: "Report Esportato",
    statement: "DISPATCHED: Weekly Active Subscriptions CSV to SFTP",
    rows: 3,
    durationMs: 512,
    piiMasked: true,
    ipAddress: "127.0.0.1",
    sha256Hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
  }
];

export const MOCK_AI_PROMPTS = [
  {
    label: "Clienti con saldo aperto > 50.000€ (Top Morosi)",
    prompt: "Estrai dal database IBM i tutti i clienti attivi con saldo contabile superiore a 50.000€ ordinati per debito decrescente",
    db: "IBMi",
    table: "CUSTMAST",
    generatedSql: "SELECT CUST_ID, COMPANY_NAME, OPEN_BALANCE, CREDIT_LIMIT, CITY, COUNTRY\nFROM PRODLIB/CUSTMAST\nWHERE STATUS = 'A' AND OPEN_BALANCE > 50000.00\nORDER BY OPEN_BALANCE DESC\nFETCH FIRST 20 ROWS ONLY;",
    explanation: "La query filtra il file fisico CUSTMAST su IBM i per clienti attivi con scoperto maggiore di 50.000€, escludendo le colonne PII non necessarie in base alla policy di minima estrazione."
  },
  {
    label: "Articoli di magazzino in esaurimento (Sotto Scorta)",
    prompt: "Trova tutti gli articoli di ricambio con giacenza a magazzino inferiore o uguale alla soglia minima di riordino",
    db: "IBMi",
    table: "INVENT01",
    generatedSql: "SELECT SKU_CODE, ITEM_DESC, QTY_ON_HAND, REORDER_POINT, UNIT_COST, WAREHOUSE_LOC\nFROM PRODLIB/INVENT01\nWHERE QTY_ON_HAND <= REORDER_POINT\nORDER BY (REORDER_POINT - QTY_ON_HAND) DESC;",
    explanation: "Analizza le scorte correnti rispetto al punto di riordino (REORDER_POINT). Calcola il delta di carenza per agevolare il riordino logistico immediato."
  },
  {
    label: "Movimenti di Prima Nota oltre 50.000€ questa settimana",
    prompt: "Seleziona le registrazioni contabili di prima nota con importo superiore a 50.000€",
    db: "IBMi",
    table: "GLTRAN",
    generatedSql: "SELECT TRANS_ID, TRANS_DATE, ACCOUNT_NO, DEBIT_AMT, CREDIT_AMT, DESCR\nFROM FINLIB/GLTRAN\nWHERE DEBIT_AMT > 50000.00 OR CREDIT_AMT > 50000.00\nORDER BY TRANS_DATE DESC;",
    explanation: "Estrae le transazioni ad alto valore per l'audit contabile e il controllo antifrode nel partitario generale."
  }
];
