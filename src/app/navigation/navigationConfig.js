import {
  BarChart3,
  Compass,
  Landmark,
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
    label: "Insumos y costos",
    icon: Workflow,
    section: "Catalogo",
    description: "Compras, insumos, costeo y control de inventario.",
  },
  {
    id: "ticketing",
    label: "Clientes y Ticketeras",
    icon: Ticket,
    section: "Control",
    description: "Clientes recurrentes, planes prepagos y consumo por saldo.",
  },
  {
    id: "cash",
    label: "Caja",
    icon: ReceiptText,
    section: "Control",
    description: "Turno, movimientos, recaudo y cierres.",
  },
  {
    id: "finance",
    label: "Finanzas",
    icon: Landmark,
    section: "Control",
    description: "Cartera, proveedores, gastos y rentabilidad.",
  },
  {
    id: "guide",
    label: "Guia de uso",
    icon: Compass,
    section: "Configuracion",
    description: "Aprende por donde empezar y como usar el sistema paso a paso.",
  },
  {
    id: "account",
    label: "Cuenta",
    icon: UserCog,
    section: "Configuracion",
    description: "Datos del negocio y del administrador.",
  },
];

const MOBILE_NAV_IDS = ["salon", "pos", "resources", "cash", "account"];

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
    promise: "Vende recurrencia y controla almuerzos prepagos sin perder trazabilidad.",
    workflow: "Registra clientes, vende planes, consume saldo y audita correcciones desde un solo flujo.",
  },
  cash: {
    promise: "Controla el turno, los medios de pago y el arqueo sin mezclarlo con deuda o rentabilidad.",
    workflow: "Abre caja, revisa el dinero real, registra egresos y cierra con diferencia calculada.",
  },
  finance: {
    promise: "Entiende utilidad diaria, obligaciones y margen sin confundirlo con el arqueo de caja.",
    workflow: "Revisa ingresos, egresos, cartera, proveedores y utilidad estimada para decidir mejor.",
  },
  account: {
    promise: "Mantiene identidad, responsables y datos del negocio en orden.",
    workflow: "Ajusta configuracion clave sin salir del entorno operativo.",
  },
  guide: {
    promise: "Empieza con orden y evita cargar datos en el modulo equivocado.",
    workflow: "Sigue la ruta sugerida para configurar, costear, vender y cerrar mejor.",
  },
};
