import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { Body, Container, Head, Html, Preview, Section } from '../components';
import { TemplateBrandingLogo } from '../template-components/template-branding-logo';
import { TemplateFooter } from '../template-components/template-footer';
import { TemplateSigningGateCode } from '../template-components/template-signing-gate-code';

export type SigningGateCodeEmailTemplateProps = {
  documentTitle: string;
  code: string;
  userName: string;
  expiresInMinutes: number;
  assetBaseUrl?: string;
};

export const SigningGateCodeEmailTemplate = ({
  documentTitle,
  code,
  userName,
  expiresInMinutes,
  assetBaseUrl = 'http://localhost:3002',
}: SigningGateCodeEmailTemplateProps) => {
  const { _ } = useLingui();

  const previewText = msg`Your code is ${code}`;

  return (
    <Html>
      <Head />

      <Body className="mx-auto my-auto bg-background font-sans">
        <Preview>{_(previewText)}</Preview>

        <Section>
          <Container className="mx-auto mt-8 mb-2 max-w-xl rounded-lg border border-border border-solid p-4 backdrop-blur-sm">
            <Section>
              <TemplateBrandingLogo assetBaseUrl={assetBaseUrl} className="mb-4 h-6" />

              <TemplateSigningGateCode
                documentTitle={documentTitle}
                code={code}
                userName={userName}
                expiresInMinutes={expiresInMinutes}
                assetBaseUrl={assetBaseUrl}
              />
            </Section>
          </Container>

          <div className="mx-auto mt-12 max-w-xl" />

          <Container className="mx-auto max-w-xl">
            <TemplateFooter isDocument={false} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

export default SigningGateCodeEmailTemplate;
