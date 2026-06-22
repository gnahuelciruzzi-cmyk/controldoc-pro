import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, FileStack, ShieldCheck, QrCode, Bell,
  Search, Plus, ChevronDown, Upload, Check, X, Clock, AlertTriangle,
  FileText, LogOut, Building2, Filter, ArrowLeft, KeyRound, Lock,
  UserCog, HardHat, Eye, EyeOff, Copy, CreditCard, TrendingUp, Truck, Wrench, Download, Sparkles, FileImage, FileSpreadsheet, Phone, Briefcase
} from "lucide-react";

/* ---------------------------------------------------------
   ControlDoc Pro — token system
   Color: bg #F7F8F6 / ink #14181C / steel #2C5F7C / amber #E8A33D
          green #3F8F5F / red #C9483B / line #E2E5E1
   Type:  display = Space Grotesk, body = Inter, mono = JetBrains Mono
   Signature: rotated "inspection stamp" badges for document status
--------------------------------------------------------- */

const FONT_LINK_ID = "controldoc-fonts";
if (typeof document !== "undefined" && !document.getElementById(FONT_LINK_ID)) {
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap";
  document.head.appendChild(link);
}

const GLOBAL_STYLE_ID = "controldoc-global-style";
if (typeof document !== "undefined" && !document.getElementById(GLOBAL_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    .rounded-xl.border.bg-white {
      box-shadow: 0 1px 2px rgba(20,24,28,0.03), 0 4px 12px -4px rgba(20,24,28,0.06);
    }
    button {
      transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .1s ease, opacity .15s ease;
    }
    button:active { transform: scale(0.98); }
    button:focus-visible, input:focus-visible {
      outline: 2px solid #2C5F7C;
      outline-offset: 2px;
    }
    a[role="button"], .clickable-row {
      transition: box-shadow .15s ease, border-color .15s ease;
    }
    ::-webkit-scrollbar { width: 9px; height: 9px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D7DBD4; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #C2C7BD; }
    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

const ROLES = [
  { id: "super_admin", label: "Super Administrador", desc: "Administra empresas clientes y la plataforma" },
  { id: "empresa", label: "Empresa / Auditor HSE", desc: "Gestiona contratistas y aprueba documentación" },
  { id: "contratista", label: "Contratista", desc: "Carga su documentación y la de sus trabajadores" },
  { id: "guardia", label: "Guardia / Control de acceso", desc: "Consulta habilitación por CUIT o QR" },
];

const NAV_BY_ROLE = {
  super_admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "empresas", label: "Empresas clientes", icon: Building2 },
    { id: "planes", label: "Planes y facturación", icon: CreditCard },
  ],
  empresa: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "contratistas", label: "Contratistas", icon: Users },
    { id: "trabajadores", label: "Trabajadores", icon: HardHat },
    { id: "aprobaciones", label: "Aprobaciones", icon: ShieldCheck },
    { id: "reportes", label: "Reportes", icon: FileStack },
  ],
  contratista: [
    { id: "ats", label: "ATS", icon: AlertTriangle },
    { id: "documentos", label: "Mis documentos", icon: FileStack },
    { id: "trabajadores", label: "Trabajadores", icon: Users },
    { id: "vehiculos", label: "Vehículos", icon: Truck },
  ],
  guardia: [
    { id: "accesos", label: "Control de acceso", icon: QrCode },
  ],
};

const EMPRESAS_CLIENTE = [
  { id: "EMP-7K2X9", razonSocial: "Minera del Sur S.A.", cuit: "30-71234567-8", rubro: "Minería", contratistas: 12, estado: "activa", plan: "Profesional" },
  { id: "EMP-3R8L1", razonSocial: "Frigorífico San Jorge SRL", cuit: "30-69874512-3", rubro: "Alimenticia", contratistas: 5, estado: "activa", plan: "Básico" },
  { id: "EMP-9T4P6", razonSocial: "Petrocamp Argentina S.A.", cuit: "30-70123456-1", rubro: "Petrolera", contratistas: 19, estado: "activa", plan: "Enterprise" },
  { id: "EMP-2D5N0", razonSocial: "Transportes Cuyo SRL", cuit: "30-68512349-7", rubro: "Logística", contratistas: 3, estado: "suspendida", plan: "Básico" },
];

const PLANES = [
  { id: "basico", nombre: "Básico", min: 1, max: 15, mensual: 49 },
  { id: "profesional", nombre: "Profesional", min: 16, max: 30, mensual: 89 },
  { id: "avanzado", nombre: "Avanzado", min: 31, max: 50, mensual: 149 },
  { id: "enterprise", nombre: "Enterprise", min: 51, max: Infinity, mensual: 249 },
];

function planPorContratistas(n) {
  return PLANES.find((p) => n >= p.min && n <= p.max) || PLANES[PLANES.length - 1];
}

function precioPorCiclo(mensual, ciclo) {
  if (ciclo === "mensual") return { total: mensual, label: "/ mes" };
  if (ciclo === "semestral") return { total: Math.round(mensual * 6), label: "/ 6 meses" };
  return { total: Math.round(mensual * 12), label: "/ año" };
}

const STATUS_EMPRESA = {
  activa: { label: "Activa", color: "#3F8F5F", bg: "#EAF4ED" },
  suspendida: { label: "Suspendida", color: "#C9483B", bg: "#FBEAE8" },
};

const CONTRACTORS = [
  {
    id: "C-014", empresa: "Andesmin Servicios SRL", rubro: "Minería", trabajadores: 18, estado: "vigente", vencen: 2,
    emergencia: { art: "Galeno ART", telArt: "0800-333-0303", seguro: "La Caja Seguros", telSeguro: "0800-444-2522", contacto: "J. Medina (Resp. HSE) — 341-455-1212" },
  },
  {
    id: "C-022", empresa: "Logitrans Patagonia", rubro: "Logística", trabajadores: 9, estado: "por_vencer", vencen: 5,
    emergencia: { art: "Prevención ART", telArt: "0800-122-3340", seguro: "Sancor Seguros", telSeguro: "0800-666-7400", contacto: "M. Paz (Resp. HSE) — 341-455-3434" },
  },
  {
    id: "C-031", empresa: "Petrocamp Ingeniería", rubro: "Petrolera", trabajadores: 27, estado: "vencido", vencen: 0,
    emergencia: { art: "Experta ART", telArt: "0800-122-3380", seguro: "Zurich Argentina", telSeguro: "0800-345-2000", contacto: "R. Ibáñez (Resp. HSE) — 341-455-5656" },
  },
  {
    id: "C-040", empresa: "Friolar Alimentos", rubro: "Alimenticia", trabajadores: 6, estado: "vigente", vencen: 1,
    emergencia: { art: "Asociart ART", telArt: "0800-333-2727", seguro: "Mapfre Argentina", telSeguro: "0800-666-1414", contacto: "S. Coria (Resp. HSE) — 341-455-7878" },
  },
  {
    id: "C-053", empresa: "ServiIndustrial Norte", rubro: "Industrial", trabajadores: 14, estado: "por_vencer", vencen: 3,
    emergencia: { art: "Galeno ART", telArt: "0800-333-0303", seguro: "La Segunda Seguros", telSeguro: "0800-222-5050", contacto: "D. López (Resp. HSE) — 341-455-9090" },
  },
  {
    id: "C-061", empresa: "MineralSur Contratos", rubro: "Minería", trabajadores: 31, estado: "vencido", vencen: 0,
    emergencia: { art: "Experta ART", telArt: "0800-122-3380", seguro: "Federación Patronal", telSeguro: "0800-333-8000", contacto: "N. Vega (Resp. HSE) — 341-455-2323" },
  },
];

const DOCS_CONTRATISTA = [
  { id: "D-1", nombre: "ART vigente", estado: "vigente", vence: "18 Ago 2026" },
  { id: "D-2", nombre: "Seguro de responsabilidad civil", estado: "por_vencer", vence: "27 Jun 2026" },
  { id: "D-3", nombre: "Constancia CUIT", estado: "vigente", vence: "—" },
  { id: "D-4", nombre: "Curso de seguridad HSE", estado: "vencido", vence: "02 Jun 2026" },
  { id: "D-5", nombre: "Apto médico", estado: "vigente", vence: "11 Sep 2026" },
];

const APPROVALS_GROUPED = [
  {
    contratista: "Petrocamp Ingeniería",
    items: [
      {
        id: "A-1",
        doc: "Seguro de caución",
        sujeto: "Empresa",
        subido: "hace 2 h",
        archivo: "seguro_caucion_petrocamp.pdf",
        formato: "pdf",
        ia: {
          legible: true,
          tipoDetectado: "Póliza de seguro de caución",
          fechaVencimientoDetectada: new Date(2026, 11, 14),
          observacion: "Coincide con el tipo de documento solicitado y el nombre de la empresa.",
        },
      },
      {
        id: "A-2",
        doc: "ART (nominado)",
        sujeto: "R. Funes",
        subido: "hace 2 h",
        archivo: "art_roberto_funes.jpg",
        formato: "imagen",
        ia: {
          legible: false,
          tipoDetectado: "Posible constancia de ART",
          fechaVencimientoDetectada: null,
          observacion: "La foto está borrosa en la zona de la fecha de vencimiento. Pedí que la vuelvan a subir o revisalo manualmente.",
        },
      },
    ],
  },
  {
    contratista: "Andesmin Servicios SRL",
    items: [
      {
        id: "A-3",
        doc: "Apto médico",
        sujeto: "L. Acosta",
        subido: "hace 5 h",
        archivo: "apto_medico_lacosta.pdf",
        formato: "pdf",
        ia: {
          legible: true,
          tipoDetectado: "Apto médico",
          fechaVencimientoDetectada: new Date(2026, 5, 10),
          observacion: "Documento legible, tipo y persona coinciden con lo declarado.",
        },
      },
    ],
  },
  {
    contratista: "ServiIndustrial Norte",
    items: [
      {
        id: "A-4",
        doc: "Curso HSE específico",
        sujeto: "M. Bravo",
        subido: "ayer",
        archivo: "curso_hse_mbravo.pdf",
        formato: "pdf",
        ia: {
          legible: true,
          tipoDetectado: "Constancia de capacitación específica",
          fechaEmisionDetectada: new Date(2026, 2, 20), // capacitación: la IA calcula vencimiento a 6 meses
          observacion: "Coincide con el documento solicitado y la persona declarada.",
        },
      },
      {
        id: "A-5",
        doc: "VTV / RTO",
        sujeto: "Vehículo — AB123CD",
        subido: "ayer",
        archivo: "vtv_ab123cd.xlsx",
        formato: "excel",
        ia: {
          legible: true,
          tipoDetectado: "Planilla con datos del vehículo",
          fechaVencimientoDetectada: new Date(2026, 6, 25),
          forzarConfianza: "revisar", // la fecha está OK, pero hay una inconsistencia de datos (patente)
          observacion: "La patente del archivo difiere en un carácter de la declarada (AB128CD). Confirmá que sea el mismo vehículo.",
        },
      },
    ],
  },
];

// la IA cruza la fecha que leyó en el archivo contra el mismo motor de vencimientos del resto del sistema
function analisisIA(it) {
  if (!it.ia.legible) {
    return { confianza: "revisar", estadoFecha: null, fechaLabel: "fecha no legible" };
  }
  const doc = it.ia.fechaEmisionDetectada
    ? { tipo: "antiguedad6m", fechaEmision: it.ia.fechaEmisionDetectada }
    : { tipo: "vencimiento", fechaVencimiento: it.ia.fechaVencimientoDetectada };

  const estadoFecha = getEstadoDocumento(doc);
  const venc = getVencimiento(doc);
  const fechaLabel = venc
    ? it.ia.fechaEmisionDetectada
      ? `emitido ${fmtFecha(it.ia.fechaEmisionDetectada)} · vence ${fmtFecha(venc)}`
      : `vence ${fmtFecha(venc)}`
    : "sin fecha detectada";

  let confianza = "ok";
  if (estadoFecha === "vencido") confianza = "alerta";
  else if (estadoFecha === "por_vencer" || estadoFecha === "faltante") confianza = "revisar";

  // si hay una inconsistencia de datos (ej: patente no coincide), nunca bajamos a "ok"
  const SEVERIDAD = { ok: 0, revisar: 1, alerta: 2 };
  if (it.ia.forzarConfianza && SEVERIDAD[it.ia.forzarConfianza] > SEVERIDAD[confianza]) {
    confianza = it.ia.forzarConfianza;
  }

  return { confianza, estadoFecha, fechaLabel };
}

