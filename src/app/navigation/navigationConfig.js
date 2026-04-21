import {
  BarChart3,
  ContactRound,
  Package2,
  PanelsTopLeft,
  ReceiptText,
  Ticket,
  UserCog,
  Workflow,
} from "lucide-react";

export const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  ticket_wallet: "Tiquetera",
};

export const NAV_ITEMS = [
  {
    id: "salon",
    label: "Salon",
    icon: PanelsTopLeft,
    section: "Operacion",
    description: "Mesas, ocupacion y flujo del salon.",
  },
  {
    id: "pos",
    label: "Punto de venta",
    icon: ReceiptText,
    section: "Operacion",
    description: "Toma pedidos y registra pagos.",
  },
  {
    id: "inventory",
    label: "Productos",
    icon: Package2,
    section: "Catalogo",
    description: "Carta comercial y productos vendidos.",
  },
  {
    id: "resources",
    label: "Recursos",
    icon: Workflow,
    section: "Catalogo",
    description: "Insumos, compras, proveedores y recetas.",
  },
  {
    id: "ticketing",
    label: "Ticketeras",
    icon: Ticket,
    section: "Control",
    description: "Planes prepagos y consumo por cliente.",
  },
  {
    id: "clients",
    label: "Clientes",
    icon: ContactRound,
    section: "Control",
    description: "Base de clientes y seguimiento comercial.",
  },
  {
    id: "finance",
    label: "Caja y finanzas",
    icon: BarChart3,
    section: "Control",
    description: "Caja, cierres, cartera e historial.",
  },
  {
    id: "account",
    label: "Cuenta",
    icon: UserCog,
    section: "Configuracion",
    description: "Datos del negocio y del administrador.",
  },
];

const MOBILE_NAV_IDS = ["salon", "pos", "resources", "finance", "account"];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => MOBILE_NAV_IDS.includes(item.id));

export const SECTION_META = NAV_ITEMS.reduce((accumulator, item) => {
  accumulator[item.id] = {
    title: item.label,
    description: item.description,
  };
  return accumulator;
}, {});

export const SECTION_GUIDANCE = {
  salon: {
    promise: "Ve la operacion mesa por mesa y detecta rapido que requiere accion.",
    workflow: "Revisa estado, abre pedido, da seguimiento y cobra sin perder contexto.",
  },
  pos: {
    promise: "Cobra rapido y con menos errores, incluso cuando el cliente paga en efectivo.",
    workflow: "Busca, agrega, cobra y confirma el cierre con una sola lectura clara.",
  },
  inventory: {
    promise: "Mantiene el catalogo listo para vender sin mezclarlo con tareas de abastecimiento.",
    workflow: "Actualiza productos, valida margen y conecta cada venta con su costo real.",
  },
  resources: {
    promise: "Convierte compras, insumos y recetas en decisiones de rentabilidad.",
    workflow: "Registra compras, revisa alertas y ajusta costo antes de tocar precios.",
  },
  ticketing: {
    promise: "Vende recurrencia y controla el saldo prepago sin perder trazabilidad.",
    workflow: "Crea planes, asigna saldo y revisa redenciones desde un solo flujo.",
  },
  clients: {
    promise: "Prioriza clientes valiosos, deuda pendiente y frecuencia de compra.",
    workflow: "Filtra, consulta historial y actua sobre oportunidades comerciales reales.",
  },
  finance: {
    promise: "Convierte la caja en una vista ejecutiva del negocio, no solo en un reporte.",
    workflow: "Mide resultado, revisa cartera y cierra la jornada con contexto financiero.",
  },
  account: {
    promise: "Mantiene identidad, responsables y datos del negocio en orden.",
    workflow: "Ajusta configuracion clave sin salir del entorno operativo.",
  },
};
