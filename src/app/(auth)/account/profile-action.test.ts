import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("../../../lib/auth/server", () => ({
  authClient: async () => ({
    auth: { getUser: mock.getUser, updateUser: mock.updateUser },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidatePath }));
import { updateNickname } from "./profile-action";
beforeEach(() => vi.resetAllMocks());
describe("profile nickname update", () => {
  it("rejects invalid input before contacting the service", async () => {
    expect((await updateNickname(" ")).ok).toBe(false);
    expect((await updateNickname("a".repeat(21))).ok).toBe(false);
    expect(mock.getUser).not.toHaveBeenCalled();
  });
  it("requires a server verified logged in user", async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await updateNickname("새이름")).ok).toBe(false);
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("updates only nickname metadata and revalidates the page", async () => {
    mock.getUser.mockResolvedValue({
      data: { user: { id: "owner" } },
      error: null,
    });
    mock.updateUser.mockResolvedValue({ error: null });
    expect(await updateNickname(" 새이름 ")).toMatchObject({
      ok: true,
      nickname: "새이름",
    });
    expect(mock.updateUser).toHaveBeenCalledWith({
      data: { nickname: "새이름" },
    });
    expect(mock.revalidatePath).toHaveBeenCalledWith("/account");
  });
  it("keeps provider errors private", async () => {
    mock.getUser.mockResolvedValue({
      data: { user: { id: "owner" } },
      error: null,
    });
    mock.updateUser.mockResolvedValue({ error: { message: "secret detail" } });
    const result = await updateNickname("새이름");
    expect(result.ok).toBe(false);
    expect(result.message).not.toContain("secret detail");
    expect(mock.revalidatePath).not.toHaveBeenCalled();
  });
});
