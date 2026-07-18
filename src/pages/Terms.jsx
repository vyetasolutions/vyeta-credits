import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui.jsx";

const EFFECTIVE = "1 January 2025";

export default function Terms() {
  return (
    <div className="min-h-screen px-5 py-12 max-w-2xl mx-auto">
      <Link to="/login" className="text-xs text-violet-400 mb-6 inline-block">← Back</Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-mint-500/20 flex items-center justify-center shrink-0">
          <div className="h-3 w-3 rounded-full bg-mint-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-100">Terms of Service</h1>
          <p className="text-xs text-ink-500 mt-0.5">Effective {EFFECTIVE} · Vyeta Digital Solutions</p>
        </div>
      </div>

      <div className="space-y-5 text-sm text-ink-300 leading-relaxed">
        <Section title="1. About Vyeta Credits">
          Vyeta Credits is an internal digital credits platform operated by <strong className="text-ink-100">Vyeta Digital Solutions</strong>, a technology company registered in Zambia. The platform enables authorised users to hold, transfer, and use credits to access Vyeta services. Vyeta Credits is a closed-loop simulation system: credits are not legal tender, have no monetary value outside the platform, and cannot be exchanged for real Zambian Kwacha (ZMW) or any other currency. Any ZMW figures displayed are indicative reference values only.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years of age and a person authorised by Vyeta Digital Solutions to access and use the platform. By creating an account you represent that you meet these requirements. Corporate entities may register on behalf of their authorised representatives.
        </Section>

        <Section title="3. Account Registration">
          You agree to provide accurate, current, and complete information during registration and to keep your account details up to date. You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account. You must notify us immediately at <strong className="text-ink-100">info@vyeta.co.zm</strong> if you suspect unauthorised access to your account.
        </Section>

        <Section title="4. Credits — Nature and Use">
          <ul className="list-disc pl-4 space-y-1.5 mt-2">
            <li>Credits are granted by Vyeta Digital Solutions and have value only within the Vyeta Credits platform.</li>
            <li>Credits may be used to pay for Vyeta services (such as SwifTrade subscriptions, IT Retainer packages, and Mobility passes) as listed in the platform service catalog.</li>
            <li>Credits are non-refundable, non-transferable to external parties, and expire if your account is terminated.</li>
            <li>Vyeta Digital Solutions reserves the right to adjust credit balances for error correction, fraud prevention, or administrative purposes, with notice where reasonably practicable.</li>
            <li>No negative balances are permitted. Transfers and purchases that would reduce a balance below zero are automatically declined.</li>
          </ul>
        </Section>

        <Section title="5. Prohibited Conduct">
          You agree not to: (a) use the platform for any unlawful purpose or in violation of Zambian law; (b) attempt to circumvent any security measures; (c) use automated tools to access the platform without authorisation; (d) misrepresent your identity or impersonate another user; (e) engage in any conduct that disrupts or interferes with the platform's operation.
        </Section>

        <Section title="6. Service Subscriptions">
          When you subscribe to a Vyeta service using credits, the subscription period (monthly or annual) begins on the date of purchase. Subscriptions do not auto-renew — you will be prompted to renew manually when the period ends. No credits are refunded for unused subscription periods following a voluntary cancellation.
        </Section>

        <Section title="7. Account Suspension and Termination">
          Vyeta Digital Solutions may suspend or terminate your account at any time, without prior notice, if we reasonably believe you have violated these Terms. On termination, any remaining credits in your account are forfeited. You may also request deletion of your account by contacting us.
        </Section>

        <Section title="8. Limitation of Liability">
          To the fullest extent permitted by applicable Zambian law, Vyeta Digital Solutions is not liable for any indirect, incidental, or consequential loss arising from your use of the platform. The platform is provided on an "as is" basis. We do not guarantee uninterrupted or error-free operation.
        </Section>

        <Section title="9. Amendments">
          We may update these Terms at any time. We will provide reasonable notice of material changes via the platform or by email. Continued use of the platform after changes take effect constitutes acceptance of the revised Terms.
        </Section>

        <Section title="10. Governing Law">
          These Terms are governed by and construed in accordance with the laws of the Republic of Zambia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Zambia.
        </Section>

        <Section title="11. Contact">
          Questions about these Terms should be directed to:<br />
          <strong className="text-ink-100">Vyeta Digital Solutions</strong><br />
          Lusaka, Zambia<br />
          Email: <strong className="text-ink-100">info@vyeta.co.zm</strong>
        </Section>
      </div>

      <div className="mt-8 pt-6 border-t border-base-700 text-xs text-ink-700 text-center">
        <Link to="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>
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
