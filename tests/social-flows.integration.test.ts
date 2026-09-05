import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "user-1", username: "alice" },
  db: {
    user: { findUnique: vi.fn() },
    blockedUser: { findFirst: vi.fn() },
    follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    followRequest: { upsert: vi.fn(), deleteMany: vi.fn() },
    notification: { create: vi.fn() },
    post: { findUnique: vi.fn(), create: vi.fn() },
    like: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    bookmark: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn(async () => state.user) }));
vi.mock("@/lib/db", () => ({ db: state.db }));
vi.mock("@/lib/config", () => ({
  featureEnabled: vi.fn(async () => true),
  getSetting: vi.fn(async (_key: string, fallback: number) => fallback),
}));

import { POST as createPost } from "@/app/api/posts/route";
import { POST as follow } from "@/app/api/users/[username]/follow/route";
import { POST as like } from "@/app/api/posts/[id]/like/route";
import { POST as bookmark, DELETE as removeBookmark } from "@/app/api/posts/[id]/bookmark/route";

describe("core social flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.db.blockedUser.findFirst.mockResolvedValue(null);
    state.db.follow.findUnique.mockResolvedValue(null);
    state.db.follow.create.mockResolvedValue({ id: "follow-1" });
    state.db.followRequest.upsert.mockResolvedValue({ id: "request-1" });
    state.db.notification.create.mockResolvedValue({ id: "notification-1" });
    state.db.like.findUnique.mockResolvedValue(null);
    state.db.like.create.mockResolvedValue({ id: "like-1" });
    state.db.bookmark.upsert.mockResolvedValue({ id: "bookmark-1" });
    state.db.bookmark.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("creates a public post with the authenticated author", async () => {
    state.db.post.create.mockResolvedValue({ id: "post-1", authorId: "user-1", content: "Hello" });

    const response = await createPost(new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      post: { id: "post-1", authorId: "user-1", content: "Hello" },
    });
    expect(state.db.post.create).toHaveBeenCalledWith({
      data: { authorId: "user-1", content: "Hello", visibility: "PUBLIC" },
    });
  });

  it("follows a public user and creates a follow notification", async () => {
    state.db.user.findUnique.mockResolvedValue({ id: "user-2", username: "bob", profile: { isPrivate: false } });

    const response = await follow(new Request("http://localhost/api/users/bob/follow"), {
      params: Promise.resolve({ username: "bob" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ following: true });
    expect(state.db.follow.create).toHaveBeenCalledWith({ data: { followerId: "user-1", followingId: "user-2" } });
    expect(state.db.notification.create).toHaveBeenCalledWith({
      data: { userId: "user-2", actorId: "user-1", type: "FOLLOW" },
    });
  });

  it("creates a follow request for a private user instead of an immediate follow", async () => {
    state.db.user.findUnique.mockResolvedValue({ id: "user-2", username: "bob", profile: { isPrivate: true } });

    const response = await follow(new Request("http://localhost/api/users/bob/follow"), {
      params: Promise.resolve({ username: "bob" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ following: false, requested: true });
    expect(state.db.follow.create).not.toHaveBeenCalled();
    expect(state.db.followRequest.upsert).toHaveBeenCalled();
    expect(state.db.notification.create).toHaveBeenCalledWith({
      data: { userId: "user-2", actorId: "user-1", type: "FOLLOW_REQUEST" },
    });
  });

  it("rejects a follow when either user has blocked the other", async () => {
    state.db.user.findUnique.mockResolvedValue({ id: "user-2", username: "bob", profile: { isPrivate: false } });
    state.db.blockedUser.findFirst.mockResolvedValue({ id: "block-1" });

    const response = await follow(new Request("http://localhost/api/users/bob/follow"), {
      params: Promise.resolve({ username: "bob" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Follow unavailable" });
    expect(state.db.follow.create).not.toHaveBeenCalled();
    expect(state.db.followRequest.upsert).not.toHaveBeenCalled();
  });

  it("toggles a like and notifies the post author only when creating it", async () => {
    state.db.post.findUnique.mockResolvedValue({ id: "post-1", authorId: "user-2", deletedAt: null });

    let response = await like(new Request("http://localhost/api/posts/post-1/like"), {
      params: Promise.resolve({ id: "post-1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ liked: true });
    expect(state.db.like.create).toHaveBeenCalledWith({ data: { userId: "user-1", postId: "post-1" } });
    expect(state.db.notification.create).toHaveBeenCalledWith({
      data: { userId: "user-2", actorId: "user-1", type: "LIKE", entityId: "post-1" },
    });

    state.db.like.findUnique.mockResolvedValue({ id: "like-1" });
    response = await like(new Request("http://localhost/api/posts/post-1/like"), {
      params: Promise.resolve({ id: "post-1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ liked: false });
    expect(state.db.like.delete).toHaveBeenCalledWith({ where: { id: "like-1" } });
  });

  it("does not create a like on a deleted post", async () => {
    state.db.post.findUnique.mockResolvedValue({ id: "post-1", authorId: "user-2", deletedAt: new Date() });

    const response = await like(new Request("http://localhost/api/posts/post-1/like"), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(404);
    expect(state.db.like.create).not.toHaveBeenCalled();
  });

  it("bookmarks an existing post and removes the bookmark", async () => {
    state.db.post.findUnique.mockResolvedValue({ id: "post-1", deletedAt: null });

    let response = await bookmark(new Request("http://localhost/api/posts/post-1/bookmark"), {
      params: Promise.resolve({ id: "post-1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ bookmarked: true });
    expect(state.db.bookmark.upsert).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-1", postId: "post-1" } },
      create: { userId: "user-1", postId: "post-1" },
      update: {},
    });

    response = await removeBookmark(new Request("http://localhost/api/posts/post-1/bookmark"), {
      params: Promise.resolve({ id: "post-1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ bookmarked: false });
    expect(state.db.bookmark.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1", postId: "post-1" } });
  });
});
