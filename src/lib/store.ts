import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

export type ProductCategory = "new-materials" | "international-hall";

export type ProductSize = {
  label: string;
  initialStock: number;
  currentStock: number;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  hasSizes: boolean;
  sizes: ProductSize[]; // hasSizes가 false면 빈 배열, true면 사이즈별 재고
  initialStock: number; // hasSizes가 false일 때만 사용
  currentStock: number; // hasSizes가 false일 때만 사용
  lowStockThreshold: number;
  imageUrl: string | null;
  active: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
  size: string | null; // 사이즈가 있는 상품이면 어떤 사이즈를 팔았는지 기록
  qty: number;
  price: number;
  cost: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  createdAt: string; // ISO string
  status: "completed" | "cancelled";
  items: OrderItem[];
  total: number;
  totalCost: number;
  cancelledAt?: string;
  buyerName: string;
  buyerPhone: string;
  managerName: string;
};

// 굿즈 뷰어에서 손님이 "확인"까지 누른 주문 기록.
// 실제 재고(Product)에는 절대 영향을 주지 않고, 신소재/국제관 관리자가 참고해서
// 각자 사이트에서 수동으로 실제 판매를 입력할 때 참고하는 용도.
export type GoodsOrderLine = {
  productId: string;
  name: string;
  size: string | null;
  qty: number;
  price: number;
};

export type GoodsOrder = {
  id: string;
  category: ProductCategory;
  createdAt: string;
  lines: GoodsOrderLine[];
  total: number;
};

export type GoodsViewerState = {
  bankInfo: string;
  orders: GoodsOrder[];
};

export type Store = {
  products: Product[];
  orders: Order[];
  nextOrderNumber: number;
  goodsViewer: GoodsViewerState;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function sizeStockSet(stock: number): ProductSize[] {
  return ["S", "M", "L", "XL", "2XL", "3XL"].map((label) => ({
    label,
    initialStock: stock,
    currentStock: stock,
  }));
}

const DEFAULT_STORE: Store = {
  products: [
    {
      id: "p1",
      name: "야구 유니폼",
      category: "new-materials",
      price: 40000,
      cost: 31000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/baseball-uniform.png",
      active: true,
    },
    {
      id: "p2",
      name: "축구 유니폼",
      category: "international-hall",
      price: 36000,
      cost: 21000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/soccer-uniform.png",
      active: true,
    },
    {
      id: "p3",
      name: "애한제티1-면",
      category: "new-materials",
      price: 18000,
      cost: 8000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/tshirt-1.png",
      active: true,
    },
    {
      id: "p4",
      name: "애한제티1-기능성",
      category: "international-hall",
      price: 22000,
      cost: 8000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/tshirt-1.png",
      active: true,
    },
    {
      id: "p9",
      name: "애한제티2-면",
      category: "new-materials",
      price: 18000,
      cost: 8000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/tshirt-2.png",
      active: true,
    },
    {
      id: "p10",
      name: "애한제티2-기능성",
      category: "international-hall",
      price: 22000,
      cost: 8000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/tshirt-2.png",
      active: true,
    },
    {
      id: "p5",
      name: "애한제티3-면",
      category: "new-materials",
      price: 18000,
      cost: 8000,
      hasSizes: true,
      sizes: sizeStockSet(20),
      initialStock: 0,
      currentStock: 0,
      lowStockThreshold: 5,
      imageUrl: "/goods/tshirt-3.png",
      active: true,
    },
    {
      id: "p7",
      name: "타투 스티커",
      category: "international-hall",
      price: 4000,
      cost: 1000,
      hasSizes: false,
      sizes: [],
      initialStock: 100,
      currentStock: 100,
      lowStockThreshold: 20,
      imageUrl: "/goods/tattoo-sticker.png",
      active: true,
    },
    {
      id: "p8",
      name: "슬로건 카드",
      category: "new-materials",
      price: 7000,
      cost: 3000,
      hasSizes: false,
      sizes: [],
      initialStock: 100,
      currentStock: 100,
      lowStockThreshold: 20,
      imageUrl: "/goods/slogan-card.png",
      active: true,
    },
    {
      id: "p11",
      name: "반다나",
      category: "new-materials",
      price: 6000,
      cost: 1900,
      hasSizes: false,
      sizes: [],
      initialStock: 50,
      currentStock: 50,
      lowStockThreshold: 10,
      imageUrl: "/goods/bandana.png",
      active: true,
    },
  ],
  orders: [],
  nextOrderNumber: 1001,
  goodsViewer: {
    bankInfo: "신한 110-494-381011",
    orders: [],
  },
};

// 기존에 저장된 데이터(새 필드가 없던 버전)를 읽어도 에러 없이 동작하도록
// 누락된 필드가 있으면 기본값을 채워준다.
function normalizeStore(store: Store): Store {
  if (!store.goodsViewer) {
    store.goodsViewer = JSON.parse(JSON.stringify(DEFAULT_STORE.goodsViewer));
  }
  if (!Array.isArray(store.goodsViewer.orders)) {
    store.goodsViewer.orders = [];
  }
  if (!store.goodsViewer.bankInfo) {
    store.goodsViewer.bankInfo = DEFAULT_STORE.goodsViewer.bankInfo;
  }
  for (const product of store.products as (Product & { hasSizes?: boolean; sizes?: unknown })[]) {
    if (!product.category) {
      product.category = "new-materials";
    }
    if (typeof product.hasSizes !== "boolean") {
      product.hasSizes = false;
    }
    if (!Array.isArray(product.sizes)) {
      product.sizes = [];
    }
  }
  for (const order of store.orders as (Order & Partial<Order> & { sellerName?: string; sellerPhone?: string })[]) {
    if (typeof order.buyerName !== "string") order.buyerName = order.sellerName ?? "";
    if (typeof order.buyerPhone !== "string") order.buyerPhone = order.sellerPhone ?? "";
    if (typeof order.managerName !== "string") order.managerName = "";
  }
  return store;
}

// ── Redis(Upstash) 연동: Vercel Marketplace에서 Redis 통합을 추가하면
// KV_REST_API_URL / KV_REST_API_TOKEN (또는 UPSTASH_REDIS_REST_URL / _TOKEN)이
// 자동으로 환경변수에 주입된다. 이 값이 있으면 파일 대신 Redis를 사용한다.
// 로컬 개발 환경처럼 이 값이 없으면 기존 방식대로 로컬 JSON 파일을 사용한다.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const REDIS_STORE_KEY = "festival-pos:store";
const REDIS_LOCK_KEY = "festival-pos:lock";

async function readStoreFromRedis(): Promise<Store> {
  const existing = await redis!.get<Store>(REDIS_STORE_KEY);
  if (existing) return normalizeStore(existing);
  await redis!.set(REDIS_STORE_KEY, DEFAULT_STORE);
  return JSON.parse(JSON.stringify(DEFAULT_STORE));
}

async function writeStoreToRedis(store: Store): Promise<void> {
  await redis!.set(REDIS_STORE_KEY, store);
}

// Vercel의 서버리스 함수들은 서로 다른 인스턴스에서 동시에 실행될 수 있어서
// (로컬 파일 버전처럼) 같은 프로세스 안의 큐만으로는 동시 쓰기를 막을 수 없다.
// 그래서 Redis에 짧은 잠금(lock)을 걸어 "읽기 → 수정 → 쓰기"가 겹치지 않게 한다.
async function acquireRedisLock(): Promise<string> {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const acquired = await redis!.set(REDIS_LOCK_KEY, token, { nx: true, px: 8000 });
    if (acquired) return token;
    await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120));
  }
  throw new Error("서버가 바쁩니다. 잠시 후 다시 시도해주세요.");
}

