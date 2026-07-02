import Link from 'next/link';

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Terms &amp; Conditions</h1>

      <section className="mb-6 text-gray-700">
        <h2 className="text-xl font-semibold mt-4">1. General</h2>
        <p>By accessing and using this website, you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use of the website.</p>

        <h2 className="text-xl font-semibold mt-4">2. Products &amp; Pricing</h2>
        <p>All product descriptions, images, and prices are subject to change without prior notice. Prices are displayed in Indian Rupees (INR) unless otherwise stated. We reserve the right to modify or discontinue products at any time.</p>

        <h2 className="text-xl font-semibold mt-4">3. Orders &amp; Payments</h2>
        <p>Orders are confirmed only after payment is successfully processed. Payments must be made through secure and authorized payment gateways. We reserve the right to cancel any order in case of payment issues, stock unavailability, or suspected fraudulent activity.</p>

        <h2 className="text-xl font-semibold mt-4">4. Shipping &amp; Delivery</h2>
        <p>We aim to deliver products within the estimated time frame; however, delays may occur due to unforeseen circumstances. Delivery charges, if applicable, will be displayed at checkout. Risk of loss passes to the customer upon delivery of the product.</p>

        <h2 className="text-xl font-semibold mt-4">5. Returns &amp; Refunds</h2>
        <p>Customers may request a return or refund within 7 days of delivery if the product is defective, damaged, or not as described. Products must be returned in their original packaging and condition. Refunds will be processed to the original payment method within 7–10 business days after approval.</p>

        <h2 className="text-xl font-semibold mt-4">6. Limitation of Liability</h2>
        <p>[Your Company Name] shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or products purchased. We do not guarantee uninterrupted or error‑free operation of the website.</p>

        <h2 className="text-xl font-semibold mt-4">7. Intellectual Property</h2>
        <p>All content, including text, images, logos, and designs, are the property of [Your Company Name] and may not be used without prior written consent.</p>

        <h2 className="text-xl font-semibold mt-4">8. Governing Law</h2>
        <p>These Terms &amp; Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in [Your City].</p>

        <h2 className="text-xl font-semibold mt-4">9. Contact Information</h2>
        <p>For any queries regarding these Terms &amp; Conditions, please contact us at: <br/>Email: <a href="mailto:shopotpmain@gmail.com" className="text-blue-600">shopotpmain@gmail.com</a></p>
      </section>

      <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
    </main>
  );
}
