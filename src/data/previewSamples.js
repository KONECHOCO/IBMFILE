// Sample data for the modules still in preview (Port Guard, Scheduled reports).
// Shown with a "preview" banner; never presented as real data.
export const MOCK_XLOCK_DATA = {
  "ports": [
    {
      "port": 446,
      "service": "DRDA / DDM (IBM i Remote DB)",
      "status": "GUARDED",
      "policy": "TLS 1.3 Strict",
      "rateLimit": "150 req/sec"
    },
    {
      "port": 50000,
      "service": "Db2 Direct Instance",
      "status": "GUARDED",
      "policy": "Mutual Auth",
      "rateLimit": "300 req/sec"
    },
    {
      "port": 1521,
      "service": "Oracle Net Listener",
      "status": "MONITORED",
      "policy": "Perimeter Check",
      "rateLimit": "200 req/sec"
    },
    {
      "port": 5432,
      "service": "PostgreSQL Gateway",
      "status": "MONITORED",
      "policy": "SSL Require",
      "rateLimit": "400 req/sec"
    }
  ],
  "sockets": [
    {
      "id": "SOCK-1",
      "ip": "192.168.10.45",
      "port": 446,
      "protocol": "DRDA v5",
      "user": "QUSER_PROD",
      "state": "ESTABLISHED",
      "throughput": "148 KB/s",
      "latency": "1.2 ms",
      "origin": "Milano HQ"
    },
    {
      "id": "SOCK-2",
      "ip": "10.240.1.18",
      "port": 446,
      "protocol": "DRDA v5",
      "user": "QSECOFR_SVC",
      "state": "ESTABLISHED",
      "throughput": "220 KB/s",
      "latency": "1.5 ms",
      "origin": "LPAR Backup Service"
    },
    {
      "id": "SOCK-3",
      "ip": "192.168.12.89",
      "port": 1521,
      "protocol": "Oracle TNS",
      "user": "HR_APP_SRV",
      "state": "ESTABLISHED",
      "throughput": "65 KB/s",
      "latency": "3.1 ms",
      "origin": "Frankfurt DC"
    },
    {
      "id": "SOCK-4",
      "ip": "45.134.22.9",
      "port": 446,
      "protocol": "DRDA",
      "user": "UNKNOWN",
      "state": "BLOCKED",
      "throughput": "0 KB/s",
      "latency": "0 ms",
      "origin": "External Untrusted IP"
    }
  ],
  "threats": [
    {
      "id": "THR-101",
      "timestamp": "Oggi, 18:42",
      "threatType": "SQL Injection Probe (' OR 1=1 --)",
      "sourceIp": "185.220.101.4",
      "targetPort": 446,
      "action": "IMMEDIATELY REJECTED & IP BLACKLISTED",
      "severity": "CRITICAL"
    },
    {
      "id": "THR-102",
      "timestamp": "Oggi, 17:15",
      "threatType": "Port 446 SYN Flood Scan",
      "sourceIp": "91.240.118.82",
      "targetPort": 446,
      "action": "RATE LIMIT ENFORCED (DROPPED)",
      "severity": "HIGH"
    },
    {
      "id": "THR-103",
      "timestamp": "Oggi, 15:30",
      "threatType": "Massive Unregistered Table Dump",
      "sourceIp": "192.168.15.220",
      "targetPort": 446,
      "action": "SESSION TERMINATED BY PERIMETER GUARD",
      "severity": "MEDIUM"
    }
  ],
  "whitelistIps": [
    {
      "ip": "192.168.10.0/24",
      "label": "VLAN Server Farm Milano",
      "addedBy": "admin_sec",
      "status": "ENABLED"
    },
    {
      "ip": "10.240.0.0/16",
      "label": "Private interconnect",
      "addedBy": "sys_eng",
      "status": "ENABLED"
    },
    {
      "ip": "172.16.50.12",
      "label": "Plexa DB gateway",
      "addedBy": "deploy",
      "status": "ENABLED"
    }
  ]
};

export const MOCK_SCHEDULE_JOBS = [
  {
    "id": "JOB-101",
    "name": "Estratto Conti Clienti Scaduti per Direzione Finanza",
    "querySource": "SELECT * FROM PRODLIB/CUSTMAST WHERE OPEN_BALANCE > 50000",
    "frequency": "Ogni Lunedì alle 07:00 (Cron: 0 7 * * 1)",
    "nextRun": "Lunedì 26 Ottobre, 07:00",
    "targetChannel": "Email (SMTP / Outlook)",
    "recipient": "direzione.finanza@ferrari.it, cfo@enterprise.net",
    "format": "Excel (.xlsx)",
    "status": "ACTIVE",
    "lastDuration": "1.8s",
    "lastRunSuccess": true
  },
  {
    "id": "JOB-102",
    "name": "Giacenze Sotto Soglia Riordino Magazzino Centrale",
    "querySource": "SELECT * FROM PRODLIB/INVENT01 WHERE QTY_ON_HAND <= REORDER_POINT",
    "frequency": "Ogni Giorno alle 18:30 (Cron: 30 18 * * *)",
    "nextRun": "Oggi, 18:30",
    "targetChannel": "SFTP Sicuro (SSH)",
    "recipient": "sftp://edi.logistics.hub/inbound/stock_alerts/",
    "format": "CSV",
    "status": "ACTIVE",
    "lastDuration": "0.9s",
    "lastRunSuccess": true
  },
  {
    "id": "JOB-103",
    "name": "Registro Accessi Dati Sensibili PII (Audit RGPD)",
    "querySource": "SELECT * FROM AUDIT_TRAIL WHERE PII_ACCESSED = 'YES'",
    "frequency": "1° Giorno del Mese alle 00:00 (Cron: 0 0 1 * *)",
    "nextRun": "1 Novembre 2026, 00:00",
    "targetChannel": "SharePoint / S3 Cloud",
    "recipient": "https://enterprise.sharepoint.com/sites/LegalCompliance/GDPR/",
    "format": "PDF Dossier",
    "status": "ACTIVE",
    "lastDuration": "4.2s",
    "lastRunSuccess": true
  },
  {
    "id": "JOB-104",
    "name": "Consolidato Ricavi e Margini Mensili",
    "querySource": "SELECT * FROM ENTERPRISE_DW.SALES_FACT ORDER BY NET_REVENUE DESC",
    "frequency": "Settimanale (Venerdì alle 20:00)",
    "nextRun": "Venerdì 23 Ottobre, 20:00",
    "targetChannel": "Condivisione LAN (SMB)",
    "recipient": "\\\\nas01.corp.internal\\FinancialReports\\2026_Q4\\",
    "format": "Excel (.xlsx)",
    "status": "ACTIVE",
    "lastDuration": "2.5s",
    "lastRunSuccess": true
  }
];