async function releaseRedisLock(token: string): Promise<void> {
  const current = await redis!.get<string>(REDIS_LOCK_KEY);
  if (current === token) {
    await redis!.del(REDIS_LOCK_KEY);
  }
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
  }
}

async function readStoreFromDisk(): Promise<Store> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return normalizeStore(JSON.parse(raw) as Store);
}

async function writeStoreToDisk(store: Store): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// 같은 Node 프로세스 안에서 들어오는 쓰기 요청들을 순서대로 처리해서
// 동시에 여러 요청이 들어와도 재고/주문 데이터가 서로 덮어써지지 않도록 한다.
// (여러 프로세스로 분산 배포하는 경우에는 별도의 DB로 교체가 필요하다. README 참고)
let writeQueue: Promise<unknown> = Promise.resolve();

/** 스토어를 읽고, 콜백 안에서 직접 값을 변경(mutate)한 뒤 그 결과를 저장한다. */
export function withStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  if (redis) {
    return (async () => {
      const lockToken = await acquireRedisLock();
      try {
        const store = await readStoreFromRedis();
        const result = await fn(store); // 여기서 던진 에러는 저장 없이 그대로 위로 전파된다.
        await writeStoreToRedis(store);
        return result;
      } finally {
        await releaseRedisLock(lockToken);
      }
    })();
  }

  const run = writeQueue.then(async () => {
    const store = await readStoreFromDisk();
    const result = await fn(store);
    await writeStoreToDisk(store);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/** 저장된 데이터를 전부 지운다. 다음 조회 때 DEFAULT_STORE로 다시 초기화된다. */
export async function resetStore(): Promise<void> {
  if (redis) {
    await redis.del(REDIS_STORE_KEY);
    return;
  }
  await fs.rm(DATA_FILE, { force: true });
}

/** 읽기 전용 조회. */
export async function readOnly<T>(fn: (store: Store) => T): Promise<T> {
  const store = redis ? await readStoreFromRedis() : await readStoreFromDisk();
  return fn(store);
}
