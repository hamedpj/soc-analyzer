# 🛡️ SOC Analyzer - Extended Detection & Response (XDR)

🌐 **[Ver Demo en Vivo en Vercel](https://soc-analyzer-t88g.vercel.app/)**

![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-purple?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-FF6B6B?style=for-the-badge&logo=ai&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-red?style=for-the-badge)

**SOC Analyzer** es una aplicación web interactiva diseñada para analistas de ciberseguridad (Blue Team). Permite ingestar logs de seguridad (CSV, JSON, TXT), visualizar métricas de amenazas en tiempo real, correlacionar eventos y generar informes ejecutivos/técnicos automatizados utilizando Inteligencia Artificial (Groq - Llama 3).

## ✨ Características Principales

- **📥 Ingesta de Datos Segura:** Sube archivos de logs locales (`.csv`, `.json`, `.txt`) que se procesan 100% en el navegador. Los datos no se envían a ningún servidor externo.
- **📊 Dashboard Interactivo:** Visualización de Nivel de Riesgo Global, conteo de eventos críticos, hosts afectados y categorización de amenazas.
- **🎯 Mapeo MITRE ATT&CK:** Identificación automática de técnicas adversarias (T1110, T1068, T1490, etc.) con tácticas asociadas.
- **⏱️ Timeline Forense:** Reconstrucción cronológica de los eventos para entender la línea de tiempo del atacante.
- **🤖 Análisis con IA (Groq):** Integración con el modelo `llama-3.3-70b-versatile` para generar un análisis forense profundo, sin resumir y basado estrictamente en los logs.
- **📄 Generación de Informes PDF:** Exportación de un reporte corporativo en PDF con tablas de Indicadores de Compromiso (IoCs), análisis técnico y planes de mitigación (SLA) con diseño profesional.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS v4
- **Iconografía:** Lucide React
- **Generación de PDF:** jsPDF (Construcción nativa sin dependencias externas de tablas para máxima estabilidad)
- **Inteligencia Artificial:** Groq API (Llama 3 70B)

## 🚀 Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu máquina:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/hamedpj/soc-analyzer.git
   cd soc-analyzer
