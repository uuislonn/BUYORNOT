"use client";
import { useState, useTransition } from "react";
import { logout } from "../actions";
import s from "../login/login.module.css";
export function LogoutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className={className ?? s.submit}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await logout();
            setMessage(result.message);
          })
        }
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
