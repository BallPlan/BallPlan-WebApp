import { Link } from 'react-router-dom';
import LegalPageLayout, { LegalSection } from '../components/LegalPageLayout';

export default function Terms() {
  return (
    <LegalPageLayout title="Terms of Service" updated="September 15, 2026">
      <LegalSection title="1. Agreement to Terms">
        <p>
          These Terms of Service ("Terms") form a binding agreement between you and BallPlan ("BallPlan," "we,"
          "us," or "our") governing your access to and use of the BallPlan website, mobile experience, and related
          services (together, the "Service"). By creating an account, browsing venues, or otherwise using the
          Service, you agree to be bound by these Terms and by our{' '}
          <Link to="/privacy" className="font-semibold text-brand hover:text-brand-dark">
            Privacy Policy
          </Link>
          , which is incorporated here by reference. If you do not agree, please do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. What BallPlan Is">
        <p>
          BallPlan helps people discover restaurants, hotels, cinemas, beaches, lounges, gardens, and other venues,
          and plan outings around a budget. We display venue information, menus, activities, and pricing supplied by
          venues or gathered from public sources, and we let users submit reviews and report price discrepancies to
          keep that information accurate. BallPlan is a discovery and planning tool — we are not a party to any
          transaction, reservation, or purchase you make at a venue, and we do not process payments on behalf of
          venues.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility and Accounts">
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to create a BallPlan
          account. By registering, you confirm that the information you provide is accurate and that you will keep
          it up to date. You are responsible for maintaining the confidentiality of your password and for all
          activity that occurs under your account. Notify us immediately at{' '}
          <a href="mailto:info@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            info@ballplan.net
          </a>{' '}
          if you suspect unauthorized use of your account.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Submit false, misleading, defamatory, or fraudulent reviews or price reports;</li>
          <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation;</li>
          <li>Attempt to gain unauthorized access to other accounts, our systems, or non-public areas of the Service;</li>
          <li>Scrape, harvest, or bulk-extract data from the Service without our prior written consent;</li>
          <li>Interfere with, disrupt, or place undue load on the Service's infrastructure;</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with a venue or with BallPlan.</li>
        </ul>
        <p>We may investigate and take appropriate action against anyone who, in our judgment, violates this section.</p>
      </LegalSection>

      <LegalSection title="5. Your Content">
        <p>
          When you submit a review, price report, or other content ("User Content"), you retain ownership of it, but
          you grant BallPlan a worldwide, royalty-free, non-exclusive, sublicensable license to host, store,
          reproduce, adapt, publish, and display that content in connection with operating and promoting the
          Service. You represent that you have the right to submit your User Content and that it does not infringe
          any third party's rights.
        </p>
        <p>
          We may, but are not obligated to, review, moderate, hide, or remove User Content at our discretion,
          including content we reasonably believe violates these Terms, is inaccurate, or is unlawful.
        </p>
      </LegalSection>

      <LegalSection title="6. Pricing and Venue Information">
        <p>
          Prices, menus, hours, and other venue details displayed on BallPlan are gathered from venues, public
          sources, and user-submitted price reports, and are provided for planning purposes only. While we work to
          keep this information current — including through user-submitted corrections — we do not guarantee its
          accuracy, and actual prices or availability at a venue may differ at the time of your visit. BallPlan is
          not responsible for discrepancies between displayed information and what a venue actually charges or
          offers.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-Party Venues and Links">
        <p>
          BallPlan features listings for independent, third-party venues that we do not own, operate, or control.
          Any visit, reservation, purchase, or dispute you have with a venue is strictly between you and that venue.
          We are not responsible for the quality, safety, legality, or any other aspect of a venue's goods or
          services. The Service may also link to third-party websites (for example, map or direction providers) that
          are governed by their own terms and privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>
          The Service, including its design, text, graphics, logos, and underlying software, is owned by BallPlan or
          our licensors and is protected by intellectual property laws. Except for the limited license to use the
          Service as intended, nothing in these Terms transfers any intellectual property rights to you.
        </p>
      </LegalSection>

      <LegalSection title="9. Suspension and Termination">
        <p>
          We may suspend or terminate your access to the Service at any time, with or without notice, if we
          reasonably believe you have violated these Terms, engaged in fraudulent or unlawful activity, or posed a
          risk to other users or to BallPlan. You may stop using the Service and request deletion of your account at
          any time by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers">
        <p>
          The Service is provided "as is" and "as available," without warranties of any kind, whether express,
          implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose,
          and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or completely
          secure.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, BallPlan and its officers, employees, and agents will not be
          liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits
          or revenues, arising out of or connected to your use of the Service or any venue you visit through it. Our
          total liability for any claim arising from these Terms or the Service will not exceed ₦50,000 (fifty
          thousand naira) or the amount you paid us in the twelve months before the claim, whichever is greater —
          noting that BallPlan does not charge users for core access to the Service.
        </p>
      </LegalSection>

      <LegalSection title="12. Indemnification">
        <p>
          You agree to indemnify and hold BallPlan harmless from any claims, damages, liabilities, and expenses
          (including reasonable legal fees) arising from your use of the Service, your User Content, or your
          violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing Law and Dispute Resolution">
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law
          principles. Any dispute arising out of or relating to these Terms or the Service will be subject to the
          exclusive jurisdiction of the courts sitting in Lagos State, Nigeria. Before filing a claim, you agree to
          first contact us at{' '}
          <a href="mailto:info@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            info@ballplan.net
          </a>{' '}
          so we can try to resolve the matter informally.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the "Last
          updated" date above and, where appropriate, notify you through the Service or by email. Continuing to use
          the Service after changes take effect means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact Us">
        <p>
          Questions about these Terms can be sent to{' '}
          <a href="mailto:info@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            info@ballplan.net
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
