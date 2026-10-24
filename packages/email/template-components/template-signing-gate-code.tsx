import { Plural, Trans } from '@lingui/react/macro';

import { Heading, Img, Section, Text } from '../components';
import { getEmailAssetUrl } from '../utils/asset-url';

export type TemplateSigningGateCodeProps = {
  documentTitle: string;
  code: string;
  userName: string;
  expiresInMinutes: number;
  assetBaseUrl?: string;
};

export const TemplateSigningGateCode = ({
  documentTitle,
  code,
  userName,
  expiresInMinutes,
  assetBaseUrl = 'http://localhost:3002',
}: TemplateSigningGateCodeProps) => {
  return (
    <div>
      <Img src={getEmailAssetUrl(assetBaseUrl, 'static/document.png')} alt="Document" className="mx-auto h-12 w-12" />

      <Section className="mt-8">
        <Heading className="text-center font-semibold text-foreground text-lg">
          <Trans>Your code to open the document</Trans>
        </Heading>

        <Text className="mt-2 text-center text-foreground">
          <Trans>
            Hi {userName}, enter this code on the signing page to open "{documentTitle}". It confirms the document is
            being opened by the person this email was sent to.
          </Trans>
        </Text>

        <Section className="mt-6 rounded-lg bg-muted p-6 text-center">
          <Text className="font-bold text-2xl text-foreground tracking-wider">{code}</Text>
        </Section>

        <Text className="mt-4 text-center text-muted-foreground text-sm">
          <Plural
            value={expiresInMinutes}
            one="This code will expire in # minute."
            other="This code will expire in # minutes."
          />
        </Text>

        <Text className="mt-4 text-center text-muted-foreground text-sm">
          <Trans>
            Never share this code. If you didn't try to open this document, you can ignore this email and nobody can
            open it without the code.
          </Trans>
        </Text>
      </Section>
    </div>
  );
};
