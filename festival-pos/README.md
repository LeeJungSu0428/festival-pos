# 축제 판매 시스템 (Festival POS)

일반 관리자(판매 전용) / 슈퍼관리자(전체 관리) 2단계 권한으로 나뉜 축제 현장 판매 시스템입니다.

## 빠른 시작

```bash
npm install
cp .env.local.example .env.local   # 비밀번호/시크릿 값을 원하는 대로 수정
npm run dev
```

`http://localhost:3000` 접속 → 로그인 화면에서 비밀번호 입력.

- 기본 일반 관리자 비밀번호: `관리자` → 판매 화면(`/pos`)
- 기본 슈퍼관리자 비밀번호: `슈퍼관리자` → 전체 관리 시스템(`/super-admin`)

비밀번호와 세션 서명 키는 `.env.local`에서 바꿀 수 있습니다 (`.env.local.example` 참고). **실제 축제에서 쓰기 전에 `SESSION_SECRET`은 꼭 바꿔주세요.**

## 권한 구조

| 기능 | 일반 관리자 | 슈퍼관리자 |
| --- | :---: | :---: |
| 판매 / 상품 +,- / 결제금액 확인 / 판매완료 | O | O |
| 현재 재고 확인 | O | O |
| 주문 취소(방금 완료한 판매 취소) | O | O |
| 재고 직접 수정, 초기 재고 수정 | X | O |
| 상품 가격/원가 수정, 상품 추가·삭제 | X | O |
| 전체 판매 기록 조회/검색 | X | O |
| 총 매출/원가/순수익, 통계·그래프 | X | O |
| CSV 다운로드 | X | O |

권한 검증은 **서버 미들웨어(`src/middleware.ts`)에서** 쿠키에 서명된 세션 값을 검증하는 방식으로 이루어집니다. 프론트엔드에서 화면만 숨기는 게 아니라, 일반 관리자가 `/super-admin`이나 관련 API 주소를 직접 입력해도 서버가 401/403으로 차단하고, 페이지는 `/login`으로 리다이렉트됩니다.

## 핵심 동작

- **재고 차감 시점**: POS 화면에서 +/-는 화면(장바구니)에만 반영되고, "판매 완료" 버튼을 눌러 주문이 생성되는 순간에만 실제 재고가 차감됩니다.
- **주문 취소**: 취소 시 해당 주문에 포함된 수량만큼 재고가 자동으로 복구되고, 주문 상태가 `cancelled`로 바뀌어 이후 모든 매출/원가/순수익 집계에서 제외됩니다.
- **순수익**: 상품마다 저장된 판매가/원가를 기준으로 `매출 - 원가`로 계산하며, 취소된 주문은 계산에서 제외됩니다. 주문 항목에는 판매 당시의 가격/원가가 스냅샷으로 저장되므로, 이후 상품의 가격/원가를 바꾸거나 상품을 삭제해도 과거 판매 기록의 숫자는 바뀌지 않습니다.

## 데이터 저장 방식

로컬 개발 시에는 별도 DB 설치 없이 `data/store.json` 파일에 상품/주문 데이터를 저장합니다 (첫 실행 시 자동 생성, 야구 유니폼/축구 유니폼/키캡 샘플 상품 포함).

**Vercel에 배포하면 자동으로 Redis(Upstash)를 쓰도록 되어 있습니다.** `src/lib/store.ts`가 `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel Marketplace의 Redis 통합을 연결하면 자동으로 주입됨) 환경변수가 있는지 확인해서, 있으면 Redis를, 없으면 로컬 파일을 사용합니다. Redis 경로에서는 서로 다른 서버리스 인스턴스가 동시에 써도 재고가 꼬이지 않도록 짧은 분산 잠금(lock)을 걸어 순서대로 처리합니다. 아래 "Vercel에 배포하기" 참고.

## Vercel에 배포하기

1. **GitHub에 올리기** — 이 프로젝트 폴더를 GitHub 저장소로 push 합니다.
2. **Vercel에서 Import** — [vercel.com](https://vercel.com) → New Project → 방금 만든 저장소 선택 → Import (Framework는 Next.js로 자동 인식됩니다).
3. **Storage 연결(중요)** — 프로젝트의 **Storage** 탭 → **Marketplace** 에서 **Upstash** (또는 다른 Redis 제공자)의 **Redis** 통합을 설치하고 이 프로젝트에 Connect 합니다. 이렇게 하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 자동으로 추가됩니다. *(이 단계를 건너뛰면 로컬 파일 저장 방식으로 fallback 되는데, Vercel에서는 파일이 요청마다 초기화되어 데이터가 저장되지 않습니다.)*
4. **환경변수 설정** — 프로젝트 **Settings → Environment Variables**에서 다음을 추가:
   - `ADMIN_PASSWORD` = 원하는 일반 관리자 비밀번호 (기본값 `관리자`)
   - `SUPER_ADMIN_PASSWORD` = 원하는 슈퍼관리자 비밀번호 (기본값 `슈퍼관리자`)
   - `SESSION_SECRET` = 임의의 긴 랜덤 문자열 (세션 서명용, 꼭 설정하세요)
5. **Deploy** — Deploy 버튼을 누르면 빌드 후 `https://프로젝트이름.vercel.app` 주소가 생성됩니다.
6. **확인** — 배포된 주소로 접속해서 두 비밀번호로 각각 로그인이 되는지, 판매 → 재고 차감 → 대시보드 반영까지 정상 동작하는지 확인합니다.

이후 코드를 수정하고 GitHub에 다시 push 하면 Vercel이 자동으로 재배포합니다.

## 프로젝트 구조

```
src/
  middleware.ts              서버 측 권한 검증 (일반관리자/슈퍼관리자)
  lib/
    session.ts                로그인 세션 생성/검증 (서명된 쿠키)
    store.ts                  JSON 파일 기반 저장소 + 쓰기 큐
    products.ts                상품 생성/수정/삭제
    orders.ts                  주문 생성(재고 차감)/취소(재고 복구)
    stats.ts                   대시보드 통계 계산
  app/
    login/                     로그인 화면
    pos/                       일반 관리자 판매 화면
    super-admin/
      layout.tsx                슈퍼관리자 메뉴 + 서버 측 재검증
      page.tsx                  Dashboard
      inventory/                Inventory (재고/가격/원가 수정)
      products/                 Products (상품 추가/비활성화/삭제)
      sales-history/            Sales History (검색/취소/CSV)
    api/
      auth/login, auth/logout
      products, products/[id]
      orders, orders/[id]/cancel
      stats
```

## 상품 이미지에 대해

지금 버전은 이미지를 별도 업로드 없이 **이미지 URL 입력**으로 관리합니다 (Inventory/Products 화면의 "이미지 URL" 필드). 실제 파일 업로드가 필요하면 별도 스토리지(S3, Cloudinary 등) 연동이 추가로 필요합니다.

## 참고

- 이 코드는 네트워크가 차단된 샌드박스 환경에서 작성되어 `npm install` / 빌드 검증을 직접 실행해보지 못했습니다. 실제 사용 전에 `npm install && npm run build`로 한 번 확인해주세요.
- Node.js 20 이상을 권장합니다 (세션 서명에 Web Crypto 전역 객체를 사용합니다).
