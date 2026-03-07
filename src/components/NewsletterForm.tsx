"use client";

export default function NewsletterForm() {
  return (
    <form
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="メールアドレス"
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-400"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-white text-ocean-900 font-semibold rounded-xl hover:bg-ocean-100 transition-colors"
      >
        登録する
      </button>
    </form>
  );
}
