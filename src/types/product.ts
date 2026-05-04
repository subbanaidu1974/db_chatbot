export interface SupplierInfo {
  name: string;
  contact: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  categoryId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  supplierInfo: SupplierInfo;
  dimensions: Dimensions;
  weight: number;
  weightUnit: string;
  colorOptions: string[];
  materialType: string;
  images: string[];
  discountPercentage: number;
  status: 'active' | 'discontinued';
  isFeatured: boolean;
  minOrderQuantity: number;
  returnPolicy: string;
  reviews: Review[];
  relatedProducts: string[]; // IDs of related products
}
