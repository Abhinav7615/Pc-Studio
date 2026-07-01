import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4 text-gray-700">
        We value your privacy. This page contains our privacy policy and explains
        how we collect, use, and protect your information. Replace this placeholder
        with the actual privacy policy content used by your site.
      </p>
      <section className="prose mb-6">
        <h2>Data We Collect</h2>
        <p>We may collect personal and non-personal information needed to provide our services.</p>

        <h2>How We Use Data</h2>
        <p>Data is used to operate the website, improve services, and for communication.</p>

        <h2>Contact</h2>
        <p>If you have questions, please contact our support team.</p>
      </section>

      <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
    </main>
  );
}
