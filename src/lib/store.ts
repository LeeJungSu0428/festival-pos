import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  initialStock: number;
  currentStock: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  active: boolean;
};

export type OrderItem = {
  productId: string;
  name: string;
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
};

export type GoodsViewerSize = {
  label: string;
  available: boolean;
};

export type GoodsViewerState = {
  imageUrl: string | null;
  sizes: GoodsViewerSize[];
};

export type Store = {
  products: Product[];
  orders: Order[];
  nextOrderNumber: number;
  goodsViewer: GoodsViewerState;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE: Store = {
  products: [
    {
      id: "p1",
      name: "야구 유니폼",
      price: 38000,
      cost: 25000,
      initialStock: 100,
      currentStock: 100,
      lowStockThreshold: 20,
      imageUrl: null,
      active: true,
    },
    {
      id: "p2",
      name: "축구 유니폼",
      price: 36000,
      cost: 23000,
      initialStock: 100,
      currentStock: 100,
      lowStockThreshold: 20,
      imageUrl: null,
      active: true,
    },
    {
      id: "p3",
      name: "키캡",
      price: 7000,
      cost: 4000,
      initialStock: 100,
      currentStock: 100,
      lowStockThreshold: 20,
      imageUrl: null,
      active: true,
    },
  ],
  orders: [],
  nextOrderNumber: 1001,
  goodsViewer: {
    imageUrl: null,
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"].map((label) => ({ label, available: true })),
  },
};

// 기존에 저장된 데이터(goodsViewer 필드가 없던 버전)를 읽어도 에러 없이 동작하도록
// 누락된 필드가 있으면 기본값을 채워준다.
function normalizeStore(store: Store): Store {
  if (!store.goodsViewer) {
    store.goodsViewer = JSON.parse(JSON.stringify(DEFAULT_STORE.goodsViewer));
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

/** 읽기 전용 조회. */
export async function readOnly<T>(fn: (store: Store) => T): Promise<T> {
  const store = redis ? await readStoreFromRedis() : await readStoreFromDisk();
  return fn(store);
}
