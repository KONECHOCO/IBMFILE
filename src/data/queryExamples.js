// Ready-made read-only queries per database type. Labels live in i18n (ui.examples.<id>).
const EXAMPLES = {
  sqlite: [
    { id: "topCustomers", sql: "SELECT CUST_ID, COMPANY_NAME, CITY, COUNTRY, OPEN_BALANCE, CREDIT_LIMIT\nFROM CUSTOMERS\nORDER BY OPEN_BALANCE DESC" },
    { id: "salesByCountry", sql: "SELECT * FROM V_SALES_BY_COUNTRY ORDER BY REVENUE DESC" },
    { id: "monthlyRevenue", sql: "SELECT substr(ORDER_DATE, 1, 7) AS MONTH, COUNT(*) AS ORDERS, ROUND(SUM(TOTAL_AMOUNT), 2) AS REVENUE\nFROM ORDERS\nWHERE STATUS <> 'CANCELLED'\nGROUP BY MONTH\nORDER BY MONTH" },
    { id: "bestProducts", sql: "SELECT p.DESCRIPTION, p.CATEGORY, SUM(l.QUANTITY) AS QTY, ROUND(SUM(l.LINE_AMOUNT), 2) AS REVENUE\nFROM ORDER_LINES l JOIN PRODUCTS p ON p.PRODUCT_ID = l.PRODUCT_ID\nGROUP BY p.PRODUCT_ID\nORDER BY REVENUE DESC" },
    { id: "staffByDept", sql: "SELECT DEPARTMENT, COUNT(*) AS EMPLOYEES, ROUND(AVG(SALARY), 0) AS AVG_SALARY\nFROM EMPLOYEES\nGROUP BY DEPARTMENT\nORDER BY EMPLOYEES DESC" },
  ],
  ibmi: [
    { id: "ibmiSystemInfo", sql: "SELECT * FROM SYSIBMADM.ENV_SYS_INFO" },
    { id: "ibmiLibraries", sql: "SELECT SCHEMA_NAME, SCHEMA_TEXT, SCHEMA_OWNER\nFROM QSYS2.SYSSCHEMAS\nORDER BY SCHEMA_NAME" },
    { id: "ibmiLargestTables", sql: "SELECT TABLE_SCHEMA, TABLE_NAME, NUMBER_ROWS, DATA_SIZE\nFROM QSYS2.SYSTABLESTAT\nORDER BY DATA_SIZE DESC\nFETCH FIRST 50 ROWS ONLY" },
    { id: "ibmiActiveJobs", sql: "SELECT JOB_NAME, SUBSYSTEM, AUTHORIZATION_NAME, JOB_STATUS, CPU_TIME, ELAPSED_CPU_PERCENTAGE\nFROM TABLE(QSYS2.ACTIVE_JOB_INFO())\nORDER BY ELAPSED_CPU_PERCENTAGE DESC" },
    { id: "ibmiSpool", sql: "SELECT SPOOLED_FILE_NAME, USER_NAME, OUTPUT_QUEUE_NAME, CREATE_TIMESTAMP, STATUS, TOTAL_PAGES\nFROM QSYS2.OUTPUT_QUEUE_ENTRIES_BASIC\nWHERE USER_NAME = CURRENT_USER\nORDER BY CREATE_TIMESTAMP DESC" },
    { id: "ibmiMessages", sql: "SELECT MESSAGE_TIMESTAMP, MESSAGE_ID, SEVERITY, MESSAGE_TEXT\nFROM TABLE(QSYS2.HISTORY_LOG_INFO(CURRENT TIMESTAMP - 1 DAY))\nORDER BY MESSAGE_TIMESTAMP DESC\nFETCH FIRST 200 ROWS ONLY" },
  ],
  postgres: [
    { id: "pgTableSizes", sql: "SELECT schemaname, relname AS table_name, n_live_tup AS rows_estimate,\n       pg_size_pretty(pg_total_relation_size(relid)) AS total_size\nFROM pg_stat_user_tables\nORDER BY pg_total_relation_size(relid) DESC" },
    { id: "pgActivity", sql: "SELECT pid, usename, datname, state, now() - query_start AS running_for, left(query, 120) AS query\nFROM pg_stat_activity\nWHERE state IS NOT NULL\nORDER BY query_start" },
    { id: "pgVersion", sql: "SELECT version()" },
  ],
  mysql: [
    { id: "mysqlTableSizes", sql: "SELECT table_schema, table_name, table_rows, ROUND((data_length + index_length) / 1024 / 1024, 1) AS size_mb\nFROM information_schema.tables\nWHERE table_schema NOT IN ('mysql','sys','performance_schema','information_schema')\nORDER BY size_mb DESC" },
    { id: "mysqlProcesses", sql: "SELECT id, user, host, db, command, time, state FROM information_schema.processlist ORDER BY time DESC" },
    { id: "mysqlVersion", sql: "SELECT VERSION() AS version" },
  ],
  mssql: [
    { id: "mssqlTableSizes", sql: "SELECT s.name AS schema_name, t.name AS table_name, SUM(p.rows) AS row_count\nFROM sys.tables t\nJOIN sys.schemas s ON s.schema_id = t.schema_id\nJOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)\nGROUP BY s.name, t.name\nORDER BY row_count DESC" },
    { id: "mssqlSessions", sql: "SELECT session_id, login_name, host_name, program_name, status, last_request_start_time\nFROM sys.dm_exec_sessions\nWHERE is_user_process = 1" },
    { id: "mssqlVersion", sql: "SELECT @@VERSION AS version" },
  ],
  oracle: [
    { id: "oracleTables", sql: "SELECT owner, table_name, num_rows, last_analyzed\nFROM all_tables\nWHERE owner = USER\nORDER BY num_rows DESC NULLS LAST" },
    { id: "oracleSessions", sql: "SELECT sid, serial#, username, status, machine, program FROM v$session WHERE username IS NOT NULL" },
    { id: "oracleVersion", sql: "SELECT banner FROM v$version" },
  ],
  snowflake: [
    { id: "sfTables", sql: "SELECT table_schema, table_name, row_count, bytes\nFROM information_schema.tables\nWHERE table_type = 'BASE TABLE'\nORDER BY bytes DESC" },
    { id: "sfWarehouse", sql: "SELECT CURRENT_WAREHOUSE(), CURRENT_ROLE(), CURRENT_DATABASE(), CURRENT_VERSION()" },
  ],
};

export function queryExamples(driver) {
  return EXAMPLES[driver] || [];
}
