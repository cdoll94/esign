import { formatPath } from '@documenso/lib/constants/app';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { Button } from '@documenso/ui/primitives/button';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { Label } from '@documenso/ui/primitives/label';
import { PinInput, PinInputGroup, PinInputSlot } from '@documenso/ui/primitives/pin-input';
import { Trans } from '@lingui/react/macro';
import { MailIcon, ShieldCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useRevalidator } from 'react-router';

export type SigningGatePageProps = {
  token: string;
  documentTitle: string;
  recipientName: string;
  maskedEmail: string;
};

type GateStep = 'consent' | 'code';

type GateError = 'send-failed' | 'invalid-code' | 'too-many' | 'unknown' | null;

const RESEND_DELAY_SECONDS = 30;

export const SigningGatePage = ({ token, documentTitle, recipientName, maskedEmail }: SigningGatePageProps) => {
  const { revalidate } = useRevalidator();

  const [step, setStep] = useState<GateStep>('consent');
  const [hasConsented, setHasConsented] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<GateError>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);

  useEffect(() => {
    if (resendInSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => setResendInSeconds((seconds) => seconds - 1), 1000);

    return () => clearTimeout(timer);
  }, [resendInSeconds]);

  const post = async (path: string, body: Record<string, unknown>) =>
    await fetch(formatPath(`/api/signing-gate/${path}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });

  const onSendCode = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await post('send-code', { token });

      if (response.status === 429) {
        setError('too-many');
        return;
      }

      if (!response.ok) {
        setError('send-failed');
        return;
      }

      setStep('code');
      setCode('');
      setResendInSeconds(RESEND_DELAY_SECONDS);
    } catch {
      setError('send-failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async (value: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await post('verify', { token, code: value, hasConsented: true });

      if (response.status === 429) {
        setError('too-many');
        return;
      }

      if (response.status === 400) {
        setError('invalid-code');
        setCode('');
        return;
      }

      if (!response.ok) {
        setError('unknown');
        return;
      }

      await revalidate();
    } catch {
      setError('unknown');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-x-2 text-muted-foreground text-sm">
        <ShieldCheckIcon className="h-4 w-4" />
        <Trans>Secure document</Trans>
      </div>

      <h1 className="font-semibold text-2xl leading-snug">
        <Trans>
          Hi {recipientName}, before you open "{documentTitle}"
        </Trans>
      </h1>

      {step === 'consent' && (
        <div className="mt-6 space-y-5">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
            <p className="font-medium">
              <Trans>Agreement to use electronic records and signatures</Trans>
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <Trans>
                  You agree to receive, review and sign this document, and the notices that come with it,
                  electronically.
                </Trans>
              </li>
              <li>
                <Trans>Your electronic signature is legally binding, the same as signing on paper.</Trans>
              </li>
              <li>
                <Trans>
                  You can ask for a paper copy at no charge by replying to the email that brought you here. You can also
                  withdraw this agreement at any time before you sign, by declining the document or by telling the
                  sender; the document would then be signed on paper instead.
                </Trans>
              </li>
              <li>
                <Trans>
                  You need internet access, an email account, and a device that can open PDF files. You can download a
                  copy for your records once it is signed. If your email address changes, tell the sender.
                </Trans>
              </li>
            </ul>

            <Link
              to="/articles/signature-disclosure"
              target="_blank"
              className="mt-3 inline-block text-foreground underline underline-offset-2"
            >
              <Trans>Read the full electronic records and signature disclosure</Trans>
            </Link>
          </div>

          <div className="flex items-start gap-x-3">
            <Checkbox
              id="signing-gate-consent"
              className="mt-0.5"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
            />
            <Label htmlFor="signing-gate-consent" className="font-normal leading-snug">
              <Trans>I agree to use electronic records and signatures for this document.</Trans>
            </Label>
          </div>

          <p className="text-muted-foreground text-sm">
            <Trans>
              To keep this document private, we'll email a 6-digit code to {maskedEmail}. You'll need it to open the
              document.
            </Trans>
          </p>

          <Button className="w-full" disabled={!hasConsented} loading={isSubmitting} onClick={onSendCode}>
            <MailIcon className="mr-2 h-4 w-4" />
            <Trans>Email me a code</Trans>
          </Button>
        </div>
      )}

      {step === 'code' && (
        <div className="mt-6 space-y-5">
          <p className="text-muted-foreground text-sm">
            <Trans>
              We emailed a 6-digit code to {maskedEmail}. It can take a minute to arrive; check your spam folder if you
              don't see it.
            </Trans>
          </p>

          <PinInput
            maxLength={6}
            value={code}
            disabled={isSubmitting}
            autoFocus
            inputMode="numeric"
            pattern="^\d+$"
            aria-label="Verification code"
            onChange={(value) => {
              setCode(value);

              if (value.length === 6) {
                void onVerify(value);
              }
            }}
          >
            <PinInputGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <PinInputSlot key={index} className="h-12 w-12 text-lg" index={index} />
              ))}
            </PinInputGroup>
          </PinInput>

          <Button className="w-full" disabled={code.length !== 6} loading={isSubmitting} onClick={() => onVerify(code)}>
            <Trans>Open the document</Trans>
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground underline underline-offset-2 disabled:no-underline disabled:opacity-50"
              disabled={resendInSeconds > 0 || isSubmitting}
              onClick={onSendCode}
            >
              {resendInSeconds > 0 ? (
                <Trans>Send a new code in {resendInSeconds}s</Trans>
              ) : (
                <Trans>Send a new code</Trans>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription>
            {error === 'invalid-code' && (
              <Trans>That code isn't right or has expired. Try again or send a new one.</Trans>
            )}
            {error === 'too-many' && <Trans>Too many attempts. Please wait 15 minutes and try again.</Trans>}
            {error === 'send-failed' && (
              <Trans>We couldn't send the code. This document may no longer be available to sign.</Trans>
            )}
            {error === 'unknown' && <Trans>Something went wrong. Please try again.</Trans>}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
