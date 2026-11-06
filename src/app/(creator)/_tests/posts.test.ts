import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  queue: [] as { data: unknown; error: unknown }[],
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
}));
vi.mock("../../../lib/auth/server", () => ({
  authClient: async () => ({
    auth: { getUser: mock.getUser },
    from: mock.from,
  }),
}));
import { savePost, memberProfile, requirePostContext } from "../_server/posts";
import type { RequestInput } from "../_lib/types";
const input: RequestInput = {
  creatorId: "seoa",
  productUrl: "https://www.musinsa.com/products/90000009",
  productName: "회원 상품",
  productImage: "https://image.msscdn.net/test.jpg",
  brand: "TEST",
  price: 10000,
  category: "의류",
  concern: "저한테 어울릴까요?",
  tags: [],
  bodySpec: {},
};
const row = {
  id: "real-post",
  author_id: "owner",
  author_name: "작성자",
  creator_id: "seoa",
  product: {
    url: input.productUrl,
    name: input.productName,
    image: input.productImage,
    brand: input.brand,
    price: input.price,
    category: input.category,
    currency: "KRW",
  },
  concern: input.concern,
  tags: [],
  body_spec: {},
  status: "ING",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString().replace("Z", "456+00:00"),
};
beforeEach(() => {
  vi.resetAllMocks();
  mock.queue = [];
  mock.getUser.mockResolvedValue({
    data: {
      user: {
        id: "owner",
        user_metadata: { nickname: "작성자", role: "ADMIN" },
      },
    },
    error: null,
  });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: mock.eq.mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: mock.insert.mockReturnThis(),
    update: mock.update.mockReturnThis(),
    delete: mock.delete.mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(mock.queue.shift() ?? { data: [], error: null }).then(
        resolve,
      ),
  };
  mock.from.mockReturnValue(query);
});
describe("persistent member posts", () => {
  it("accepts only administrator metadata for creator accounts", () => {
    expect(
      memberProfile({
        id: "test",
        user_metadata: { role: "CREATOR", buyornot_role: "CREATOR" },
      }).role,
    ).toBe("USER");
    expect(
      memberProfile({
        id: "test",
        user_metadata: {},
        app_metadata: { buyornot_role: "CREATOR" },
      }).role,
    ).toBe("CREATOR");
    expect(
      memberProfile({
        id: "test",
        user_metadata: {},
        app_metadata: { buyornot_role: "ADMIN" },
      }).role,
    ).toBe("USER");
  });

  it("requires verified auth before touching the database", async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requirePostContext("seoa")).rejects.toThrow("로그인");
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("uses the verified author ID and never inserts user-supplied roles or timestamps", async () => {
    mock.queue.push({ data: [], error: null }, { data: null, error: null });
    await savePost("create", "seoa", {
      ...input,
      author_id: "attacker",
      role: "ADMIN",
    } as RequestInput);
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: "owner",
        author_name: "작성자",
        creator_id: "seoa",
      }),
    );
    expect(mock.insert.mock.calls[0][0]).not.toHaveProperty("role");
    expect(mock.insert.mock.calls[0][0]).not.toHaveProperty("created_at");
  });
  it("does not save invalid product URLs", async () => {
    await expect(
      savePost("create", "seoa", {
        ...input,
        productUrl: "javascript:alert(1)",
      }),
    ).rejects.toThrow();
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("rejects another user's edits and deletion before any write", async () => {
    mock.queue.push(
      { data: [{ ...row, author_id: "someone-else" }], error: null },
      { data: [{ ...row, author_id: "someone-else" }], error: null },
    );
    await expect(savePost("update", "seoa", input, row.id)).rejects.toThrow(
      "본인",
    );
    await expect(savePost("delete", "seoa", undefined, row.id)).rejects.toThrow(
      "본인",
    );
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.delete).not.toHaveBeenCalled();
  });
  it("uses optimistic concurrency and reports a lost edit", async () => {
    mock.queue.push({ data: [row], error: null }, { data: [], error: null });
    await expect(
      savePost("update", "seoa", { ...input, concern: "수정한 고민" }, row.id),
    ).rejects.toThrow("변경");
    expect(mock.eq).toHaveBeenCalledWith("author_id", "owner");
    expect(mock.eq).toHaveBeenCalledWith("updated_at", row.updated_at);
  });
  it("does not turn storage errors into successful empty snapshots", async () => {
    mock.queue.push({ data: null, error: { code: "42P01" } });
    await expect(requirePostContext("seoa")).rejects.toThrow("저장소");
  });
  it("supports Kakao display names without accepting role claims", () => {
    expect(
      memberProfile({
        id: "owner",
        user_metadata: { full_name: "카카오닉네임", role: "ADMIN" },
      }),
    ).toMatchObject({
      nickname: "카카오닉네임",
      role: "USER",
      verified: false,
    });
  });
});
