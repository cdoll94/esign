import { getDocumentByAccessToken } from '@documenso/lib/server-only/document/get-document-by-access-token';
import { redirect, useLoaderData } from 'react-router';

import { DocumentCertificateQRView } from '~/components/general/document/document-certificate-qr-view';

import type { Route } from './+types/share.$slug';

// Only certificate QR links (qr_...) are served; social sharing of signatures is turned off.
export function meta() {
  return undefined;
}

export const loader = async ({ params: { slug } }: Route.LoaderArgs) => {
  if (slug.startsWith('qr_')) {
    const document = await getDocumentByAccessToken({ token: slug });

    if (!document) {
      throw redirect('/');
    }

    return {
      document,
      token: slug,
    };
  }

  throw redirect('/');
};

export default function SharePage() {
  const { document, token } = useLoaderData<typeof loader>();

  if (document) {
    return (
      <DocumentCertificateQRView
        documentId={document.id}
        title={document.title}
        documentTeamUrl={document.documentTeamUrl}
        internalVersion={document.internalVersion}
        envelopeItems={document.envelopeItems}
        recipientCount={document.recipientCount}
        completedDate={document.completedAt ?? undefined}
        token={token}
      />
    );
  }

  return <div></div>;
}
