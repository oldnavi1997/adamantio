import { Product, Order, OrderItem, User, Address, Payment } from "@/app/generated/prisma/client";

export type ProductWithCategory = Product;

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
