import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600 text-center max-w-md">
        That path is not defined in this app. Start the admin app from{' '}
        <code className="text-sm bg-gray-200 px-1 rounded">admin-portal</code> (or run{' '}
        <code className="text-sm bg-gray-200 px-1 rounded">npm run dev</code> from the repo root).
      </p>
      <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
        If port 3000 was busy, Next.js may be on 3001+—use the URL shown in the terminal.
      </p>
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <Link href="/login" className="text-red-600 font-medium hover:underline">
          Sign in
        </Link>
        <Link href="/dashboard" className="text-red-600 font-medium hover:underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
