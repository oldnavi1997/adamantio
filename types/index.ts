import { Product, ProductSize, Order, OrderItem, User, Address, Payment } from "@/app/generated/prisma/client";
import type { Variante } from "@/lib/variantes";

export type ProductWithCategory = Product;

/// El producto tal como lo necesita la ficha: con sus filas de talla, que son
/// las que saben cuánto queda de cada una.
export type ProductConTallas = Product & { tallas?: ProductSize[] };

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product | null;
  })[];
  user?: User | null;
  address?: Address | null;
  payments?: Payment[];
};

export type CartItem = {
  id: string;
  cartKey?: string;
  // Qué mitad de un anillo de pareja es esta línea. Ausente en los productos
  // normales y en las líneas guardadas antes de que existiera la opción, que
  // el servidor resuelve como la pareja completa.
  variante?: Variante;
  name: string;
  price: number;
  image?: string;
  imageUrl?: string;
  quantity: number;
  stock: number;
  size?: string;
  engravingText?: string;
  testMode?: boolean;
  freeShipping?: boolean;
};

export type WishlistItem = {
  id: string;
  // Para armar el enlace desde el cajón sin volver a consultar la base.
  // Opcional: las listas guardadas antes del slug no lo traen.
  slug?: string | null;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
  sizes?: string[];
};

export type ShippingFormData = {
  email: string;
  firstName: string;
  lastName: string;
  documentType: "DNI" | "CE";
  documentNumber: string;
  phone: string;
  street: string;
  department: string;
  province: string;
  district: string;
  postalCode: string;
  courier: "shalom" | "olva" | "tienda";
};