const STATUS_META = {
  vigente: { label: "Vigente", color: "#3F8F5F", bg: "#EAF4ED" },
  por_vencer: { label: "Por vencer", color: "#B9791F", bg: "#FBF2E2" },
  vencido: { label: "Vencido", color: "#C9483B", bg: "#FBEAE8" },
  faltante: { label: "Falta cargar", color: "#6B7268", bg: "#EDEEEB" },
};

/* ---------- Catálogo documental (matriz ATS -> documentación) ---------- */

const RIESGOS_ATS = [
  { id: 1, label: "Trabajo en altura (hasta 4mts)" },
  { id: 2, label: "Trabajo en altura (+6mts)" },
  { id: 3, label: "Contacto eléctrico directo" },
  { id: 4, label: "Manejo de energías peligrosas / intervención de tableros" },
  { id: 5, label: "Excavaciones (Resol. 550/503) / Demoliciones" },
  { id: 6, label: "Manejo de vehículos industriales (autoelevadores, maq. vial, plataformas)" },
  { id: 7, label: "Armado de andamio / silletas" },
  { id: 8, label: "Instalaciones" },
  { id: 9, label: "Pintura" },
  { id: 10, label: "Otros" },
];

/* ---------- Motor de vencimientos: toda fecha se evalúa contra la próxima fecha de trabajo ---------- */

const HOY = new Date(2026, 5, 20); // 20 Jun 2026 (sábado)
const DIAS_ALERTA = 10;
const MESES_VALIDEZ_CAPACITACION = 6;

// se evalúa contra el próximo lunes (próxima fecha probable de ingreso a planta),
// no contra "hoy": un doc que vence mañana y la persona entra el lunes, ya está vencido.
function proximoLunes(desde) {
  const d = new Date(desde);
  const dia = d.getDay(); // 0=dom ... 6=sab
  const delta = (8 - dia) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}
const FECHA_REFERENCIA = proximoLunes(HOY);

function diffDias(fecha) {
  return Math.round((fecha - FECHA_REFERENCIA) / 86400000);
}

function sumarMeses(fecha, meses) {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + meses);
  return d;
}

function fmtFecha(d) {
  if (!d) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// calcula vencimiento + estado de un documento según su tipo
function getVencimiento(d) {
  if (d.tipo === "sin_vencimiento") return null;
  if (d.tipo === "antiguedad6m") {
    if (!d.fechaEmision) return undefined;
    return sumarMeses(d.fechaEmision, MESES_VALIDEZ_CAPACITACION);
  }
  return d.fechaVencimiento || undefined;
}

function getEstadoDocumento(d) {
  if (d.tipo === "sin_vencimiento") return d.cargado ? "vigente" : "faltante";
  const venc = getVencimiento(d);
  if (venc === undefined) return "faltante";
  const dias = diffDias(venc);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_ALERTA) return "por_vencer";
  return "vigente";
}

// fecha demo determinística para poblar catálogos de ejemplo (no son datos reales)
function fechaDemo(i) {
  const patron = i % 6;
  if (patron === 5) return null; // sin cargar todavía
  if (patron === 4) return new Date(FECHA_REFERENCIA.getTime() - 4 * 86400000); // vencido
  if (patron === 3) return new Date(FECHA_REFERENCIA.getTime() + 7 * 86400000); // por vencer
  return new Date(FECHA_REFERENCIA.getTime() + (45 + i * 12) * 86400000); // vigente
}

function buildDocList(nombres) {
  return nombres.map((nombre, i) => ({ nombre, tipo: "vencimiento", fechaVencimiento: fechaDemo(i) }));
}

const DOCS_BASE_EMPRESA = buildDocList([
  "Nómina de personal (nombre, apellido, foto DNI)",
  "Formulario 931 con comprobante de pago",
  "Seguro de accidentes personales con cláusula de no repetición",
  "APT (Análisis Preliminar de Tareas)",
  "Aviso de inicio de obra (ART) con tareas declaradas",
  "Programa de seguridad aprobado por ART o ATS/PTS",
  "Nómina de ART con cláusula de no repetición",
  "Seguro de vida obligatorio con nómina asegurada",
  "Altas tempranas de personal nuevo",
  "Registro de entrega de EPP (Res. SRT 299/11)",
  "Constancia de capacitación (general)",
  "Constancia de capacitación específica de la tarea",
  "Matrícula del asesor de Higiene y Seguridad",
  "Nota de ART de no inclusión en PESE (Res. SRT 363/16)",
]);

const DOCS_BASE_MONOTRIBUTISTA = buildDocList([
  "APT (Análisis Preliminar de Tareas)",
  "Póliza de accidentes personales (SAP)",
  "Pago del mes y libre deuda del SAP",
  "Cláusula de no repetición",
  "Constancia de inscripción en ARCA",
  "Pago de monotributo del mes en curso",
  "DNI del personal",
  "Programa de trabajo seguro (tareas, riesgos, medidas preventivas)",
  "Plan de emergencias y teléfonos de contacto",
  "Constancia de capacitación (general)",
  "Constancia de capacitación específica de la tarea",
  "Matrícula de responsable de Higiene y Seguridad",
  "Planillas de EPP (Res. SRT 299/11)",
]);

// documentos extra que dispara cada riesgo tildado en el ATS
const DOCS_POR_RIESGO = {
  1: buildDocList([
    "Capacitación específica Resol. 61/23 (trabajo en altura)",
    "Apto médico / aptitud física del personal afectado",
  ]),
  2: buildDocList([
    "Capacitación específica Resol. 61/23 (trabajo en altura)",
    "Apto médico / aptitud física del personal afectado",
    "Técnico permanente en obra durante las tareas en altura",
  ]),
  3: buildDocList(["Habilitación / capacitación en riesgo eléctrico"]),
  4: buildDocList(["Procedimiento de bloqueo y etiquetado (LOTO) de tableros"]),
  5: buildDocList(["Documentación según Resol. 550 / 503 (excavaciones y demoliciones)"]),
  6: buildDocList([
    "Apto médico / aptitud física del personal afectado",
    "Documentación de Vehículos industriales (ver sección Vehículos)",
  ]),
  7: buildDocList(["Capacitación específica Resol. 61/23 (armado de andamios/silletas)"]),
  8: [],
  9: [],
  10: [],
};

const DOCS_VEHICULO = buildDocList([
  "Póliza de seguro vigente",
  "Constancia de pago del seguro (mes en curso)",
  "Carnet de conducir vigente y acorde a la categoría",
  "Tarjeta verde del vehículo",
  "VTV / RTO vigente",
  "Certificado de aptitud física del chofer",
]);

const DOCS_VEHICULO_INDUSTRIAL = buildDocList([
  "Póliza y pago del seguro de responsabilidad civil",
  "Póliza y pago del seguro técnico de máquina",
  "Cédula verde del vehículo",
  "Carnet habilitante del chofer + DNI",
  "Memoria técnica / ensayo técnico",
  "Registro de capacitación de manejo de maquinaria (tijera, JLG, etc.)",
  "Certificado de aptitud física del chofer",
]);

// si un doc "extra" ya está cubierto por algo de la base, no se vuelve a pedir
function yaCubiertoPorBase(nombreExtra, base) {
  const norm = (s) => s.toLowerCase();
  const extraNorm = norm(nombreExtra);
  return base.some((b) => {
    const bNorm = norm(b.nombre);
    if (extraNorm.includes("apto") && bNorm.includes("apto")) return true;
    if (extraNorm.includes("capacitación específica") && bNorm.includes("capacitación específica")) return true;
    return false;
  });
}

/* ---------- Trabajadores: checklist individual por persona, con fechas reales ---------- */

const DOCS_INDIVIDUALES_BASE = [
  "DNI con foto",
  "Apto médico",
  "Seguro de vida obligatorio (nominado)",
  "ART (nominado)",
  "Constancia de capacitación general",
  "Constancia de capacitación específica de la tarea",
  "Entrega de EPP (Res. SRT 299/11)",
];

const TRABAJADORES = [
  {
    id: "T-01",
    nombre: "Roberto Funes",
    dni: "30.412.876",
    contratista: "Andesmin Servicios SRL",
    documentos: [
      { nombre: "DNI con foto", tipo: "sin_vencimiento", cargado: true },
      { nombre: "Apto médico", tipo: "vencimiento", fechaVencimiento: new Date(2026, 8, 11) },
      { nombre: "Seguro de vida obligatorio (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 11, 1) },
      { nombre: "ART (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 7, 15) },
      { nombre: "Constancia de capacitación general", tipo: "antiguedad6m", fechaEmision: new Date(2026, 2, 1) },
      { nombre: "Constancia de capacitación específica de la tarea", tipo: "antiguedad6m", fechaEmision: new Date(2026, 1, 15) },
      { nombre: "Entrega de EPP (Res. SRT 299/11)", tipo: "antiguedad6m", fechaEmision: new Date(2026, 0, 10) },
    ],
  },
  {
    id: "T-02",
    nombre: "Pedro \"Pedrito\" Acosta",
    dni: "33.987.214",
    contratista: "Andesmin Servicios SRL",
    documentos: [
      { nombre: "DNI con foto", tipo: "sin_vencimiento", cargado: true },
      { nombre: "Apto médico", tipo: "vencimiento", fechaVencimiento: null },
      { nombre: "Seguro de vida obligatorio (nominado)", tipo: "vencimiento", fechaVencimiento: null },
      // ejemplo del caso planteado: vence "mañana" (21 jun) pero la próxima fecha de trabajo es el lunes 22 -> vencido
      { nombre: "ART (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 5, 21) },
      { nombre: "Constancia de capacitación general", tipo: "antiguedad6m", fechaEmision: new Date(2025, 10, 1) },
      { nombre: "Constancia de capacitación específica de la tarea", tipo: "antiguedad6m", fechaEmision: new Date(2026, 3, 1) },
      { nombre: "Entrega de EPP (Res. SRT 299/11)", tipo: "antiguedad6m", fechaEmision: new Date(2026, 3, 5) },
    ],
  },
  {
    id: "T-03",
    nombre: "Marcos Bravo",
    dni: "29.105.643",
    contratista: "ServiIndustrial Norte",
    documentos: [
      { nombre: "DNI con foto", tipo: "sin_vencimiento", cargado: true },
      { nombre: "Apto médico", tipo: "vencimiento", fechaVencimiento: new Date(2026, 9, 2) },
      { nombre: "Seguro de vida obligatorio (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 10, 5) },
      { nombre: "ART (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 5, 15) },
      { nombre: "Constancia de capacitación general", tipo: "antiguedad6m", fechaEmision: new Date(2026, 2, 20) },
      { nombre: "Constancia de capacitación específica de la tarea", tipo: "antiguedad6m", fechaEmision: new Date(2026, 2, 20) },
      { nombre: "Entrega de EPP (Res. SRT 299/11)", tipo: "antiguedad6m", fechaEmision: new Date(2026, 2, 20) },
    ],
  },
  {
    id: "T-04",
    nombre: "Lucía Acosta",
    dni: "31.220.998",
    contratista: "Petrocamp Ingeniería",
    documentos: [
      { nombre: "DNI con foto", tipo: "sin_vencimiento", cargado: true },
      // próximo a vencer: vence el 28 jun, a 6 días de la fecha de referencia (22 jun)
      { nombre: "Apto médico", tipo: "vencimiento", fechaVencimiento: new Date(2026, 5, 28) },
      { nombre: "Seguro de vida obligatorio (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 9, 1) },
      { nombre: "ART (nominado)", tipo: "vencimiento", fechaVencimiento: new Date(2026, 8, 1) },
      { nombre: "Constancia de capacitación general", tipo: "antiguedad6m", fechaEmision: new Date(2026, 1, 1) },
      { nombre: "Constancia de capacitación específica de la tarea", tipo: "antiguedad6m", fechaEmision: new Date(2026, 1, 1) },
      { nombre: "Entrega de EPP (Res. SRT 299/11)", tipo: "antiguedad6m", fechaEmision: new Date(2026, 1, 1) },
    ],
  },
];

// contratista "logueado" de ejemplo en este demo (en real vendría de la sesión)
const CONTRATISTA_LOGUEADO = "Andesmin Servicios SRL";

function trabajadorHabilitado(t) {
  return t.documentos.every((d) => getEstadoDocumento(d) === "vigente");
}

function docsFaltantes(t) {
  return t.documentos.filter((d) => getEstadoDocumento(d) !== "vigente");
}

function docsRequeridos(tipoContratista, riesgosSeleccionados) {
  const base = tipoContratista === "monotributista" ? DOCS_BASE_MONOTRIBUTISTA : DOCS_BASE_EMPRESA;
  const todosExtra = riesgosSeleccionados.flatMap((id) => DOCS_POR_RIESGO[id] || []);
  // dedupe por nombre
  const vistos = new Set();
  const extraUnicos = todosExtra.filter((d) => {
    if (vistos.has(d.nombre)) return false;
    vistos.add(d.nombre);
    return true;
  });
  // se descartan los que ya están cubiertos por algún documento de la base
  const extra = extraUnicos.filter((d) => !yaCubiertoPorBase(d.nombre, base));
  return { base, extra };
}

function Stamp({ estado, size = "md" }) {
  const m = STATUS_META[estado];
  const dims = size === "sm" ? "text-[10px] px-2 py-[3px]" : "text-[11px] px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 font-semibold uppercase tracking-wide ${dims}`}
      style={{
        color: m.color,
        borderColor: m.color,
        background: m.bg,
        fontFamily: "'JetBrains Mono', monospace",
        transform: "rotate(-2deg)",
        letterSpacing: "0.04em",
      }}
    >
      {m.label}
    </span>
  );
}

function KpiCard({ label, value, sub, accent }) {
  const tone = accent || "#2C5F7C";
  return (
    <div
      className="rounded-xl border bg-white p-5 flex flex-col gap-1 relative overflow-hidden"
      style={{ borderColor: "#E2E5E1" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: tone, opacity: 0.85 }} />
      <span className="text-[11.5px] font-medium uppercase tracking-wide" style={{ color: "#9CA39A", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span
        className="text-3xl font-semibold"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: accent || "#14181C", letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[12px]" style={{ color: "#9CA39A" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function Sidebar({ role, setRole, view, setView, onLogout }) {
  const items = NAV_BY_ROLE[role] || [];
  const roleMeta = ROLES.find((r) => r.id === role);
  return (
    <aside
      className="w-[230px] shrink-0 flex flex-col border-r"
      style={{ borderColor: "#E2E5E1", background: "#FFFFFF" }}
    >
      <div className="px-5 pt-6 pb-5 flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #2C5F7C, #1F4358)",
            boxShadow: "0 2px 6px rgba(44,95,124,0.35)",
          }}
        >
          <ShieldCheck size={17} color="#fff" />
        </div>
        <span
          className="text-[16px] font-semibold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#14181C", letterSpacing: "-0.01em" }}
        >
          ControlDoc <span style={{ color: "#2C5F7C" }}>Pro</span>
        </span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left"
              style={{
                background: active ? "#EAF1F4" : "transparent",
                color: active ? "#2C5F7C" : "#5A6158",
                borderLeft: active ? "2.5px solid #2C5F7C" : "2.5px solid transparent",
                marginLeft: "-1px",
              }}
            >
              <Icon size={16} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div
          className="rounded-lg px-3 py-3 mb-2"
          style={{ background: "#F7F8F6", border: "1px solid #E2E5E1" }}
        >
          <div className="text-[11px] font-medium" style={{ color: "#9CA39A" }}>
            Conectado como
          </div>
          <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: "#14181C" }}>
            {roleMeta?.label}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium w-full"
          style={{ color: "#9CA39A" }}
        >
          <LogOut size={15} /> Cambiar rol
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between px-8 py-5">
      <div>
        <h1
          className="text-[20px] font-semibold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#14181C" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] mt-0.5" style={{ color: "#6B7268" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: "#E2E5E1", background: "#fff" }}
        >
          <Search size={14} color="#9CA39A" />
          <input
            placeholder="Buscar contratista, documento..."
            className="text-[13px] outline-none bg-transparent w-[200px]"
          />
        </div>
        <button
          className="w-9 h-9 rounded-lg border flex items-center justify-center relative"
          style={{ borderColor: "#E2E5E1", background: "#fff" }}
        >
          <Bell size={15} color="#4B524A" />
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{ background: "#C9483B" }}
          />
        </button>
      </div>
    </div>
  );
}

