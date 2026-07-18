import React from "react";
import { Link } from "react-router-dom";

const EFFECTIVE = "1 January 2025";

export default function Privacy() {
  return (
    <div className="min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <Link to="/login" className="text-xs text-violet-400 mb-6 inline-block">← Back</Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-violet-400" strokeWidth="1.8">
            <path d="M12 3.5 5 6v6c0 4 3 7 7 8.5C16 19 19 16 19 12V6l-7-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-100">Privacy Policy</h1>
          <p className="text-xs text-ink-500 mt-0.5">Effective {EFFECTIVE} · Vyeta Digital Solutions</p>
        </div>
      </div>

      <div className="space-y-5 text-sm text-ink-300 leading-relaxed">
        <Section title="1. Overview">
          Vyeta Digital Solutions ("we", "us", "our") is committed to protecting your personal information in accordance with the <strong className="text-ink-100">Data Protection Act No. 3 of 2021 of Zambia</strong> ("the Act"). This Privacy Policy explains what personal data we collect through the Vyeta Credits platform, how we use it, and the rights you have in relation to it.
        </Section>

        <Section title="2. Data We Collect">
          <p className="mb-2">When you use Vyeta Credits, we collect the following categories of personal data:</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li><strong className="text-ink-100">Account data:</strong> full name, email address, account creation date.</li>
            <li><strong className="text-ink-100">Transaction data:</strong> credit transfers (sender, receiver, amount, timestamp, fee, status).</li>
            <li><strong className="text-ink-100">Subscription data:</strong> which Vyeta services you have subscribed to and the subscription period.</li>
            <li><strong className="text-ink-100">Usage data:</strong> login events and session activity, collected automatically by our authentication provider (Supabase).</li>
          </ul>
          <p className="mt-2">We do not collect financial data such as bank account numbers, mobile money PINs, or payment card details. Vyeta Credits is not a payment service.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          We use your personal data to:
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>Create and manage your Vyeta Credits account.</li>
            <li>Process credit transfers and service subscriptions.</li>
            <li>Maintain an accurate and auditable transaction ledger.</li>
            <li>Provide administrative functions including support and dispute resolution.</li>
            <li>Comply with our legal obligations under Zambian law.</li>
            <li>Detect and prevent fraud or unauthorised access.</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing">
          We process your personal data on the basis of: (a) the performance of a contract — to provide you with the Vyeta Credits service; (b) compliance with a legal obligation; and (c) our legitimate interests in operating a secure and functional platform, where these do not override your rights.
        </Section>

        <Section title="5. Data Sharing">
          We do not sell your personal data. We do not share your data with third parties for marketing purposes. Data may be shared in the following limited circumstances:
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li><strong className="text-ink-100">Service providers:</strong> We use Supabase (infrastructure), which processes data on our behalf under a data processing agreement. Supabase stores data in secure cloud infrastructure.</li>
            <li><strong className="text-ink-100">Legal requirements:</strong> We may disclose data where required by Zambian law, court order, or a lawful request from a regulatory authority.</li>
            <li><strong className="text-ink-100">Business transfer:</strong> In the event of a merger or acquisition, data may transfer to the successor entity, which will be bound by this Policy.</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          We retain your account and transaction data for as long as your account is active and for a period of five (5) years after account closure, as required for audit and legal compliance purposes under Zambian law. You may request earlier deletion subject to legal retention requirements.
        </Section>

        <Section title="7. Your Rights Under the Data Protection Act 2021">
          Under the Zambia Data Protection Act 2021, you have the right to:
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li><strong className="text-ink-100">Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong className="text-ink-100">Correction</strong> — request that inaccurate or incomplete data be corrected.</li>
            <li><strong className="text-ink-100">Deletion</strong> — request deletion of your data, subject to legal retention obligations.</li>
            <li><strong className="text-ink-100">Restriction</strong> — request that processing of your data be restricted in certain circumstances.</li>
            <li><strong className="text-ink-100">Objection</strong> — object to processing based on legitimate interests.</li>
            <li><strong className="text-ink-100">Portability</strong> — receive your data in a structured, machine-readable format.</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us at <strong className="text-ink-100">info@vyeta.co.zm</strong>. We will respond within 30 days. You may also lodge a complaint with the <strong className="text-ink-100">Zambia Information and Communications Technology Authority (ZICTA)</strong>, which serves as the data protection supervisory authority in Zambia.</p>
        </Section>

        <Section title="8. Security">
          We implement technical and organisational measures to protect your personal data against unauthorised access, disclosure, or loss. These include encrypted connections (HTTPS), database-level row security (RLS), and role-based access controls. No system is completely secure; in the event of a data breach affecting your rights, we will notify you as required by the Act.
        </Section>

        <Section title="9. Cookies and Tracking">
          The Vyeta Credits platform uses session storage for authentication purposes only. We do not use advertising cookies or third-party tracking scripts.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time to reflect changes in our practices or Zambian law. We will notify you of material changes via the platform or by email. The effective date at the top of this document will always reflect the current version.
        </Section>

        <Section title="11. Contact Us">
          <strong className="text-ink-100">Data Controller:</strong> Vyeta Digital Solutions<br />
          Lusaka, Zambia<br />
          Email: <strong className="text-ink-100">info@vyeta.co.zm</strong>
        </Section>
      </div>

      <div className="mt-8 pt-6 border-t border-base-700 text-xs text-ink-700 text-center">
        <Link to="/terms" className="text-violet-400 hover:text-violet-300">Terms of Service</Link>
        {" · "}
        <Link to="/login" className="text-violet-400 hover:text-violet-300">Back to sign in</Link>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-sm font-semibold text-ink-100 mb-2">{title}</h2>
      <div className="text-ink-300">{children}</div>
    </div>
  );
}
