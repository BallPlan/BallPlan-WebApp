import { Link } from 'react-router-dom';
import LegalPageLayout, { LegalSection } from '../components/LegalPageLayout';

export default function Privacy() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="September 15, 2026">
      <LegalSection title="1. Introduction">
        <p>
          This Privacy Policy explains how BallPlan ("BallPlan," "we," "us," or "our") collects, uses, discloses,
          and protects your personal information when you use our website and related services (the "Service"). It
          is written to comply with the Nigeria Data Protection Act, 2023 ("NDPA") and its implementing regulations.
          By using the Service, you acknowledge the practices described here. This policy should be read alongside
          our{' '}
          <Link to="/terms" className="font-semibold text-brand hover:text-brand-dark">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We collect information in the following ways:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-ink dark:text-white">Account information</span> — the email address
            and password you provide when you sign up, and a display name derived from your email unless you set
            one.
          </li>
          <li>
            <span className="font-semibold text-ink dark:text-white">Content you submit</span> — reviews, ratings,
            price reports, and any messages you send us.
          </li>
          <li>
            <span className="font-semibold text-ink dark:text-white">Activity data</span> — venues you favorite,
            outing plans you build or save, and searches you make within the Service.
          </li>
          <li>
            <span className="font-semibold text-ink dark:text-white">Device and usage data</span> — general
            information such as browser type, pages visited, and timestamps, used to keep the Service secure and to
            understand aggregate usage.
          </li>
          <li>
            <span className="font-semibold text-ink dark:text-white">Cookies and local storage</span> — small
            pieces of data stored in your browser to keep you signed in, remember preferences like your budget cap
            or dark-mode setting, and maintain your cart.
          </li>
        </ul>
        <p>We do not collect payment card information — BallPlan does not process payments.</p>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Create and maintain your account, and authenticate you when you sign in;</li>
          <li>Show you venues, prices, and outing plans relevant to your budget and preferences;</li>
          <li>Display your reviews and price reports, and notify you about their status;</li>
          <li>Send you transactional emails — verification codes, password resets, and service notifications;</li>
          <li>Detect, investigate, and prevent fraud, abuse, and security incidents;</li>
          <li>Improve the Service based on aggregate, de-identified usage patterns.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal Basis for Processing">
        <p>
          Under the NDPA, we rely on the following legal bases to process your personal data: your consent (for
          example, when you sign up or submit a review); the necessity of processing to perform our contract with
          you (providing the Service you've requested); and our legitimate interests in securing the Service and
          improving it, balanced against your rights and freedoms.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-Party Service Providers">
        <p>
          We share personal data with a limited number of service providers who process it on our behalf, under
          contractual obligations to protect it and use it only for the purposes we specify:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-ink dark:text-white">Supabase</span> — provides our database,
            authentication, and file storage infrastructure.
          </li>
          <li>
            <span className="font-semibold text-ink dark:text-white">Brevo</span> — delivers transactional emails
            such as verification codes and password-reset messages.
          </li>
        </ul>
        <p>We do not sell your personal data to anyone, for any purpose.</p>
      </LegalSection>

      <LegalSection title="6. Cookies and Local Storage">
        <p>
          We use strictly necessary cookies and browser local storage to keep you signed in and to remember
          in-session choices like your cart, favorites, and theme. You can clear these at any time through your
          browser settings, though doing so may sign you out or reset saved preferences.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Sharing and Disclosure">
        <p>
          Beyond the service providers listed above, we disclose personal data only: when required by law, court
          order, or governmental request; to protect the rights, property, or safety of BallPlan, our users, or the
          public; or in connection with a merger, acquisition, or sale of assets, in which case we will notify you
          before your data becomes subject to a different privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="8. Data Retention">
        <p>
          We retain your personal data for as long as your account is active or as needed to provide the Service.
          If you delete your account, we delete or anonymize your personal data within a reasonable period, except
          where we are required to retain it to comply with legal obligations, resolve disputes, or enforce our
          agreements.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Rights">
        <p>Under the NDPA, you have the right to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Access the personal data we hold about you;</li>
          <li>Request correction of inaccurate or incomplete data;</li>
          <li>Request deletion of your personal data, subject to legal exceptions;</li>
          <li>Object to or restrict certain processing of your data;</li>
          <li>Request a portable copy of your data in a structured, machine-readable format;</li>
          <li>Withdraw consent at any time where processing is based on consent;</li>
          <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe we have mishandled your data.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:hello@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            hello@ballplan.net
          </a>
          . We will respond within the timeframe required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="10. Children's Privacy">
        <p>
          The Service is not directed to children under 18. We do not knowingly collect personal data from
          children. If you believe a child has provided us with personal data, contact us so we can delete it.
        </p>
      </LegalSection>

      <LegalSection title="11. Data Security">
        <p>
          We use industry-standard technical and organizational measures — including encryption in transit,
          access controls, and row-level security on our database — to protect your personal data. No method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="12. International Data Transfers">
        <p>
          Our infrastructure provider stores data in secure data centers, which may be located outside Nigeria. Where
          we transfer personal data internationally, we rely on contractual safeguards and our providers' compliance
          certifications to ensure your data continues to receive an adequate level of protection.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by an updated
          "Last updated" date above, and where appropriate, we will notify you through the Service or by email.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact Us">
        <p>
          For any questions about this Privacy Policy or how we handle your personal data, contact us at{' '}
          <a href="mailto:hello@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            hello@ballplan.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
