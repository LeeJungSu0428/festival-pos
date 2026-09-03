import { withStore, readOnly, type Product } from "./store";

export class ProductError extends Error {}

function genId(): string {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function listProducts(): Promise<Product[]> {
  return readOnly((s) => s.products);
}

export type CreateProductInput = {
  name: string;
  price: number;
  cost: number;
  initialStock: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
};

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const price = Number(input.price);
  const cost = Number(input.cost);
  const initialStock = Number(input.initialStock);

  if (!name) throw new ProductError("상품명을 입력해주세요.");
  if (!Number.isFinite(price) || price < 0) throw new ProductError("판매가는 0 이상의 숫자여야 합니다.");
  if (!Number.isFinite(cost) || cost < 0) throw new ProductError("원가는 0 이상의 숫자여야 합니다.");
  if (!Number.isFinite(initialStock) || initialStock < 0) {
    throw new ProductError("초기 재고는 0 이상의 숫자여야 합니다.");
  }

  return withStore((store) => {
    const product: Product = {
      id: genId(),
      name,
      price,
      cost,
      initialStock,
      currentStock: initialStock,
      lowStockThreshold: Number.isFinite(Number(input.lowStockThreshold))
        ? Number(input.lowStockThreshold)
        : 10,
      imageUrl: input.imageUrl || null,
      active: true,
    };
    store.products.push(product);
    return product;
  });
}

export type UpdateProductInput = Partial<Omit<Product, "id">>;

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<Product> {
  return withStore((store) => {
    const product = store.products.find((p) => p.id === id);
    if (!product) throw new ProductError("상품을 찾을 수 없습니다.");

    if (patch.name !== undefined) {
      const name = String(patch.name).trim();
      if (!name) throw new ProductError("상품명을 입력해주세요.");
      product.name = name;
    }
    if (patch.price !== undefined) {
      const price = Number(patch.price);
      if (!Number.isFinite(price) || price < 0) throw new ProductError("판매가는 0 이상의 숫자여야 합니다.");
      product.price = price;
    }
    if (patch.cost !== undefined) {
      const cost = Number(patch.cost);
      if (!Number.isFinite(cost) || cost < 0) throw new ProductError("원가는 0 이상의 숫자여야 합니다.");
      product.cost = cost;
    }
    if (patch.initialStock !== undefined) {
      const initialStock = Number(patch.initialStock);
      if (!Number.isFinite(initialStock) || initialStock < 0) {
        throw new ProductError("초기 재고는 0 이상의 숫자여야 합니다.");
      }
      product.initialStock = initialStock;
    }
    if (patch.currentStock !== undefined) {
      const currentStock = Number(patch.currentStock);
      if (!Number.isFinite(currentStock) || currentStock < 0) {
        throw new ProductError("현재 재고는 0 이상의 숫자여야 합니다.");
      }
      product.currentStock = currentStock;
    }
    if (patch.lowStockThreshold !== undefined) {
      const lowStockThreshold = Number(patch.lowStockThreshold);
      if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
        throw new ProductError("재고 부족 기준은 0 이상의 숫자여야 합니다.");
      }
      product.lowStockThreshold = lowStockThreshold;
    }
    if (patch.imageUrl !== undefined) {
      product.imageUrl = patch.imageUrl || null;
    }
    if (patch.active !== undefined) {
      product.active = Boolean(patch.active);
    }

    return product;
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return withStore((store) => {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new ProductError("상품을 찾을 수 없습니다.");
    store.products.splice(idx, 1);
  });
}