function SuperAdminDashboardView() {
  const totalEmpresas = EMPRESAS_CLIENTE.length;
  const activas = EMPRESAS_CLIENTE.filter((e) => e.estado === "activa").length;
  const totalContratistas = EMPRESAS_CLIENTE.reduce((a, e) => a + e.contratistas, 0);
  const facturacionMensual = EMPRESAS_CLIENTE.reduce(
    (a, e) => a + planPorContratistas(e.contratistas).mensual,
    0
  );

  return (
    <div className="px-8 pb-10">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Empresas clientes" value={totalEmpresas} sub={`${activas} activas`} />
        <KpiCard label="Contratistas en la plataforma" value={totalContratistas} sub="entre todas las empresas" />
        <KpiCard label="Facturación mensual estimada" value={`$${facturacionMensual}`} sub="según plan de cada empresa" accent="#3F8F5F" />
        <KpiCard
          label="Empresas suspendidas"
          value={EMPRESAS_CLIENTE.filter((e) => e.estado === "suspendida").length}
          accent="#C9483B"
        />
      </div>

      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E2E5E1" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold" style={{ color: "#14181C" }}>
            Empresas clientes
          </h3>
          <Filter size={14} color="#9CA39A" />
        </div>
        <div className="flex flex-col gap-3">
          {EMPRESAS_CLIENTE.map((e) => {
            const plan = planPorContratistas(e.contratistas);
            return (
              <div
                key={e.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: "#F0F1EE" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold"
                    style={{ background: "#F7F8F6", color: "#6B7268" }}
                  >
                    <Building2 size={14} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{e.razonSocial}</div>
                    <div className="text-[11.5px]" style={{ color: "#9CA39A" }}>
                      {e.rubro} · {e.contratistas} contratistas · Plan {plan.nombre}
                    </div>
                  </div>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: STATUS_EMPRESA[e.estado].color, background: STATUS_EMPRESA[e.estado].bg }}
                >
                  {STATUS_EMPRESA[e.estado].label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const vigentes = CONTRACTORS.filter((c) => c.estado === "vigente").length;
  const porVencer = CONTRACTORS.filter((c) => c.estado === "por_vencer").length;
  const vencidos = CONTRACTORS.filter((c) => c.estado === "vencido").length;
  const totalTrabajadores = CONTRACTORS.reduce((a, c) => a + c.trabajadores, 0);

  return (
    <div className="px-8 pb-10">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Contratistas activos" value={CONTRACTORS.length} sub="empresas habilitadas" />
        <KpiCard label="Trabajadores" value={totalTrabajadores} sub="bajo contrato vigente" />
        <KpiCard label="Doc. por vencer" value={porVencer} sub="próximos 7 días" accent="#B9791F" />
        <KpiCard label="Doc. vencidos" value={vencidos} sub="requieren acción" accent="#C9483B" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div
          className="col-span-2 rounded-xl border bg-white p-5"
          style={{ borderColor: "#E2E5E1" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold" style={{ color: "#14181C" }}>
              Cumplimiento por contratista
            </h3>
            <Filter size={14} color="#9CA39A" />
          </div>
          <div className="flex flex-col gap-3">
            {CONTRACTORS.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: "#F0F1EE" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold"
                    style={{ background: "#F7F8F6", color: "#6B7268", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {c.id.slice(2)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>
                      {c.empresa}
                    </div>
                    <div className="text-[11.5px]" style={{ color: "#9CA39A" }}>
                      {c.rubro} · {c.trabajadores} trabajadores
                    </div>
                  </div>
                </div>
                <Stamp estado={c.estado} size="sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E2E5E1" }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#14181C" }}>
            Alertas recientes
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: AlertTriangle, color: "#C9483B", text: "Petrocamp Ingeniería tiene 3 documentos vencidos", time: "hace 1 h" },
              { icon: Clock, color: "#B9791F", text: "Seguro de Logitrans Patagonia vence en 5 días", time: "hace 3 h" },
              { icon: AlertTriangle, color: "#C9483B", text: "MineralSur Contratos sin curso HSE vigente", time: "hace 6 h" },
            ].map((a, i) => (
              <div key={i} className="flex gap-3">
                <a.icon size={15} color={a.color} className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12.5px]" style={{ color: "#14181C" }}>
                    {a.text}
                  </div>
                  <div className="text-[11px]" style={{ color: "#9CA39A" }}>
                    {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergenciaCard({ emergencia, compact }) {
  if (!emergencia) return null;
  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{ borderColor: "#F3C9C3", background: "#FFF9F8" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Phone size={14} color="#C9483B" />
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#C9483B" }}>
          Contactos en caso de accidente
        </span>
      </div>
      <div className={compact ? "flex flex-col gap-2" : "grid grid-cols-3 gap-4"}>
        <div>
          <div className="text-[11px]" style={{ color: "#9CA39A" }}>ART</div>
          <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{emergencia.art}</div>
          <div className="text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C9483B" }}>{emergencia.telArt}</div>
        </div>
        <div>
          <div className="text-[11px]" style={{ color: "#9CA39A" }}>Seguro</div>
          <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{emergencia.seguro}</div>
          <div className="text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C9483B" }}>{emergencia.telSeguro}</div>
        </div>
        <div>
          <div className="text-[11px]" style={{ color: "#9CA39A" }}>Responsable HSE del contratista</div>
          <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{emergencia.contacto}</div>
        </div>
      </div>
    </div>
  );
}

function ContratistasView() {
  const [filtro, setFiltro] = useState("todos");
  const [expandido, setExpandido] = useState(null);
  const list = useMemo(
    () => CONTRACTORS.filter((c) => filtro === "todos" || c.estado === filtro),
    [filtro]
  );
  return (
    <div className="px-8 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {["todos", "vigente", "por_vencer", "vencido"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium border"
              style={{
                borderColor: filtro === f ? "#2C5F7C" : "#E2E5E1",
                background: filtro === f ? "#2C5F7C" : "#fff",
                color: filtro === f ? "#fff" : "#4B524A",
              }}
            >
              {f === "todos" ? "Todos" : STATUS_META[f].label}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "#2C5F7C", color: "#fff" }}
        >
          <Plus size={15} /> Nuevo contratista
        </button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E2E5E1" }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "#F7F8F6" }}>
              {["ID", "Empresa", "Rubro", "Trabajadores", "Estado", "", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "#9CA39A" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <React.Fragment key={c.id}>
                <tr className="border-t" style={{ borderColor: "#F0F1EE" }}>
                  <td
                    className="px-5 py-3.5 text-[12.5px]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6B7268" }}
                  >
                    {c.id}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "#14181C" }}>
                    {c.empresa}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>
                    {c.rubro}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>
                    {c.trabajadores}
                  </td>
                  <td className="px-5 py-3.5">
                    <Stamp estado={c.estado} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                      className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: "#FBEAE8", color: "#C9483B" }}
                    >
                      <Phone size={11} /> Emergencia
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-[12.5px] font-medium" style={{ color: "#2C5F7C" }}>
                      Ver ficha
                    </button>
                  </td>
                </tr>
                {expandido === c.id && (
                  <tr style={{ borderColor: "#F0F1EE" }}>
                    <td colSpan={7} className="px-5 pb-4">
                      <EmergenciaCard emergencia={c.emergencia} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ATSView({ ats, setAts }) {
  const toggleRiesgo = (id) => {
    setAts((prev) => {
      const set = new Set(prev.riesgos);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...prev, riesgos: [...set] };
    });
  };

  return (
    <div className="px-8 pb-10">
      <div
        className="rounded-xl border p-4 mb-6 flex items-start gap-3"
        style={{ borderColor: "#E2E5E1", background: "#EAF1F4" }}
      >
        <FileText size={16} color="#2C5F7C" className="mt-0.5 shrink-0" />
        <p className="text-[12.5px]" style={{ color: "#1F4358" }}>
          Completá el Análisis Preliminar de Tareas (APT/ATS) por cada trabajo. Según el tipo de contratista
          y los riesgos que tildes, la pestaña <strong>Mis documentos</strong> se actualiza sola con lo que tenés que presentar.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 mb-5" style={{ borderColor: "#E2E5E1" }}>
        <h3 className="text-[13.5px] font-semibold mb-4" style={{ color: "#14181C" }}>
          Tipo de contratista
        </h3>
        <div className="flex gap-2">
          {[
            { id: "empresa", label: "Empresa con personal en nómina" },
            { id: "monotributista", label: "Monotributista / independiente" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setAts((prev) => ({ ...prev, tipo: t.id }))}
              className="flex-1 px-4 py-3 rounded-lg border text-[12.5px] font-medium text-left"
              style={{
                borderColor: ats.tipo === t.id ? "#2C5F7C" : "#E2E5E1",
                background: ats.tipo === t.id ? "#EAF1F4" : "#fff",
                color: ats.tipo === t.id ? "#2C5F7C" : "#4B524A",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6" style={{ borderColor: "#E2E5E1" }}>
        <h3 className="text-[13.5px] font-semibold mb-1" style={{ color: "#14181C" }}>
          Riesgos a los que está expuesto el trabajador
        </h3>
        <p className="text-[12px] mb-4" style={{ color: "#9CA39A" }}>
          Identificá uno o varios
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {RIESGOS_ATS.map((r) => {
            const checked = ats.riesgos.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleRiesgo(r.id)}
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg border text-left"
                style={{
                  borderColor: checked ? "#2C5F7C" : "#E2E5E1",
                  background: checked ? "#EAF1F4" : "#fff",
                }}
              >
                <div
                  className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    border: `1.5px solid ${checked ? "#2C5F7C" : "#C7CCC4"}`,
                    background: checked ? "#2C5F7C" : "#fff",
                  }}
                >
                  {checked && <Check size={11} color="#fff" />}
                </div>
                <span className="text-[12.5px]" style={{ color: "#14181C" }}>
                  {r.id}. {r.label}
                </span>
              </button>
            );
          })}
        </div>

        {(ats.riesgos.includes(1) || ats.riesgos.includes(2) || ats.riesgos.includes(7)) && (
          <div className="mt-4 rounded-lg px-4 py-3 text-[12px]" style={{ background: "#FBF2E2", color: "#8A5A14" }}>
            Tildaste trabajo en altura o armado de andamios → debés cumplimentar la <strong>Resol. 61/2023</strong>.
          </div>
        )}
        {(ats.riesgos.includes(1) || ats.riesgos.includes(2) || ats.riesgos.includes(6)) && (
          <div className="mt-2 rounded-lg px-4 py-3 text-[12px]" style={{ background: "#FBF2E2", color: "#8A5A14" }}>
            Debés presentar los <strong>Aptos Médicos</strong> del personal afectado.
          </div>
        )}
      </div>
    </div>
  );
}

function SubirDocumentoModal({ nombreDocumento, session, onClose, onSubido }) {
  const [archivo, setArchivo] = useState(null);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [esCapacitacion, setEsCapacitacion] = useState(
    nombreDocumento.toLowerCase().includes("capacitaci") || nombreDocumento.toLowerCase().includes("epp")
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubir = async () => {
    setError("");
    if (!session?.accessToken) {
      setError("Necesitás haber iniciado sesión real para subir documentos.");
      return;
    }
    if (!archivo) {
      setError("Elegí un archivo primero.");
      return;
    }
    setCargando(true);
    try {
      await subirDocumentoReal({
        accessToken: session.accessToken,
        contratistaId: session.perfil.contratista_id,
        nombreDocumento,
        entidadTipo: "contratista",
        entidadId: session.perfil.contratista_id,
        archivo,
        fechaEmision: esCapacitacion ? fechaEmision : null,
        fechaVencimiento: esCapacitacion ? null : fechaVencimiento,
        subidoPor: session.perfil.id,
      });
      onSubido();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(20,24,28,0.45)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl bg-white p-6 w-full max-w-[420px] mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
      >
        <h3 className="text-[14.5px] font-semibold mb-1" style={{ color: "#14181C" }}>
          Subir documento
        </h3>
        <p className="text-[12.5px] mb-4" style={{ color: "#6B7268" }}>
          {nombreDocumento}
        </p>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="text-[11.5px] font-medium block mb-1.5" style={{ color: "#6B7268" }}>
              Archivo (PDF, imagen o Excel)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="text-[12.5px] w-full"
            />
          </div>

          {esCapacitacion ? (
            <div>
              <label className="text-[11.5px] font-medium block mb-1.5" style={{ color: "#6B7268" }}>
                Fecha de emisión (vence automáticamente a los 6 meses)
              </label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="rounded-lg border px-3 py-2 text-[13px] outline-none w-full"
                style={{ borderColor: "#E2E5E1" }}
              />
            </div>
          ) : (
            <div>
              <label className="text-[11.5px] font-medium block mb-1.5" style={{ color: "#6B7268" }}>
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="rounded-lg border px-3 py-2 text-[13px] outline-none w-full"
                style={{ borderColor: "#E2E5E1" }}
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg px-3.5 py-2.5 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-medium border"
              style={{ borderColor: "#E2E5E1", color: "#4B524A" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubir}
              disabled={cargando}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white"
              style={{ background: "#2C5F7C", opacity: cargando ? 0.7 : 1 }}
            >
              {cargando ? "Subiendo..." : "Subir documento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocChecklistGroup({ title, docs, tone, session, onSubido }) {
  const [modalDoc, setModalDoc] = useState(null);
  const [verError, setVerError] = useState("");

  const verArchivo = async (rutaArchivo) => {
    setVerError("");
    try {
      const url = await obtenerUrlDescarga({ accessToken: session.accessToken, rutaArchivo });
      window.open(url, "_blank");
    } catch (e) {
      setVerError(e.message);
    }
  };

  if (!docs.length) return null;
  return (
    <div className="mb-6">
      <h4 className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: tone || "#9CA39A" }}>
        {title}
      </h4>
      {verError && (
        <div className="rounded-lg px-3.5 py-2 mb-2 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
          {verError}
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {docs.map((d, i) => {
          const estado = getEstadoDocumento(d);
          const venc = getVencimiento(d);
          return (
            <div
              key={i}
              className="rounded-xl border bg-white px-5 py-3.5 flex items-center justify-between"
              style={{ borderColor: estado === "vigente" ? "#E2E5E1" : "#F3C9C3" }}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} color="#6B7268" className="shrink-0" />
                <div>
                  <span className="text-[13px]" style={{ color: "#14181C" }}>{d.nombre}</span>
                  {venc && (
                    <div className="text-[11px] mt-0.5" style={{ color: "#9CA39A" }}>
                      Vence: {fmtFecha(venc)}
                    </div>
                  )}
                  {d.estadoRevision === "pendiente" && (
                    <div className="text-[11px] mt-0.5 font-medium" style={{ color: "#B9791F" }}>
                      Pendiente de revisión del auditor
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Stamp estado={estado} size="sm" />
                {d.archivoPath && (
                  <button
                    onClick={() => verArchivo(d.archivoPath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ background: "#F7F8F6", color: "#2C5F7C", border: "1px solid #E2E5E1" }}
                  >
                    <Eye size={13} /> Ver
                  </button>
                )}
                {estado !== "vigente" && (
                  <button
                    onClick={() => setModalDoc(d.nombre)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ background: "#2C5F7C", color: "#fff" }}
                  >
                    <Upload size={13} /> Subir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalDoc && (
        <SubirDocumentoModal
          nombreDocumento={modalDoc}
          session={session}
          onClose={() => setModalDoc(null)}
          onSubido={onSubido}
        />
      )}
    </div>
  );
}

// trae los documentos ya subidos por el contratista logueado
async function obtenerDocumentosContratista({ accessToken, contratistaId }) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/documentos?entidad_tipo=eq.contratista&entidad_id=eq.${contratistaId}&order=created_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("No se pudieron traer tus documentos.");
  return res.json();
}

// combina el catálogo requerido con lo realmente subido a la base
function mezclarConSubidos(catalogo, subidos) {
  return catalogo.map((d) => {
    // tomamos la carga más reciente de ese nombre de documento
    const real = subidos.find((s) => s.nombre_documento === d.nombre);
    if (!real) return d; // todavía no se subió nada para este ítem
    return {
      ...d,
      tipo: real.fecha_emision ? "antiguedad6m" : "vencimiento",
      fechaEmision: real.fecha_emision ? new Date(real.fecha_emision + "T00:00:00") : undefined,
      fechaVencimiento: real.fecha_vencimiento ? new Date(real.fecha_vencimiento + "T00:00:00") : undefined,
      estadoRevision: real.estado_revision,
      archivoPath: real.archivo_path,
    };
  });
}

function DocumentosView({ role, ats, session }) {
  const [refrescar, setRefrescar] = useState(0);
  const [subidos, setSubidos] = useState([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState("");

  React.useEffect(() => {
    if (role !== "contratista" || !session?.accessToken || !session?.perfil?.contratista_id) return;
    setCargandoDocs(true);
    setErrorDocs("");
    obtenerDocumentosContratista({ accessToken: session.accessToken, contratistaId: session.perfil.contratista_id })
      .then(setSubidos)
      .catch((e) => setErrorDocs(e.message))
      .finally(() => setCargandoDocs(false));
  }, [role, session?.accessToken, session?.perfil?.contratista_id, refrescar]);

  if (role !== "contratista") {
    return (
      <div className="px-8 pb-10">
        <div className="flex flex-col gap-3">
          {DOCS_CONTRATISTA.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border bg-white px-5 py-4 flex items-center justify-between"
              style={{ borderColor: "#E2E5E1" }}
            >
              <div className="flex items-center gap-3">
                <FileText size={17} color="#6B7268" />
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{d.nombre}</div>
                  <div className="text-[11.5px]" style={{ color: "#9CA39A" }}>Vence: {d.vence}</div>
                </div>
              </div>
              <Stamp estado={d.estado} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const docsBase = docsRequeridos(ats.tipo, ats.riesgos);
  const base = session?.accessToken ? mezclarConSubidos(docsBase.base, subidos) : docsBase.base;
  const extra = session?.accessToken ? mezclarConSubidos(docsBase.extra, subidos) : docsBase.extra;

  return (
    <div className="px-8 pb-10">
      {session?.accessToken ? (
        <div
          className="rounded-xl border p-3.5 mb-5 flex items-center gap-2"
          style={{ borderColor: "#BFE0CB", background: "#EAF4ED" }}
        >
          <Check size={14} color="#3F8F5F" />
          <span className="text-[12px]" style={{ color: "#1F4358" }}>
            Conectado a tu cuenta real — lo que subas acá se guarda en tu base de datos.
          </span>
        </div>
      ) : (
        <div
          className="rounded-xl border p-3.5 mb-5 flex items-center gap-2"
          style={{ borderColor: "#F3C9C3", background: "#FFF9F8" }}
        >
          <AlertTriangle size={14} color="#C9483B" />
          <span className="text-[12px]" style={{ color: "#8A2E25" }}>
            Estás en modo demo (sin sesión real) — la carga de archivos no va a funcionar hasta loguearte de verdad.
          </span>
        </div>
      )}

      <div
        className="rounded-xl border p-4 mb-6 flex items-start gap-3"
        style={{ borderColor: "#E2E5E1", background: "#fff" }}
      >
        <div className="flex-1">
          <div className="text-[12px] font-medium" style={{ color: "#9CA39A" }}>Tipo de contratista</div>
          <div className="text-[13.5px] font-semibold" style={{ color: "#14181C" }}>
            {ats.tipo === "monotributista" ? "Monotributista / independiente" : "Empresa con personal en nómina"}
          </div>
        </div>
        <div className="text-[12px]" style={{ color: "#9CA39A" }}>
          {base.length + extra.length} documentos requeridos según tu ATS
        </div>
      </div>

      {cargandoDocs && (
        <p className="text-[11.5px] mb-4" style={{ color: "#9CA39A" }}>Actualizando tus documentos...</p>
      )}
      {errorDocs && (
        <div className="rounded-lg px-3.5 py-2.5 mb-4 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
          {errorDocs}
        </div>
      )}

      <DocChecklistGroup
        title="Documentación base (siempre requerida)"
        docs={base}
        tone="#6B7268"
        session={session}
        onSubido={() => setRefrescar((n) => n + 1)}
      />
      <DocChecklistGroup
        title="Documentación adicional (según riesgos del ATS)"
        docs={extra}
        tone="#B9791F"
        session={session}
        onSubido={() => setRefrescar((n) => n + 1)}
      />

      {extra.length === 0 && (
        <p className="text-[12px]" style={{ color: "#9CA39A" }}>
          No tildaste riesgos en el ATS que requieran documentación adicional.
        </p>
      )}
    </div>
  );
}

function VehiculosView() {
  const [tab, setTab] = useState("comun");
  const docs = tab === "comun" ? DOCS_VEHICULO : DOCS_VEHICULO_INDUSTRIAL;

  return (
    <div className="px-8 pb-10">
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "#F7F8F6", border: "1px solid #E2E5E1" }}>
        {[
          { id: "comun", label: "Vehículo común", icon: Truck },
          { id: "industrial", label: "Vehículo industrial", icon: Wrench },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[12.5px] font-medium"
              style={{
                background: tab === t.id ? "#fff" : "transparent",
                color: tab === t.id ? "#14181C" : "#9CA39A",
                boxShadow: tab === t.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <p className="text-[12.5px] mb-4" style={{ color: "#9CA39A" }}>
        {tab === "comun"
          ? "Documentación para vehículos particulares/utilitarios que ingresan a planta."
          : "Documentación para autoelevadores, maquinaria vial y plataformas elevadoras (vinculado al riesgo 6 del ATS)."}
      </p>

      <div className="flex flex-col gap-2.5">
        {docs.map((d, i) => {
          const estado = getEstadoDocumento(d);
          const venc = getVencimiento(d);
          return (
            <div
              key={i}
              className="rounded-xl border bg-white px-5 py-3.5 flex items-center justify-between"
              style={{ borderColor: estado === "vigente" ? "#E2E5E1" : "#F3C9C3" }}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} color="#6B7268" />
                <div>
                  <span className="text-[13px]" style={{ color: "#14181C" }}>{d.nombre}</span>
                  {venc && (
                    <div className="text-[11px] mt-0.5" style={{ color: "#9CA39A" }}>
                      Vence: {fmtFecha(venc)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Stamp estado={estado} size="sm" />
                {estado !== "vigente" && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ background: "#2C5F7C", color: "#fff" }}
                  >
                    <Upload size={13} /> Subir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-lg text-[13px] font-medium"
        style={{ background: "#2C5F7C", color: "#fff" }}
      >
        <Plus size={15} /> Agregar otro vehículo
      </button>
    </div>
  );
}

function TrabajadoresView({ role }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  if (seleccionado) {
    const t = seleccionado;
    const habilitado = trabajadorHabilitado(t);
    return (
      <div className="px-8 pb-10">
        <button
          onClick={() => setSeleccionado(null)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium mb-5"
          style={{ color: "#6B7268" }}
        >
          <ArrowLeft size={14} /> Volver a trabajadores
        </button>

        <div
          className="rounded-xl border bg-white p-5 mb-5 flex items-center justify-between"
          style={{ borderColor: "#E2E5E1" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-semibold"
              style={{ background: "#EAF1F4", color: "#2C5F7C" }}
            >
              {t.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: "#14181C" }}>{t.nombre}</div>
              <div className="text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA39A" }}>
                DNI {t.dni}
              </div>
            </div>
          </div>
          {habilitado ? (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
              style={{ background: "#EAF4ED", color: "#3F8F5F" }}
            >
              <Check size={13} /> Habilitado
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
              style={{ background: "#FBEAE8", color: "#C9483B" }}
            >
              <AlertTriangle size={13} /> Inhabilitado
            </span>
          )}
        </div>

        {!habilitado && (
          <div
            className="rounded-xl border px-4 py-3 mb-5 text-[12.5px]"
            style={{ borderColor: "#F3C9C3", background: "#FBEAE8", color: "#8A2E25" }}
          >
            Te falta presentar {docsFaltantes(t).length} documento(s) para habilitar a {t.nombre.split(" ")[0]}.
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {t.documentos.map((d, i) => {
            const estado = getEstadoDocumento(d);
            const venc = getVencimiento(d);
            return (
              <div
                key={i}
                className="rounded-xl border bg-white px-5 py-3.5 flex items-center justify-between"
                style={{ borderColor: estado === "vigente" ? "#E2E5E1" : "#F3C9C3" }}
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} color="#6B7268" />
                  <div>
                    <span className="text-[13px]" style={{ color: "#14181C" }}>{d.nombre}</span>
                    {venc && (
                      <div className="text-[11px] mt-0.5" style={{ color: "#9CA39A" }}>
                        Vence: {fmtFecha(venc)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Stamp estado={estado} size="sm" />
                  {estado !== "vigente" && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                      style={{ background: "#2C5F7C", color: "#fff" }}
                    >
                      <Upload size={13} /> Subir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Contratista: solo ve a su propia gente. Empresa: ve todo, pero agrupado, nunca mezclado.
  const propios = TRABAJADORES.filter((t) => t.contratista === CONTRATISTA_LOGUEADO);
  const baseList = role === "contratista" ? propios : TRABAJADORES;

  const filtrados = baseList.filter(
    (t) => t.nombre.toLowerCase().includes(busqueda.toLowerCase()) || t.dni.includes(busqueda)
  );

  const grupos =
    role === "empresa"
      ? Object.values(
          filtrados.reduce((acc, t) => {
            (acc[t.contratista] ||= { contratista: t.contratista, trabajadores: [] }).trabajadores.push(t);
            return acc;
          }, {})
        )
      : [{ contratista: CONTRATISTA_LOGUEADO, trabajadores: filtrados }];

  const renderCard = (t) => {
    const habilitado = trabajadorHabilitado(t);
    const faltan = docsFaltantes(t);
    return (
      <button
        key={t.id}
        onClick={() => setSeleccionado(t)}
        className="rounded-xl border bg-white px-5 py-4 flex items-center justify-between text-left"
        style={{ borderColor: habilitado ? "#E2E5E1" : "#F3C9C3" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
            style={{ background: "#EAF1F4", color: "#2C5F7C" }}
          >
            {t.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="text-[13.5px] font-medium" style={{ color: "#14181C" }}>{t.nombre}</div>
            <div className="text-[11.5px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA39A" }}>
              DNI {t.dni}
            </div>
          </div>
        </div>

        {habilitado ? (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
            style={{ background: "#EAF4ED", color: "#3F8F5F" }}
          >
            <Check size={13} /> Habilitado
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
            style={{ background: "#FBEAE8", color: "#C9483B" }}
          >
            <AlertTriangle size={13} /> Faltan {faltan.length} doc.
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="px-8 pb-10">
      {role === "contratista" && (
        <div
          className="rounded-lg px-4 py-2.5 mb-5 flex items-center gap-2 w-fit"
          style={{ background: "#EAF1F4", border: "1px solid #DCE7EB" }}
        >
          <Building2 size={14} color="#2C5F7C" />
          <span className="text-[12.5px] font-medium" style={{ color: "#2C5F7C" }}>{CONTRATISTA_LOGUEADO}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 gap-3">
        <p className="text-[12.5px] shrink-0" style={{ color: "#9CA39A" }}>
          {baseList.length} trabajadores · {baseList.filter(trabajadorHabilitado).length} habilitados
        </p>
        {role === "empresa" && (
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 max-w-[320px]"
            style={{ borderColor: "#E2E5E1", background: "#fff" }}
          >
            <Search size={14} color="#9CA39A" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="text-[13px] outline-none bg-transparent w-full"
            />
          </div>
        )}
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium shrink-0"
          style={{ background: "#2C5F7C", color: "#fff" }}
        >
          <Plus size={15} /> Agregar trabajador
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {grupos.map((g) => (
          <div key={g.contratista}>
            {role === "empresa" && (
              <div className="flex items-center gap-2 mb-2.5">
                <Building2 size={14} color="#6B7268" />
                <span className="text-[12.5px] font-semibold" style={{ color: "#14181C" }}>{g.contratista}</span>
                <span className="text-[11.5px]" style={{ color: "#9CA39A" }}>· {g.trabajadores.length}</span>
              </div>
            )}
            <div className="flex flex-col gap-2.5">{g.trabajadores.map(renderCard)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



const IA_META = {
  ok: { label: "IA: todo OK", color: "#3F8F5F", bg: "#EAF4ED" },
  revisar: { label: "IA: revisar", color: "#B9791F", bg: "#FBF2E2" },
  alerta: { label: "IA: alerta", color: "#C9483B", bg: "#FBEAE8" },
};

const FORMATO_ICON = { pdf: FileText, imagen: FileImage, excel: FileSpreadsheet };

function AprobacionesView({ session }) {
  const modoReal = !!(session?.accessToken && session?.perfil?.empresa_cliente_id);
  const [grupos, setGrupos] = useState(modoReal ? [] : APPROVALS_GROUPED);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [motivoFor, setMotivoFor] = useState(null); // id del item en rechazo
  const [motivoTexto, setMotivoTexto] = useState("");
  const [verError, setVerError] = useState("");
  const [refrescar, setRefrescar] = useState(0);

  React.useEffect(() => {
    if (!modoReal) return;
    setCargando(true);
    setErrorCarga("");
    obtenerPendientesDeAprobacion({ accessToken: session.accessToken, empresaClienteId: session.perfil.empresa_cliente_id })
      .then(setGrupos)
      .catch((e) => setErrorCarga(e.message))
      .finally(() => setCargando(false));
  }, [modoReal, session?.accessToken, session?.perfil?.empresa_cliente_id, refrescar]);

  const todosItems = grupos.flatMap((g) => g.items.map((it) => ({ ...it, contratista: g.contratista })));
  const okCount = modoReal ? 0 : todosItems.filter((it) => analisisIA(it).confianza === "ok").length;

  const quitarDeLista = (contratista, id) => {
    setGrupos((prev) =>
      prev
        .map((g) => (g.contratista === contratista ? { ...g, items: g.items.filter((i) => i.id !== id) } : g))
        .filter((g) => g.items.length > 0)
    );
  };

  const aprobarItem = async (contratista, id) => {
    if (modoReal) {
      try {
        await resolverDocumento({ accessToken: session.accessToken, docId: id, aprobado: true, revisadoPor: session.perfil.id });
        quitarDeLista(contratista, id);
      } catch (e) {
        setErrorCarga(e.message);
      }
      return;
    }
    quitarDeLista(contratista, id);
  };

  const rechazarItem = async (contratista, id) => {
    if (modoReal) {
      try {
        await resolverDocumento({
          accessToken: session.accessToken,
          docId: id,
          aprobado: false,
          motivoRechazo: motivoTexto,
          revisadoPor: session.perfil.id,
        });
        quitarDeLista(contratista, id);
      } catch (e) {
        setErrorCarga(e.message);
      }
    } else {
      quitarDeLista(contratista, id);
    }
    setMotivoFor(null);
    setMotivoTexto("");
  };

  const aprobarTodo = async (contratista) => {
    const grupo = grupos.find((g) => g.contratista === contratista);
    if (modoReal && grupo) {
      try {
        await Promise.all(
          grupo.items.map((it) =>
            resolverDocumento({ accessToken: session.accessToken, docId: it.id, aprobado: true, revisadoPor: session.perfil.id })
          )
        );
      } catch (e) {
        setErrorCarga(e.message);
      }
    }
    setGrupos((prev) => prev.filter((g) => g.contratista !== contratista));
  };

  const aprobarTodosLosOk = () => {
    setGrupos((prev) =>
      prev
        .map((g) => ({ ...g, items: g.items.filter((it) => analisisIA(it).confianza !== "ok") }))
        .filter((g) => g.items.length > 0)
    );
  };

  const verArchivo = async (rutaArchivo) => {
    setVerError("");
    if (!rutaArchivo) return;
    try {
      const url = await obtenerUrlDescarga({ accessToken: session.accessToken, rutaArchivo });
      window.open(url, "_blank");
    } catch (e) {
      setVerError(e.message);
    }
  };

  return (
    <div className="px-8 pb-10">
      {cargando && <p className="text-[12px] mb-4" style={{ color: "#9CA39A" }}>Cargando documentos pendientes...</p>}
      {errorCarga && (
        <div className="rounded-lg px-3.5 py-2.5 mb-4 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
          {errorCarga}
        </div>
      )}
      {verError && (
        <div className="rounded-lg px-3.5 py-2.5 mb-4 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
          {verError}
        </div>
      )}

      {grupos.length === 0 && !cargando && (
        <div
          className="rounded-xl border bg-white p-8 text-center text-[13px]"
          style={{ borderColor: "#E2E5E1", color: "#9CA39A" }}
        >
          No hay documentos pendientes de aprobación.
        </div>
      )}

      {!modoReal && grupos.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-5 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: "#DCE7EB", background: "#EAF1F4" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={16} color="#2C5F7C" className="mt-0.5 shrink-0" />
            <p className="text-[12.5px]" style={{ color: "#1F4358" }}>
              La IA ya revisó los {todosItems.length} documentos pendientes: <strong>{okCount} están listos</strong> (tipo, fecha y persona coinciden),
              el resto necesita tu atención. La IA nunca aprueba sola — vos confirmás, y siempre podés abrir el archivo original.
            </p>
          </div>
          {okCount > 0 && (
            <button
              onClick={aprobarTodosLosOk}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium shrink-0"
              style={{ background: "#2C5F7C", color: "#fff" }}
            >
              <Check size={14} /> Aprobar los {okCount} marcados OK
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {grupos.map((g) => (
          <div key={g.contratista} className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E2E5E1" }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: "#F7F8F6" }}>
              <div className="flex items-center gap-2">
                <Building2 size={15} color="#6B7268" />
                <span className="text-[13px] font-semibold" style={{ color: "#14181C" }}>{g.contratista}</span>
                <span className="text-[11.5px]" style={{ color: "#9CA39A" }}>
                  · {g.items.length} pendiente{g.items.length > 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() => aprobarTodo(g.contratista)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ background: "#3F8F5F", color: "#fff" }}
              >
                <Check size={13} /> Aprobar todo el contratista
              </button>
            </div>

            <div className="flex flex-col">
              {g.items.map((it) => {
                const esReal = modoReal;
                const FileIcon = esReal ? (FORMATO_ICON[it.formato] || FileText) : (FORMATO_ICON[it.formato] || FileText);
                const ia = esReal ? null : IA_META[analisisIA(it).confianza];
                const fechaLabel = esReal ? null : analisisIA(it).fechaLabel;
                return (
                  <div key={it.id} className="border-t" style={{ borderColor: "#F0F1EE" }}>
                    <div className="px-5 py-3.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <FileIcon size={17} color="#6B7268" className="mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>
                            {esReal ? it.nombre_documento : it.doc} —{" "}
                            <span style={{ color: "#6B7268" }}>{esReal ? "Empresa" : it.sujeto}</span>
                          </div>
                          <div className="text-[11.5px] mt-0.5" style={{ color: "#9CA39A" }}>
                            {esReal
                              ? `${it.formato || "archivo"} · subido ${fmtFecha(new Date(it.created_at))}${
                                  it.fecha_vencimiento ? ` · vence ${fmtFecha(new Date(it.fecha_vencimiento + "T00:00:00"))}` : ""
                                }`
                              : `${it.archivo} · subido ${it.subido}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => esReal && verArchivo(it.archivo_path)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                          style={{ background: "#F7F8F6", color: "#2C5F7C", border: "1px solid #E2E5E1" }}
                        >
                          <Eye size={13} /> Ver archivo
                        </button>
                        <button
                          onClick={() => aprobarItem(g.contratista, it.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                          style={{ borderColor: "#3F8F5F", color: "#3F8F5F" }}
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setMotivoFor(motivoFor === it.id ? null : it.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                          style={{ borderColor: "#C9483B", color: "#C9483B" }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>

                    {!esReal && (
                      <div className="px-5 pb-4 pl-[44px]">
                        <div className="rounded-lg px-3.5 py-3 flex items-start gap-2.5" style={{ background: ia.bg }}>
                          <Sparkles size={14} color={ia.color} className="mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11.5px] font-semibold" style={{ color: ia.color }}>
                                {ia.label}
                              </span>
                              {!it.ia.legible && (
                                <span className="text-[11px] font-medium" style={{ color: "#8A2E25" }}>
                                  · documento poco legible
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] mt-0.5" style={{ color: "#14181C" }}>
                              Detectado: {it.ia.tipoDetectado} — {fechaLabel}
                            </div>
                            <div className="text-[11.5px] mt-0.5" style={{ color: "#4B524A" }}>
                              {it.ia.observacion}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {motivoFor === it.id && (
                      <div className="px-5 pb-4 flex gap-2">
                        <input
                          value={motivoTexto}
                          onChange={(e) => setMotivoTexto(e.target.value)}
                          placeholder="Motivo del rechazo (ej: documento ilegible, vencido, no corresponde)"
                          className="flex-1 rounded-lg border px-3 py-2 text-[12.5px] outline-none"
                          style={{ borderColor: "#E2E5E1" }}
                        />
                        <button
                          onClick={() => rechazarItem(g.contratista, it.id)}
                          className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium"
                          style={{ background: "#C9483B", color: "#fff" }}
                        >
                          Confirmar rechazo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportesView() {
  const habilitados = TRABAJADORES.filter(trabajadorHabilitado).length;
  const inhabilitados = TRABAJADORES.length - habilitados;
  const reportes = [
    { id: "R-1", nombre: "Estado de cumplimiento por contratista", formato: "PDF", desc: "Semáforo completo de todos los contratistas vinculados" },
    { id: "R-2", nombre: "Listado de trabajadores habilitados / inhabilitados", formato: "Excel", desc: "Detalle individual con documentos faltantes" },
    { id: "R-3", nombre: "Documentos vencidos y próximos a vencer", formato: "Excel", desc: "Para seguimiento proactivo de renovaciones" },
    { id: "R-4", nombre: "Historial de aprobaciones y rechazos", formato: "PDF", desc: "Trazabilidad de auditoría HSE" },
  ];

  return (
    <div className="px-8 pb-10">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Trabajadores habilitados" value={habilitados} accent="#3F8F5F" />
        <KpiCard label="Trabajadores inhabilitados" value={inhabilitados} accent="#C9483B" />
        <KpiCard label="Contratistas con pendientes" value={APPROVALS_GROUPED.length} accent="#B9791F" />
      </div>

      <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#14181C" }}>
        Exportables
      </h3>
      <div className="flex flex-col gap-2.5">
        {reportes.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border bg-white px-5 py-4 flex items-center justify-between"
            style={{ borderColor: "#E2E5E1" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F7F8F6" }}>
                <FileStack size={16} color="#2C5F7C" />
              </div>
              <div>
                <div className="text-[13px] font-medium" style={{ color: "#14181C" }}>{r.nombre}</div>
                <div className="text-[11.5px]" style={{ color: "#9CA39A" }}>{r.desc}</div>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-medium shrink-0"
              style={{ background: "#F7F8F6", color: "#2C5F7C", border: "1px solid #E2E5E1" }}
            >
              <Download size={14} /> {r.formato}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccesosView() {
  const [query, setQuery] = useState("");
  const [buscado, setBuscado] = useState(false);

  const q = query.trim().toLowerCase();

  const trabajadoresEncontrados = !q
    ? []
    : TRABAJADORES.filter(
        (t) =>
          t.contratista.toLowerCase().includes(q) ||
          t.nombre.toLowerCase().includes(q) ||
          t.dni.includes(q)
      );

  // si matchea por empresa, agrupamos toda su gente; si matchea por persona, mostramos solo esa
  const contratistaMatch = CONTRACTORS.find((c) => c.empresa.toLowerCase().includes(q));
  const lista = trabajadoresEncontrados;
  const habilitados = lista.filter(trabajadorHabilitado).length;
  const empresaEncontrada =
    contratistaMatch || (lista.length > 0 ? CONTRACTORS.find((c) => c.empresa === lista[0].contratista) : null);

  const motivo = (t) => {
    const faltan = docsFaltantes(t);
    if (faltan.length === 0) return null;
    const principal = faltan[0];
    const estado = getEstadoDocumento(principal);
    const etiqueta = estado === "vencido" ? "vencido" : estado === "por_vencer" ? "por vencer" : "falta cargar";
    const extra = faltan.length > 1 ? ` (+${faltan.length - 1} más)` : "";
    return `${principal.nombre} ${etiqueta}${extra}`;
  };

  return (
    <div className="px-8 pb-10">
      <div className="rounded-xl border bg-white p-7 max-w-[560px] mx-auto text-center" style={{ borderColor: "#E2E5E1" }}>
        <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#F7F8F6" }}>
          <QrCode size={26} color="#2C5F7C" />
        </div>
        <h3 className="text-[15px] font-semibold mb-1" style={{ color: "#14181C" }}>
          Consultar habilitación
        </h3>
        <p className="text-[12.5px] mb-5" style={{ color: "#9CA39A" }}>
          Escaneá el QR, o buscá por CUIT/nombre de la empresa contratista o DNI del trabajador
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setBuscado(true); }}
            placeholder="Ej: Andesmin, 33.987.214, Petrocamp..."
            className="flex-1 rounded-lg border px-3 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "#E2E5E1" }}
          />
          <button
            onClick={() => setBuscado(true)}
            className="px-4 py-2.5 rounded-lg text-[13px] font-medium"
            style={{ background: "#2C5F7C", color: "#fff" }}
          >
            Buscar
          </button>
        </div>
      </div>

      {buscado && q && (
        <div className="max-w-[680px] mx-auto mt-6">
          {lista.length === 0 ? (
            <div className="text-center text-[12.5px]" style={{ color: "#C9483B" }}>
              No se encontró ninguna empresa o trabajador con ese dato.
            </div>
          ) : (
            <>
              <div
                className="rounded-xl border px-5 py-4 mb-4 flex items-center justify-between"
                style={{ borderColor: "#E2E5E1", background: "#F7F8F6" }}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={15} color="#6B7268" />
                  <span className="text-[13px] font-semibold" style={{ color: "#14181C" }}>
                    {lista.length === 1 ? lista[0].contratista : query}
                  </span>
                </div>
                <span className="text-[12px]" style={{ color: "#6B7268" }}>
                  {habilitados} de {lista.length} habilitados hoy
                </span>
              </div>

              {empresaEncontrada?.emergencia && (
                <div className="mb-4">
                  <EmergenciaCard emergencia={empresaEncontrada.emergencia} compact />
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {lista.map((t) => {
                  const habilitado = trabajadorHabilitado(t);
                  const m = motivo(t);
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl border bg-white px-5 py-4 flex items-center justify-between"
                      style={{ borderColor: habilitado ? "#E2E5E1" : "#F3C9C3" }}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                          style={{ background: "#EAF1F4", color: "#2C5F7C" }}
                        >
                          {t.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-medium" style={{ color: "#14181C" }}>{t.nombre}</div>
                          <div className="text-[11.5px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA39A" }}>
                            DNI {t.dni} · {t.contratista}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {habilitado ? (
                          <span
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                            style={{ background: "#EAF4ED", color: "#3F8F5F" }}
                          >
                            <Check size={13} /> Habilitado
                          </span>
                        ) : (
                          <>
                            <span
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                              style={{ background: "#FBEAE8", color: "#C9483B" }}
                            >
                              <X size={13} /> Inhabilitado
                            </span>
                            <div className="text-[11px] mt-1" style={{ color: "#8A2E25" }}>{m}</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const ACCESS_TYPES = [
  {
    id: "super_admin",
    icon: UserCog,
    label: "Super Administrador",
    desc: "Acceso del titular de la plataforma",
    accent: "#2C5F7C",
  },
  {
    id: "empresa",
    icon: ShieldCheck,
    label: "Empresa / Auditor HSE",
    desc: "Tu empresa ya tiene una cuenta en ControlDoc Pro",
    accent: "#3F8F5F",
  },
  {
    id: "contratista",
    icon: HardHat,
    label: "Contratista",
    desc: "Ingresá o registrate con el código de tu empresa",
    accent: "#B9791F",
  },
];

function FieldInput({ icon: Icon, label, type = "text", value, onChange, placeholder, mono }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium" style={{ color: "#4B524A" }}>
        {label}
      </span>
      <div
        className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
        style={{ borderColor: "#E2E5E1", background: "#fff" }}
      >
        <Icon size={15} color="#9CA39A" className="shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={isPassword && !show ? "password" : "text"}
          className="text-[13px] outline-none bg-transparent w-full"
          style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="shrink-0">
            {show ? <EyeOff size={14} color="#9CA39A" /> : <Eye size={14} color="#9CA39A" />}
          </button>
        )}
      </div>
    </label>
  );
}

/* ---------- Conexión a Supabase (vía fetch nativo, sin SDK) ---------- */
const SUPABASE_URL = "https://jgelxbxplobvqbjrfabs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Rpx0zhvNZXvZ6ZjDxRs6nQ_DSxxrqmD";

async function loginSuperAdmin(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "No se pudo iniciar sesión");

  // traemos el perfil para confirmar que el rol sea super_admin
  const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${data.user.id}&select=id,rol,nombre`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${data.access_token}` },
  });
  const perfiles = await perfilRes.json();
  if (!perfiles[0]) throw new Error("Usuario sin perfil asignado en la base de datos.");
  if (perfiles[0].rol !== "super_admin") throw new Error("Este usuario no tiene rol de Super Administrador.");

  return { accessToken: data.access_token, perfil: perfiles[0] };
}

/* ---------- Carga real de documentos (Storage + tabla documentos) ---------- */

async function subirDocumentoReal({
  accessToken,
  contratistaId,
  nombreDocumento,
  entidadTipo, // "contratista" | "trabajador" | "vehiculo"
  entidadId,
  archivo, // File del input
  fechaEmision, // string "YYYY-MM-DD" o null
  fechaVencimiento, // string "YYYY-MM-DD" o null
  subidoPor, // uuid del perfil logueado
}) {
  if (!accessToken) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
  if (!archivo) throw new Error("Elegí un archivo antes de subir.");

  const extension = archivo.name.split(".").pop();
  const rutaArchivo = `contratista_${contratistaId}/${entidadTipo}_${entidadId}_${Date.now()}.${extension}`;

  // 1. subir el archivo binario al bucket "documentos"
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/documentos/${rutaArchivo}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": archivo.type || "application/octet-stream",
    },
    body: archivo,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.message || "No se pudo subir el archivo. Probá de nuevo.");
  }

  const formato = archivo.type.includes("pdf")
    ? "pdf"
    : archivo.type.includes("sheet") || archivo.type.includes("excel")
    ? "excel"
    : "imagen";

  // 2. crear el registro del documento en la base, apuntando a ese archivo
  const docRes = await fetch(`${SUPABASE_URL}/rest/v1/documentos`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      nombre_documento: nombreDocumento,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      archivo_path: rutaArchivo,
      formato,
      fecha_emision: fechaEmision || null,
      fecha_vencimiento: fechaVencimiento || null,
      estado_revision: "pendiente",
      subido_por: subidoPor,
    }),
  });
  const docData = await docRes.json();
  if (!docRes.ok) throw new Error(docData.message || "El archivo se subió, pero no se pudo registrar en la base.");

  return docData[0];
}

// trae la URL temporal para ver/descargar un archivo privado
async function obtenerUrlDescarga({ accessToken, rutaArchivo }) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/documentos/${rutaArchivo}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 300 }), // el link dura 5 minutos
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "No se pudo generar el link de descarga.");
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

/* ---------- Aprobaciones reales (Empresa / Auditor) ---------- */

// trae los documentos pendientes de revisión de TODOS los contratistas de esta empresa
async function obtenerPendientesDeAprobacion({ accessToken, empresaClienteId }) {
  // 1. contratistas de esta empresa
  const contratistasRes = await fetch(
    `${SUPABASE_URL}/rest/v1/contratistas?empresa_cliente_id=eq.${empresaClienteId}&select=id,razon_social`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } }
  );
  const contratistas = await contratistasRes.json();
  if (!contratistasRes.ok) throw new Error("No se pudieron traer tus contratistas.");
  if (!contratistas.length) return [];

  const idsContratistas = contratistas.map((c) => c.id);
  const nombrePorId = Object.fromEntries(contratistas.map((c) => [c.id, c.razon_social]));

  // 2. documentos pendientes que pertenezcan a esos contratistas
  const idsFiltro = idsContratistas.join(",");
  const docsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/documentos?entidad_tipo=eq.contratista&entidad_id=in.(${idsFiltro})&estado_revision=eq.pendiente&order=created_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } }
  );
  const docs = await docsRes.json();
  if (!docsRes.ok) throw new Error("No se pudieron traer los documentos pendientes.");

  // 3. agrupar por contratista, como espera la pantalla
  const grupos = {};
  docs.forEach((d) => {
    const nombre = nombrePorId[d.entidad_id] || "Contratista";
    if (!grupos[nombre]) grupos[nombre] = [];
    grupos[nombre].push(d);
  });
  return Object.entries(grupos).map(([contratista, items]) => ({ contratista, items }));
}

async function resolverDocumento({ accessToken, docId, aprobado, motivoRechazo, revisadoPor }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/documentos?id=eq.${docId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      estado_revision: aprobado ? "aprobado" : "rechazado",
      motivo_rechazo: aprobado ? null : motivoRechazo || "Sin motivo especificado",
      revisado_por: revisadoPor,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "No se pudo actualizar el documento.");
  }
}

async function registrarContratista({ codigo, cuit, razonSocial, email, password }) {
  // 1. validar que el código corresponda a una empresa real
  const empresaRes = await fetch(
    `${SUPABASE_URL}/rest/v1/empresas_cliente?codigo_vinculacion=eq.${encodeURIComponent(codigo)}&select=id,razon_social,estado`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const empresas = await empresaRes.json();
  if (!empresaRes.ok) throw new Error("No se pudo validar el código. Probá de nuevo.");
  if (!empresas[0]) throw new Error("El código de empresa no existe. Verificalo con quien te lo dio.");
  if (empresas[0].estado === "suspendida") throw new Error("La empresa vinculada a este código está suspendida.");
  const empresaId = empresas[0].id;

  // 2. crear el usuario de login del contratista
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) throw new Error(signupData.error_description || signupData.msg || "No se pudo crear tu usuario.");
  const userId = signupData.user?.id || signupData.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");

  // 2b. nos logueamos explícitamente para tener un token real de ESTE usuario
  //     (el signup no siempre devuelve la sesión activa)
  let accessToken = signupData.access_token;
  if (!accessToken) {
    const loginData = await loginConEmailYPassword(email, password);
    accessToken = loginData.access_token;
  }
  if (!accessToken) {
    throw new Error(
      "Tu usuario se creó, pero no pudimos iniciar tu sesión automáticamente. Probá ingresar con 'Ya tengo cuenta'."
    );
  }
  const authHeader = `Bearer ${accessToken}`;

  // 3. crear la fila de contratista, vinculada a esa empresa
  const contratistaRes = await fetch(`${SUPABASE_URL}/rest/v1/contratistas`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authHeader,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ empresa_cliente_id: empresaId, razon_social: razonSocial, cuit, email }),
  });
  const contratistaData = await contratistaRes.json();
  if (!contratistaRes.ok) {
    throw new Error(
      contratistaData.message ||
        "Tu usuario se creó, pero falta confirmar el mail antes de completar el registro. Revisá tu casilla."
    );
  }
  const contratistaId = contratistaData[0].id;

  // 4. crear el perfil del usuario con rol "contratista"
  const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ id: userId, rol: "contratista", nombre: razonSocial, contratista_id: contratistaId }),
  });
  if (!perfilRes.ok) {
    const perfilErr = await perfilRes.json();
    throw new Error(perfilErr.message || "Te registramos, pero no se pudo vincular tu perfil. Contactá al administrador.");
  }

  return { empresa: empresas[0].razon_social };
}

// login genérico contra el endpoint de Auth de Supabase
async function loginConEmailYPassword(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Email o contraseña incorrectos.");
  return data; // { access_token, user, ... }
}

async function loginEmpresa(cuitIngresado, password) {
  const buscar = await fetch(
    `${SUPABASE_URL}/rest/v1/empresas_cliente?cuit=eq.${encodeURIComponent(cuitIngresado)}&select=email,razon_social,estado`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const empresas = await buscar.json();
  if (!buscar.ok || !empresas[0]) throw new Error("No encontramos ninguna empresa con ese CUIT.");
  if (!empresas[0].email) throw new Error("Esta empresa no tiene un email de acceso configurado. Contactá al administrador.");
  if (empresas[0].estado === "suspendida") throw new Error("Esta cuenta está suspendida. Contactá al administrador.");

  const data = await loginConEmailYPassword(empresas[0].email, password);

  const perfilRes = await fetch(
    `${SUPABASE_URL}/rest/v1/perfiles?id=eq.${data.user.id}&select=id,rol,nombre,empresa_cliente_id`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${data.access_token}` } }
  );
  const perfiles = await perfilRes.json();
  if (!perfiles[0]) throw new Error("Usuario sin perfil asignado en la base de datos.");

  return { accessToken: data.access_token, perfil: perfiles[0] };
}

async function loginContratista(cuitIngresado, password) {
  const buscar = await fetch(
    `${SUPABASE_URL}/rest/v1/contratistas?cuit=eq.${encodeURIComponent(cuitIngresado)}&select=email,razon_social,estado`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const contratistas = await buscar.json();
  if (!buscar.ok || !contratistas[0]) throw new Error("No encontramos ningún contratista con ese CUIT.");
  if (!contratistas[0].email) throw new Error("Este contratista no tiene un email de acceso configurado.");
  if (contratistas[0].estado === "suspendido") throw new Error("Esta cuenta está suspendida.");

  const data = await loginConEmailYPassword(contratistas[0].email, password);

  const perfilRes = await fetch(
    `${SUPABASE_URL}/rest/v1/perfiles?id=eq.${data.user.id}&select=id,rol,nombre,contratista_id`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${data.access_token}` } }
  );
  const perfiles = await perfilRes.json();
  if (!perfiles[0]) throw new Error("Usuario sin perfil asignado en la base de datos.");

  return { accessToken: data.access_token, perfil: perfiles[0] };
}

function AccessPortal({ onEnter }) {
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("login"); // login | registro (solo contratista)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cuit, setCuit] = useState("");
  const [codigo, setCodigo] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setSelected(null);
    setMode("login");
    setEmail(""); setPassword(""); setCuit(""); setCodigo(""); setRazonSocial("");
    setError(""); setCargando(false);
  };

  const handleIngresar = async () => {
    setError("");
    if (selected === "super_admin") {
      setCargando(true);
      try {
        const sessionData = await loginSuperAdmin(email, password);
        onEnter("super_admin", sessionData);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
      return;
    }

    if (selected === "contratista" && mode === "registro") {
      setCargando(true);
      try {
        if (!codigo || !cuit || !razonSocial || !email || !password) {
          throw new Error("Completá todos los campos para registrarte.");
        }
        await registrarContratista({ codigo, cuit, razonSocial, email, password });
        onEnter("contratista");
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
      return;
    }

    // login de empresa o contratista ya registrados
    if ((selected === "empresa") || (selected === "contratista" && mode === "login")) {
      setCargando(true);
      try {
        if (!cuit || !password) throw new Error("Completá el CUIT y la contraseña.");
        const sessionData =
          selected === "empresa" ? await loginEmpresa(cuit, password) : await loginContratista(cuit, password);
        onEnter(selected, sessionData);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
      return;
    }

    onEnter(selected);
  };

  if (!selected) {
    return (
      <div
        className="min-h-[640px] flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 1px 1px, rgba(44,95,124,0.10) 1px, transparent 0) 0 0/24px 24px, linear-gradient(180deg, #F7F8F6, #EDF0EA)",
        }}
      >
        <div className="max-w-[560px] w-full px-6">
          <div className="flex items-center gap-2.5 justify-center mb-2">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2C5F7C, #1F4358)", boxShadow: "0 4px 10px rgba(44,95,124,0.3)" }}
            >
              <ShieldCheck size={19} color="#fff" />
            </div>
            <span className="text-[19px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#14181C", letterSpacing: "-0.01em" }}>
              ControlDoc <span style={{ color: "#2C5F7C" }}>Pro</span>
            </span>
          </div>
          <p className="text-center text-[13px] mb-8" style={{ color: "#6B7268" }}>
            Gestión documental de contratistas y trabajadores
          </p>

          <div className="flex flex-col gap-2.5">
            {ACCESS_TYPES.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 text-left transition-shadow hover:shadow-sm"
                  style={{ borderColor: "#E2E5E1" }}
                >
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${a.accent}14` }}
                  >
                    <Icon size={20} color={a.accent} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold" style={{ color: "#14181C" }}>
                      {a.label}
                    </div>
                    <div className="text-[12px]" style={{ color: "#9CA39A" }}>
                      {a.desc}
                    </div>
                  </div>
                  <ChevronDown size={15} color="#9CA39A" className="-rotate-90 shrink-0" />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onEnter("guardia")}
            className="flex items-center justify-center gap-2 w-full mt-5 text-[12.5px] font-medium"
            style={{ color: "#6B7268" }}
          >
            <QrCode size={14} /> Soy guardia / control de acceso, ir directo a verificación
          </button>
        </div>
      </div>
    );
  }

  const type = ACCESS_TYPES.find((a) => a.id === selected);
  const Icon = type.icon;

  return (
    <div
      className="min-h-[640px] flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 1px 1px, rgba(44,95,124,0.10) 1px, transparent 0) 0 0/24px 24px, linear-gradient(180deg, #F7F8F6, #EDF0EA)",
      }}
    >
      <div className="max-w-[420px] w-full px-6">
        <button onClick={reset} className="flex items-center gap-1.5 text-[12.5px] font-medium mb-6" style={{ color: "#6B7268" }}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div
          className="rounded-xl border bg-white p-7"
          style={{ borderColor: "#E2E5E1" }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${type.accent}14` }}>
              <Icon size={19} color={type.accent} />
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#14181C" }}>
                {type.label}
              </div>
            </div>
          </div>

          {selected === "contratista" && (
            <div className="flex gap-1 mt-5 mb-5 p-1 rounded-lg" style={{ background: "#F7F8F6" }}>
              {[
                { id: "login", label: "Ya tengo cuenta" },
                { id: "registro", label: "Registrarme" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="flex-1 py-2 rounded-md text-[12.5px] font-medium"
                  style={{
                    background: mode === m.id ? "#fff" : "transparent",
                    color: mode === m.id ? "#14181C" : "#9CA39A",
                    boxShadow: mode === m.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 mt-6">
            {selected === "super_admin" && (
              <>
                <FieldInput icon={UserCog} label="Email" value={email} onChange={setEmail} placeholder="admin@controldocpro.com" />
                <FieldInput icon={Lock} label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              </>
            )}

            {selected === "empresa" && (
              <>
                <FieldInput icon={Building2} label="CUIT o Razón Social" value={cuit} onChange={setCuit} placeholder="30-71234567-8" mono />
                <FieldInput icon={Lock} label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                <p className="text-[11.5px] -mt-1" style={{ color: "#9CA39A" }}>
                  Este usuario y clave te lo entrega el Super Administrador al darte de alta.
                </p>
              </>
            )}

            {selected === "contratista" && mode === "login" && (
              <>
                <FieldInput icon={Building2} label="CUIT" value={cuit} onChange={setCuit} placeholder="30-71234567-8" mono />
                <FieldInput icon={Lock} label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              </>
            )}

            {selected === "contratista" && mode === "registro" && (
              <>
                <FieldInput icon={KeyRound} label="Código de tu empresa contratante" value={codigo} onChange={setCodigo} placeholder="EMP-7K2X9" mono />
                <FieldInput icon={Building2} label="CUIT de tu empresa" value={cuit} onChange={setCuit} placeholder="30-71234567-8" mono />
                <FieldInput icon={FileText} label="Razón Social" value={razonSocial} onChange={setRazonSocial} placeholder="Mi Empresa SRL" />
                <FieldInput icon={UserCog} label="Email de acceso" value={email} onChange={setEmail} placeholder="contacto@miempresa.com" />
                <FieldInput icon={Lock} label="Crear contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                <p className="text-[11.5px] -mt-1" style={{ color: "#9CA39A" }}>
                  El código te lo brinda la empresa para la que vas a trabajar. Sin código válido no podés registrarte.
                </p>
              </>
            )}

            {error && (
              <div className="rounded-lg px-3.5 py-2.5 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleIngresar}
              disabled={cargando}
              className="rounded-lg py-2.5 text-[13px] font-semibold text-white mt-1"
              style={{ background: type.accent, opacity: cargando ? 0.7 : 1 }}
            >
              {cargando
                ? "Verificando..."
                : selected === "contratista" && mode === "registro"
                ? "Crear cuenta y vincularme"
                : "Ingresar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



async function crearEmpresaReal({ accessToken, razonSocial, cuit, rubro, email, password }) {
  // 1. crear el usuario de login para esta empresa
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) throw new Error(signupData.error_description || signupData.msg || "No se pudo crear el usuario de la empresa.");
  const userId = signupData.user?.id || signupData.id;
  if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");

  const codigo = "EMP-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  // 2. crear la fila de la empresa cliente
  const empresaRes = await fetch(`${SUPABASE_URL}/rest/v1/empresas_cliente`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ razon_social: razonSocial, cuit, codigo_vinculacion: codigo, rubro: rubro || null, email }),
  });
  const empresaData = await empresaRes.json();
  if (!empresaRes.ok) throw new Error(empresaData.message || "No se pudo crear la empresa en la base de datos.");
  const empresaId = empresaData[0].id;

  // 3. vincular el usuario a la empresa con un perfil de rol "empresa"
  const perfilRes = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: userId, rol: "empresa", nombre: razonSocial, empresa_cliente_id: empresaId }),
  });
  if (!perfilRes.ok) {
    const perfilErr = await perfilRes.json();
    throw new Error(perfilErr.message || "La empresa se creó, pero no se pudo vincular el perfil de usuario.");
  }

  return { codigo };
}

function EmpresasView({ accessToken }) {
  const [items] = useState(EMPRESAS_CLIENTE);
  const [showNew, setShowNew] = useState(false);
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [rubro, setRubro] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const crearCodigo = async () => {
    setError("");
    if (!accessToken) {
      setError("Esta acción necesita tu sesión real de Super Admin. Volvé a iniciar sesión.");
      return;
    }
    if (!razonSocial || !cuit || !email || !password) {
      setError("Completá Razón Social, CUIT, email y contraseña antes de crear la empresa.");
      return;
    }
    setCargando(true);
    try {
      const { codigo } = await crearEmpresaReal({ accessToken, razonSocial, cuit, rubro, email, password });
      setGenerated(codigo);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="px-8 pb-10">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[12.5px]" style={{ color: "#9CA39A" }}>
          {items.length} empresas dadas de alta en la plataforma
        </p>
        <button
          onClick={() => { setShowNew((s) => !s); setGenerated(null); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "#2C5F7C", color: "#fff" }}
        >
          <Plus size={15} /> Nueva empresa cliente
        </button>
      </div>

      {showNew && (
        <div className="rounded-xl border bg-white p-5 mb-5" style={{ borderColor: "#E2E5E1" }}>
          <h3 className="text-[13.5px] font-semibold mb-4" style={{ color: "#14181C" }}>
            Dar de alta nueva empresa
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FieldInput icon={FileText} label="Razón Social" value={razonSocial} onChange={setRazonSocial} placeholder="Minera del Sur S.A." />
            <FieldInput icon={Building2} label="CUIT" value={cuit} onChange={setCuit} placeholder="30-71234567-8" mono />
            <FieldInput icon={Briefcase} label="Rubro" value={rubro} onChange={setRubro} placeholder="Minería" />
            <FieldInput icon={UserCog} label="Email de acceso" value={email} onChange={setEmail} placeholder="contacto@minerasur.com" />
            <FieldInput icon={Lock} label="Contraseña de acceso" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          </div>

          {error && (
            <div className="mb-3 rounded-lg px-3.5 py-2.5 text-[12px]" style={{ background: "#FBEAE8", color: "#C9483B" }}>
              {error}
            </div>
          )}

          <button
            onClick={crearCodigo}
            disabled={cargando}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: "#14181C", color: "#fff", opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? "Creando empresa..." : "Crear empresa y generar código"}
          </button>

          {generated && (
            <div
              className="mt-4 rounded-lg p-4 flex items-center justify-between"
              style={{ background: "#EAF4ED", border: "1px solid #BFE0CB" }}
            >
              <div>
                <div className="text-[11px] font-medium" style={{ color: "#3F8F5F" }}>
                  ✓ Empresa y usuario creados en la base real. Código único — compartilo con sus contratistas
                </div>
                <div
                  className="text-[18px] font-semibold mt-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#2C5F7C", letterSpacing: "0.05em" }}
                >
                  {generated}
                </div>
              </div>
              <Copy size={16} color="#9CA39A" />
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E2E5E1" }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "#F7F8F6" }}>
              {["Código", "Razón Social", "CUIT", "Rubro", "Contratistas", "Plan", "Estado"].map((h) => (
                <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA39A" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t" style={{ borderColor: "#F0F1EE" }}>
                <td className="px-5 py-3.5 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#2C5F7C", fontWeight: 600 }}>
                  {e.id}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "#14181C" }}>{e.razonSocial}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6B7268" }}>{e.cuit}</td>
                <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>{e.rubro}</td>
                <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>{e.contratistas}</td>
                <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>{e.plan}</td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: STATUS_EMPRESA[e.estado].color, background: STATUS_EMPRESA[e.estado].bg }}
                  >
                    {STATUS_EMPRESA[e.estado].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanesView() {
  const [ciclo, setCiclo] = useState("mensual");

  return (
    <div className="px-8 pb-10">
      <div
        className="rounded-xl border p-4 mb-6 flex items-start gap-3"
        style={{ borderColor: "#E2E5E1", background: "#EAF1F4" }}
      >
        <TrendingUp size={16} color="#2C5F7C" className="mt-0.5 shrink-0" />
        <p className="text-[12.5px]" style={{ color: "#1F4358" }}>
          El plan de cada empresa se asigna según su cantidad de contratistas activos.
          Si una empresa supera el límite de su plan, <strong>sube de categoría automáticamente</strong> en el próximo ciclo de facturación.
        </p>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[14px] font-semibold" style={{ color: "#14181C" }}>
          Escala de precios (USD)
        </h3>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F7F8F6", border: "1px solid #E2E5E1" }}>
          {[
            { id: "mensual", label: "Mensual" },
            { id: "semestral", label: "Semestral" },
            { id: "anual", label: "Anual" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCiclo(c.id)}
              className="px-3.5 py-1.5 rounded-md text-[12.5px] font-medium"
              style={{
                background: ciclo === c.id ? "#fff" : "transparent",
                color: ciclo === c.id ? "#14181C" : "#9CA39A",
                boxShadow: ciclo === c.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {PLANES.map((p) => {
          const { total, label } = precioPorCiclo(p.mensual, ciclo);
          return (
            <div key={p.id} className="rounded-xl border bg-white p-5" style={{ borderColor: "#E2E5E1" }}>
              <div className="text-[12px] font-medium mb-3" style={{ color: "#9CA39A" }}>
                {p.min}–{p.max === Infinity ? "∞" : p.max} contratistas
              </div>
              <div className="text-[15px] font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#14181C" }}>
                {p.nombre}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#2C5F7C" }}>
                  ${total}
                </span>
                <span className="text-[11.5px]" style={{ color: "#9CA39A" }}>{label}</span>
              </div>
              {ciclo !== "mensual" && (
                <div className="text-[11px] mt-1" style={{ color: "#9CA39A" }}>
                  Descuento a definir
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#14181C" }}>
        Plan actual por empresa
      </h3>
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E2E5E1" }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: "#F7F8F6" }}>
              {["Empresa", "Contratistas", "Plan asignado", "Costo (" + ciclo + ")", "Ciclo"].map((h) => (
                <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA39A" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPRESAS_CLIENTE.map((e) => {
              const plan = planPorContratistas(e.contratistas);
              const { total } = precioPorCiclo(plan.mensual, ciclo);
              return (
                <tr key={e.id} className="border-t" style={{ borderColor: "#F0F1EE" }}>
                  <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "#14181C" }}>{e.razonSocial}</td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: "#4B524A" }}>{e.contratistas}</td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ color: "#2C5F7C", fontWeight: 600 }}>{plan.nombre}</td>
                  <td className="px-5 py-3.5 text-[13px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#14181C" }}>${total}</td>
                  <td className="px-5 py-3.5 text-[12.5px] capitalize" style={{ color: "#4B524A" }}>{ciclo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TITLES = {
  dashboard: { title: "Dashboard ejecutivo", subtitle: "Resumen general de cumplimiento documental" },
  empresas: { title: "Empresas clientes", subtitle: "Altas, códigos de vinculación y estado de cuenta" },
  planes: { title: "Planes y facturación", subtitle: "Escala de precios por cantidad de contratistas" },
  contratistas: { title: "Contratistas", subtitle: "Empresas habilitadas y su estado de documentación" },
  documentos: { title: "Documentos", subtitle: "Carga, vencimientos y estado por documento" },
  ats: { title: "ATS — Análisis Preliminar de Tareas", subtitle: "Definí el tipo de contratista y los riesgos de tu tarea" },
  vehiculos: { title: "Vehículos", subtitle: "Documentación de vehículos comunes e industriales" },
  trabajadores: { title: "Trabajadores", subtitle: "Estado documental individual — quién está habilitado a ingresar" },
  reportes: { title: "Reportes", subtitle: "Exportables para auditorías y seguimiento" },
  aprobaciones: { title: "Aprobaciones pendientes", subtitle: "Documentación cargada esperando revisión" },
  accesos: { title: "Control de acceso", subtitle: "Verificación de habilitación en portería" },
};

export default function App() {
  const [role, setRole] = useState(null);
  const [view, setView] = useState("dashboard");
  const [ats, setAts] = useState({ tipo: "empresa", riesgos: [] });
  const [session, setSession] = useState(null); // { accessToken, perfil } — solo se llena en login real

  const selectRole = (r, sessionData) => {
    setRole(r);
    setSession(sessionData || null);
    setView(NAV_BY_ROLE[r][0].id);
  };

  if (!role) return <AccessPortal onEnter={selectRole} />;

  const meta = TITLES[view];

  return (
    <div
      className="flex min-h-[640px]"
      style={{ background: "#F7F8F6", fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar role={role} setRole={setRole} view={view} setView={setView} onLogout={() => { setRole(null); setSession(null); }} />
      <main className="flex-1 overflow-auto">
        <Topbar title={meta?.title} subtitle={meta?.subtitle} />
        {view === "dashboard" && (role === "super_admin" ? <SuperAdminDashboardView /> : <DashboardView />)}
        {view === "empresas" && <EmpresasView accessToken={session?.accessToken} />}
        {view === "planes" && <PlanesView />}
        {view === "contratistas" && <ContratistasView />}
        {view === "documentos" && <DocumentosView role={role} ats={ats} session={session} />}
        {view === "ats" && <ATSView ats={ats} setAts={setAts} />}
        {view === "vehiculos" && <VehiculosView />}
        {view === "trabajadores" && <TrabajadoresView role={role} />}
        {view === "reportes" && <ReportesView />}
        {view === "aprobaciones" && <AprobacionesView session={session} />}
        {view === "accesos" && <AccesosView />}
      </main>
    </div>
  );
}
