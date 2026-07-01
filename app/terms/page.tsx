import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="mb-4 text-gray-700">
        These Terms and Conditions govern your use of our website. Replace this
        placeholder with the site's official terms to reflect your legal requirements.
      </p>

      <section className="prose mb-6">
        <h2>Acceptance of Terms</h2>
        <p>By using this site you agree to the terms laid out in this document.</p>

        <h2>Accountability</h2>
        <p>Users are responsible for keeping their account details secure.</p>
      </section>

      <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
    </main>
  );
}
