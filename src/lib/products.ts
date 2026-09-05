import { withStore, readOnly, type Product, type ProductCategory, type ProductSize } from "./store";

export class ProductError extends Error {}

function genId(): string {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const VALID_CATEGORIES: ProductCategory[] = ["new-materials", "international-hall"];
const DEFAULT_SIZE_LABELS = ["S", "M", "L", "XL", "2XL", "3XL"];

export async function listProducts(): Promise<Product[]> {
  return readOnly((s) => s.products);
}

export async function listProductsByCategory(category: ProductCategory): Promise<Product[]> {
  return readOnly((s) => s.products.filter((p) => p.category === category));
}

function normalizeSizesInput(input: unknown): ProductSize[] {
  if (!Array.isArray(input)) {
    return DEFAULT_SIZE_LABELS.map((label) => ({ label, initialStock: 0, currentStock: 0 }));
  }
  return input.map((raw) => {
    const label = typeof raw?.label === "string" ? raw.label.trim() : "";
    const initialStock = Number(raw?.initialStock ?? raw?.currentStock ?? 0);
    const currentStock = Number(raw?.currentStock ?? raw?.initialStock ?? 0);
    if (!label) throw new ProductError("사이즈 이름을 입력해주세요.");
    if (!Number.isFinite(initialStock) || initialStock < 0 || !Number.isFinite(currentStock) || currentStock < 0) {
      throw new ProductError("사이즈별 재고는 0 이상의 숫자여야 합니다.");
    }
    return { label, initialStock, currentStock };
  });
}

export type CreateProductInput = {
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  hasSizes?: boolean;
  sizes?: { label: string; initialStock: number }[];
  initialStock?: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
};

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const price = Number(input.price);
  const cost = Number(input.cost);
  const category = input.category;
  const hasSizes = Boolean(input.hasSizes);

  if (!name) throw new ProductError("상품명을 입력해주세요.");
  if (!VALID_CATEGORIES.includes(category)) throw new ProductError("담당 사이트를 선택해주세요.");
  if (!Number.isFinite(price) || price < 0) throw new ProductError("판매가는 0 이상의 숫자여야 합니다.");
  if (!Number.isFinite(cost) || cost < 0) throw new ProductError("원가는 0 이상의 숫자여야 합니다.");

  let sizes: ProductSize[] = [];
  let initialStock = 0;
  if (hasSizes) {
    sizes = normalizeSizesInput(
      input.sizes?.map((s) => ({ label: s.label, initialStock: s.initialStock, currentStock: s.initialStock }))
    );
  } else {
    initialStock = Number(input.initialStock);
    if (!Number.isFinite(initialStock) || initialStock < 0) {
      throw new ProductError("초기 재고는 0 이상의 숫자여야 합니다.");
    }
  }

  return withStore((store) => {
    const product: Product = {
      id: genId(),
      name,
      category,
      price,
      cost,
      hasSizes,
      sizes,
      initialStock: hasSizes ? 0 : initialStock,
      currentStock: hasSizes ? 0 : initialStock,
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
    if (patch.category !== undefined) {
      if (!VALID_CATEGORIES.includes(patch.category)) throw new ProductError("담당 사이트를 선택해주세요.");
      product.category = patch.category;
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
    if (patch.hasSizes !== undefined) {
      product.hasSizes = Boolean(patch.hasSizes);
      if (!product.hasSizes) {
        product.sizes = [];
      } else if (product.sizes.length === 0) {
        product.sizes = DEFAULT_SIZE_LABELS.map((label) => ({ label, initialStock: 0, currentStock: 0 }));
      }
    }
    if (patch.sizes !== undefined) {
      product.sizes = normalizeSizesInput(patch.sizes);
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
