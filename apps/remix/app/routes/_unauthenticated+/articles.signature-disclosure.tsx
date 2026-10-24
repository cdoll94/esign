import { PLATFORM_LEGAL_NAME, PLATFORM_NAME, SUPPORT_EMAIL } from '@documenso/lib/constants/app';
import { SIGNING_GATE_DISCLOSURE_VERSION } from '@documenso/lib/server-only/signing-gate/constants';
import { Trans } from '@lingui/react/macro';

// Shown to every signer before they open a document. Changing the substance of this text
// needs a new SIGNING_GATE_DISCLOSURE_VERSION so each consent record names the text agreed to.
export default function SignatureDisclosure() {
  const platformName = PLATFORM_NAME();
  const legalName = PLATFORM_LEGAL_NAME();

  return (
    <div>
      <article className="prose dark:prose-invert">
        <h1>
          <Trans>Electronic Records and Signature Disclosure</Trans>
        </h1>

        <p>
          <Trans>
            {platformName} is the electronic signature service operated by {legalName}, a Nevada limited liability
            company. Before you open a document sent to you through {platformName}, we ask you to agree to receive and
            sign it electronically. This page explains what that means and your rights, as required by the U.S.
            Electronic Signatures in Global and National Commerce Act (ESIGN Act) and the Uniform Electronic
            Transactions Act (UETA).
          </Trans>
        </p>

        <h2>
          <Trans>What you are agreeing to</Trans>
        </h2>
        <p>
          <Trans>
            If you agree, the document, and the notices and copies that relate to it, will be given to you
            electronically on the signing page and by email instead of on paper. Your agreement covers the document you
            were invited to and the emails about it (invitations, reminders, verification codes and the completed copy).
            It does not cover any other document unless you agree again.
          </Trans>
        </p>

        <h2>
          <Trans>Your electronic signature is binding</Trans>
        </h2>
        <p>
          <Trans>
            When you sign through {platformName}, by drawing, typing or uploading your signature, entering your
            initials, or clicking to complete, you are signing the document. Your electronic signature has the same
            legal effect as a handwritten signature.
          </Trans>
        </p>

        <h2>
          <Trans>Getting a paper copy</Trans>
        </h2>
        <p>
          <Trans>
            You may ask for a paper copy of any document you are asked to sign, or have signed, at no charge. Reply to
            the email you received or write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, and tell us
            which document you need.
          </Trans>
        </p>

        <h2>
          <Trans>Withdrawing your agreement</Trans>
        </h2>
        <p>
          <Trans>
            You may withdraw your agreement to use electronic records at any time before you sign, at no charge, by
            declining the document on the signing page or by telling the sender (reply to their email, or write to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>). If you withdraw, the document will need to be
            signed on paper instead, which may delay the transaction. Withdrawing does not undo anything you already
            signed electronically.
          </Trans>
        </p>

        <h2>
          <Trans>What you need</Trans>
        </h2>
        <ul>
          <li>
            <Trans>An internet connection and a current web browser (Chrome, Safari, Edge or Firefox)</Trans>
          </li>
          <li>
            <Trans>An email account you can access, to receive verification codes and your completed copy</Trans>
          </li>
          <li>
            <Trans>A device that can open PDF files, and a way to save or print them if you want a copy</Trans>
          </li>
        </ul>
        <p>
          <Trans>
            By entering the code we email you and opening the document, you show that you can access electronic records
            in the form we use. If these requirements change in a way that could stop you accessing or keeping your
            records, we will tell you and ask for your agreement again.
          </Trans>
        </p>

        <h2>
          <Trans>Keeping your email address up to date</Trans>
        </h2>
        <p>
          <Trans>
            We send documents and copies to the email address the sender gave us. If it changes, tell the sender so you
            keep receiving them.
          </Trans>
        </p>

        <h2>
          <Trans>Your copy and our records</Trans>
        </h2>
        <p>
          <Trans>
            When everyone has signed, every party is emailed the completed document with a Certificate of Completion,
            and you can download it from the signing page. We keep the signed document and its record for at least seven
            years.
          </Trans>
        </p>

        <h2>
          <Trans>What we record, and why</Trans>
        </h2>
        <p>
          <Trans>
            To show who signed and when, we record each step of the signing process: when emails are sent and delivered,
            when the document is opened, verification codes, your consent, and your signature. For each step we record
            the date and time, your email address, your IP address, the approximate location that IP address suggests
            (city and country), and your browser and device type. This record is attached to the completed document and
            kept with it. It is used only to prove the signing process and is not sold or used for marketing. IP
            geolocation by DB-IP (db-ip.com).
          </Trans>
        </p>

        <h2>
          <Trans>Questions</Trans>
        </h2>
        <p>
          <Trans>
            Questions about this disclosure or a document? Reply to the email you received, or write to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </Trans>
        </p>

        <p className="text-muted-foreground text-sm">
          <Trans>Version {SIGNING_GATE_DISCLOSURE_VERSION}</Trans>
        </p>
      </article>
    </div>
  );
}
