"use client";

import { useState, useCallback } from "react";
import { Lock } from "lucide-react";
import { ReviewDashboard } from "./ReviewDashboard";

export function ReviewApp() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = useCallback(async () => {
    setError("");
    const res = await fetch("/api/review?filter=unreviewed", {
      headers: { "x-review-password": password },
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setError("パスワードが違います");
    }
  }, [password]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={20} className="text-gray-400" />
            <h1 className="text-lg font-bold text-gray-800">プレイス精査</h1>
          </div>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return <ReviewDashboard password={password} />;
}
