# IBMFILE Enterprise — Governed Data Platform & Query Studio
> **Official Website:** [ibmfile.com](https://ibmfile.com) &nbsp;|&nbsp; **Mobile App ID:** `com.ibmfile.enterprise`

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![IBM Carbon](https://img.shields.io/badge/Design-IBM%20Carbon%202.0-0f62fe?logo=ibm&logoColor=white)](https://carbondesignsystem.com/)
[![Capacitor](https://img.shields.io/badge/Mobile-iOS%20%26%20Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)]()

**IBMFILE Enterprise** è la piattaforma moderna, sicura e governata per l'estrazione, l'esplorazione e l'automazione dei dati aziendali da sistemi **IBM i (AS/400, iSeries, Db2 for i)** e database multi-cloud (Oracle, PostgreSQL, Snowflake, Microsoft SQL Server, MySQL). 

Progettata con un'estetica ispirata al **Design System IBM Carbon 2.0**, con supporto multilingua globale e predisposizione nativa per la distribuzione su **Web, PWA, iOS e Android**.

---

## 🚀 Caratteristiche Principali (Core Features)

### 1. 🗄️ U-Query Central (Governed Query & AI Studio)
- **Visual No-Code Wizard:** Costruisci query complesse selezionando file fisici/tabelle, campi, condizioni di filtro e ordinamento senza scrivere una sola riga di codice.
- **Editor SQL Pro:** Console SQL avanzata per utenti esperti, dotata di **Read-Only Enforcer** che blocca preventivamente comandi distruttivi (`DROP`, `DELETE`, `UPDATE`, `TRUNCATE`, `ALTER`).
- **Assistente AI IBM Granite:** Generazione automatica di query SQL ottimizzate da istruzioni in linguaggio naturale.
- **Mascheramento PII Dinamico (GDPR Art. 32):** Offuscamento automatico di dati sensibili (carte di credito, email, codici fiscali, IBAN) in base al ruolo dell'utente.
- **Esportazione a 1-Click:** Download immediato in formato **Excel (.xlsx)**, **CSV**, **JSON** e generazione di **Report PDF** con timbro di conformità e tracciamento.
- **Visualizzatore Grafico & Tabellare:** Passa all'istante dalla griglia dati ad alta leggibilità ai grafici analitici SVG.

### 2. 🔑 Vault Connessioni & Credenziali Multi-DB
- **Supporto Multi-Database:**
  - IBM i / AS400 (Db2 for i / DRDA)
  - PUB400 (Public IBM i Cloud Test Server)
  - Oracle Database 23c
  - PostgreSQL 16 Enterprise
  - Snowflake Data Warehouse
  - Microsoft SQL Server 2022
  - MySQL 8.0 Enterprise
- **Test di Connessione con Socket TCP Reale:** Bridge nativo backend per verificare la raggiungibilità fisica via TCP/IP (porte DRDA 446, 5250 Telnet, Db2 Server Access 8471) con misurazione di latenza millisecondo per millisecondo.
- **Parametri Avanzati:** Gestione Library List (`*LIBL`), sottosistemi (`QUSRWRK`, `QSYSWRK`), CCSID (280, 37, 1144, 1208 UTF-8), cifratura TLS 1.3 e modalità sola lettura a livello driver.

### 3. 🛡️ X-Lock 446 (Port Guard & Sicurezza DRDA)
- Monitoraggio in tempo reale della porta 446 DRDA e del traffico verso l'LPAR IBM i.
- Rilevamento automatico e blocco di tentativi di SQL Injection e attacchi DoS/SYN Flood.
- Gestione Whitelist IP aziendali per autorizzare l'accesso solo a subnet verificate.

### 4. ⏰ U-Schedule (Automazione Report & Dispatch)
- Pianificazione automatica di report ed estrazioni basata su espressioni Cron.
- Dispatch multi-canale:
  - Invio Email con allegati crittografati
  - Caricamento sicuro SFTP / FTPS verso server remoti
  - Archiviazione cloud su AWS S3 / Microsoft SharePoint
  - Condivisione su cartelle di rete aziendali (SMB / NAS)

### 5. 📚 U-Metadocs (Dizionario Dati & Data Lineage)
- Catalogo completo dei File Fisici (PF), File Logici (LF) e View SQL.
- Grafico interattivo di **Data Lineage** che mappa la provenienza del dato, dai file sorgente DB2 fino all'elaborazione ETL e alla destinazione finale.

### 6. 📜 Registro Attività & Audit Trail Immutabile
- Tracciamento dettagliato di ogni query eseguita, esportazione dati o modifica configurazione.
- Firma crittografica SHA-256 per garantire l'immutabilità dei log a prova di manomissione (GDPR Art. 30 e SOX 404).

### 7. 📱 Distribuzione Mobile & App Store (iOS & Android)
- Configurato con **Capacitor** per distribuzione nativa su **Apple App Store** e **Google Play Store**.
- Simulatore interattivo integrato di dispositivi (iPhone 16 Pro e Samsung Galaxy S24).
- PWA (Progressive Web App) installabile con manifest e icone responsive.

### 8. 🌐 Supporto Multi-Lingua Globale (i18n)
- Interfaccia completamente localizzata in 6 lingue con switch istantaneo:
  - 🇮🇹 Italiano
  - 🇬🇧 English
  - 🇪🇸 Español
  - 🇫🇷 Français
  - 🇩🇪 Deutsch
  - 🇯🇵 日本語

---

## 💻 Requisiti e Installazione

### Prerequisiti
- **Node.js**: versione 18.x o superiore
- **npm** o **pnpm** / **yarn**

### 1. Clona il repository
```bash
git clone https://github.com/KONECHOCO/IBMFILE.git
cd IBMFILE
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Avvia il server di sviluppo locale
```bash
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:5173/`.

### 4. Compilazione per la Produzione Web
```bash
npm run build
```
I file ottimizzati verranno generati nella cartella `dist/`.

---

## 📱 Compilazione Mobile (iOS & Android)

Il progetto è predisposto per Capacitor con l'identificatore `com.ibmfile.enterprise`.

### Aggiungi le piattaforme native:
```bash
# Per Android
npx cap add android
npx cap open android

# Per iOS (su macOS)
npx cap add ios
npx cap open ios
```

### Sincronizza le modifiche web con le app native:
```bash
npm run build
npx cap sync
```

---

## 🔒 Sicurezza e Governance
- **Conformità Normativa:** GDPR (Art. 25, 30, 32), SOX 404, HIPAA.
- **Protezione Dati:** Nessuna credenziale master memorizzata in chiaro nel client; supporto per storage crittografato e vault aziendali.
- **Guardrail Operativi:** Enforcing a livello UI e a livello engine della sola lettura certificata.

---

## 🏢 Brand & Copyright
**IBMFILE Enterprise** — *I vostri dati. Sotto controllo. Sempre.*  
Domain: [ibmfile.com](https://ibmfile.com)  
Copyright © 2026 IBMFILE Technologies / Ikonet Solutions. All rights reserved.
