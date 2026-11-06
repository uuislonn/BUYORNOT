import {
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Choice, Post } from "./types";

export interface CommunitySnapshot {
  version: 1;
  posts: Post[];
  votes: [string, Choice][];
}
export interface CommunityPersistence {
  read(): CommunitySnapshot | null;
  write(snapshot: CommunitySnapshot): void;
}

// Local single-server storage. Never place this directory under public/.
export class FileCommunityPersistence implements CommunityPersistence {
  constructor(private readonly path: string) {}
  read(): CommunitySnapshot | null {
    let contents: string;
    try {
      contents = readFileSync(this.path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw new Error(
        "저장된 게시글을 읽지 못했습니다. 서버 저장 폴더를 확인해 주세요.",
      );
    }
    try {
      const data = JSON.parse(contents) as CommunitySnapshot;
      if (
        data.version !== 1 ||
        !Array.isArray(data.posts) ||
        !Array.isArray(data.votes) ||
        data.posts.some(
          (post) =>
            !post ||
            typeof post.id !== "string" ||
            typeof post.authorId !== "string" ||
            !post.product ||
            typeof post.concern !== "string",
        ) ||
        data.votes.some(
          (vote) =>
            !Array.isArray(vote) ||
            typeof vote[0] !== "string" ||
            !["BUY", "NOT"].includes(vote[1]),
        )
      )
        throw new Error();
      return data;
    } catch {
      throw new Error(
        "게시글 저장 파일을 확인해 주세요. 기존 데이터는 덮어쓰지 않았습니다.",
      );
    }
  }
  write(snapshot: CommunitySnapshot): void {
    const temporary = `${this.path}.${randomUUID()}.tmp`;
    try {
      mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
      writeFileSync(temporary, JSON.stringify(snapshot), {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx",
      });
      renameSync(temporary, this.path);
    } catch {
      try {
        unlinkSync(temporary);
      } catch {
        /* No temporary file to remove. */
      }
      throw new Error(
        "게시글을 저장하지 못했습니다. 서버 저장 공간을 확인하고 다시 시도해 주세요.",
      );
    }
  }
}
