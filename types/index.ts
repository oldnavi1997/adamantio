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
  courier: "shalom" | "olva";
};
