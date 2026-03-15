export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type Order = {
  id: string;
  name: string;
  initials: string;
  color: string;
  date: string;
  time: string;
  status: "en_attente" | "confirmee" | "livraison" | "livree" | "annulee";
  items: OrderItem[];
};

export const ORDERS: Order[] = [
  {
    id: "o1", name: "Ibrahim Traoré", initials: "IT", color: "#60A5FA",
    date: "13 mars 2026", time: "09:42", status: "en_attente",
    items: [
      { id:"i1", name:"Tissu wax 6 yards",   qty:10, unit:"carton",  unitPrice:15000, total:150000 },
      { id:"i2", name:"Fil à coudre blanc",  qty:5,  unit:"bobine",  unitPrice:1500,  total:7500   },
      { id:"i3", name:"Boutons dorés",       qty:3,  unit:"sachet",  unitPrice:2500,  total:7500   },
      { id:"i4", name:"Frais de livraison",  qty:1,  unit:"forfait", unitPrice:20000, total:20000  },
    ],
  },
  {
    id: "o2", name: "Aïssatou Ba", initials: "AB", color: "#A855F7",
    date: "13 mars 2026", time: "08:17", status: "en_attente",
    items: [
      { id:"i1", name:"Huile de palme 20L",  qty:5,  unit:"jerrican",unitPrice:10000, total:50000  },
      { id:"i2", name:"Frais de transport",  qty:1,  unit:"forfait", unitPrice:12500, total:12500  },
    ],
  },
  {
    id: "o3", name: "Mariam Coulibaly", initials: "MC", color: "#E879F9",
    date: "12 mars 2026", time: "17:55", status: "confirmee",
    items: [
      { id:"i1", name:"Riz long grain 50kg", qty:3,  unit:"sac",     unitPrice:13000, total:39000  },
      { id:"i2", name:"Emballage carton",    qty:3,  unit:"pièce",   unitPrice:1000,  total:3000   },
      { id:"i3", name:"Frais de livraison",  qty:1,  unit:"forfait", unitPrice:3000,  total:3000   },
    ],
  },
  {
    id: "o4", name: "Mamadou Diallo", initials: "MD", color: "#F59E0B",
    date: "12 mars 2026", time: "14:30", status: "livraison",
    items: [
      { id:"i1", name:"Téléphone Android 4G",qty:2,  unit:"pièce",   unitPrice:55000, total:110000 },
      { id:"i2", name:"Coque protection",    qty:2,  unit:"pièce",   unitPrice:2000,  total:4000   },
      { id:"i3", name:"Chargeur USB-C",      qty:2,  unit:"pièce",   unitPrice:1500,  total:3000   },
      { id:"i4", name:"Frais de transport",  qty:1,  unit:"forfait", unitPrice:3000,  total:3000   },
    ],
  },
  {
    id: "o5", name: "Kofi Mensah", initials: "KM", color: "#22D3EE",
    date: "11 mars 2026", time: "11:20", status: "confirmee",
    items: [
      { id:"i1", name:"Chaussures sport lot",qty:1,  unit:"lot 12pcs",unitPrice:90000,total:90000  },
      { id:"i2", name:"Boîtes à chaussures", qty:12, unit:"pièce",   unitPrice:500,   total:6000   },
    ],
  },
  {
    id: "o6", name: "Fatou Konaté", initials: "FK", color: "#34D399",
    date: "11 mars 2026", time: "09:05", status: "livree",
    items: [
      { id:"i1", name:"Savon de Marseille",  qty:2,  unit:"carton",  unitPrice:7500,  total:15000  },
      { id:"i2", name:"Frais de livraison",  qty:1,  unit:"forfait", unitPrice:3000,  total:3000   },
    ],
  },
  {
    id: "o7", name: "Awa Balde", initials: "AB", color: "#F472B6",
    date: "10 mars 2026", time: "16:48", status: "livree",
    items: [
      { id:"i1", name:"Électronique mixte",  qty:1,  unit:"palette", unitPrice:500000,total:500000 },
      { id:"i2", name:"Assurance transport", qty:1,  unit:"forfait", unitPrice:25000, total:25000  },
      { id:"i3", name:"Dédouanement",        qty:1,  unit:"forfait", unitPrice:15000, total:15000  },
    ],
  },
  {
    id: "o8", name: "Oumar Sow", initials: "OS", color: "#FB923C",
    date: "09 mars 2026", time: "13:10", status: "annulee",
    items: [
      { id:"i1", name:"Farine de blé 25kg",  qty:4,  unit:"sac",     unitPrice:7000,  total:28000  },
      { id:"i2", name:"Frais de livraison",  qty:1,  unit:"forfait", unitPrice:4000,  total:4000   },
    ],
  },
];
