import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export default async function Page() {
  await dbConnect();
  const settings = await BusinessSettings.findOne().lean() || { termsAndConditions: '' };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Terms &amp; Conditions</h1>

      <section className="mb-6 text-gray-700">
        {settings.termsAndConditions ? (
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: settings.termsAndConditions }} />
        ) : (
          <p>Terms and conditions content has not been configured yet. Please update it from the admin settings.</p>
        )}
      </section>

      <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
    </main>
  );
}
