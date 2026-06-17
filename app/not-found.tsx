import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="mt-4 text-xl text-slate-400">Page not found</p>
      <Link
        href="/ru"
        className="mt-8 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-white hover:from-blue-500 hover:to-violet-500"
      >
        Go to homepage
      </Link>
    </div>
  );
}
