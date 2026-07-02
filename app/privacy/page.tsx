import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

      <section className="mb-6 text-gray-700">
        <h2 className="text-xl font-semibold mt-4">1. Information We Collect</h2>
        <p>We collect personal information such as your name, email, phone number, shipping address, and payment details solely for processing orders and providing services.</p>

        <h2 className="text-xl font-semibold mt-4">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside">
          <li>To confirm and deliver your orders</li>
          <li>To provide customer support</li>
          <li>To improve your shopping experience</li>
          <li>To comply with legal requirements</li>
        </ul>

        <h2 className="text-xl font-semibold mt-4">3. Data Protection</h2>
        <p>We implement appropriate technical and administrative measures to protect your data. Your personal information will never be sold or shared with third parties, except with trusted service providers (e.g., courier partners, payment gateways) or when legally required.</p>

        <h2 className="text-xl font-semibold mt-4">4. Cookies</h2>
        <p>Our website uses cookies to enhance your browsing experience. You may disable cookies in your browser settings if you prefer.</p>

        <h2 className="text-xl font-semibold mt-4">5. Your Rights</h2>
        <p>You have the right to access, update, or request deletion of your personal information. For assistance, please contact us at the support contact listed on the site.</p>
      </section>

      <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
    </main>
  );
}
