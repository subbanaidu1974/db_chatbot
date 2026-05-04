import { Product } from '../types/product';

export const sampleProducts: Product[] = [
  {
    id: "PROD-001",
    name: "ErgoFlow Office Chair",
    description: "A premium ergonomic office chair designed for long hours of comfort. Features lumbar support and breathable mesh.",
    price: 299.99,
    stockQuantity: 45,
    category: "Office Furniture",
    categoryId: "CAT-OFF-01",
    tags: ["ergonomic", "chair", "office", "comfort"],
    createdAt: "2024-01-15T08:30:00Z",
    updatedAt: "2024-05-01T10:00:00Z",
    supplierInfo: {
      name: "OfficeLux Systems",
      contact: "sales@officelux.com"
    },
    dimensions: {
      length: 65,
      width: 70,
      height: 120,
      unit: "cm"
    },
    weight: 15.5,
    weightUnit: "kg",
    colorOptions: ["Midnight Black", "Slate Gray", "Navy Blue"],
    materialType: "Mesh/Recycled Plastic",
    images: ["https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=800"],
    discountPercentage: 10,
    status: 'active',
    isFeatured: true,
    minOrderQuantity: 1,
    returnPolicy: "30-day money-back guarantee",
    reviews: [
      { id: "REV-001", userId: "USER-123", rating: 5, comment: "Best chair I've ever owned!", date: "2024-02-10" },
      { id: "REV-002", userId: "USER-456", rating: 4, comment: "Very comfortable, but assembly took a while.", date: "2024-03-05" }
    ],
    relatedProducts: ["PROD-002", "PROD-005"]
  },
  {
    id: "PROD-002",
    name: "LuminoDesk Pro",
    description: "Height-adjustable standing desk with built-in wireless charging and cable management system.",
    price: 549.50,
    stockQuantity: 20,
    category: "Office Furniture",
    categoryId: "CAT-OFF-01",
    tags: ["standing desk", "office", "tech", "furniture"],
    createdAt: "2023-11-20T14:45:00Z",
    updatedAt: "2024-04-12T09:15:00Z",
    supplierInfo: {
      name: "DeskDynamics",
      contact: "support@deskdynamics.io"
    },
    dimensions: {
      length: 140,
      width: 75,
      height: 72,
      unit: "cm"
    },
    weight: 35,
    weightUnit: "kg",
    colorOptions: ["Natural Oak", "Walnut", "White"],
    materialType: "Solid Wood/Steel",
    images: ["https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800"],
    discountPercentage: 0,
    status: 'active',
    isFeatured: true,
    minOrderQuantity: 1,
    returnPolicy: "60-day trial period",
    reviews: [
      { id: "REV-003", userId: "USER-789", rating: 5, comment: "Switching between sitting and standing is so smooth.", date: "2024-01-20" }
    ],
    relatedProducts: ["PROD-001"]
  },
  {
    id: "PROD-003",
    name: "Aura Noise-Cancelling Headphones",
    description: "High-fidelity audio with active noise cancellation and 40-hour battery life.",
    price: 199.00,
    stockQuantity: 150,
    category: "Electronics",
    categoryId: "CAT-ELEC-05",
    tags: ["audio", "headphones", "wireless", "music"],
    createdAt: "2024-02-10T11:00:00Z",
    updatedAt: "2024-05-02T16:30:00Z",
    supplierInfo: {
      name: "SonicTech",
      contact: "orders@sonictech.com"
    },
    dimensions: {
      length: 18,
      width: 15,
      height: 8,
      unit: "cm"
    },
    weight: 0.25,
    weightUnit: "kg",
    colorOptions: ["Matte Black", "Silver"],
    materialType: "Aluminum/Synthetic Leather",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800"],
    discountPercentage: 15,
    status: 'active',
    isFeatured: false,
    minOrderQuantity: 1,
    returnPolicy: "15-day return policy",
    reviews: [],
    relatedProducts: ["PROD-004"]
  }
];
