/**
 * Upstream features this instance does not offer. Embedded signing, multi-sign embeds,
 * public direct-template links and social sharing let someone open or sign a document
 * without the signing gate's e-records consent and emailed code.
 */
export const DISABLED_TRPC_PROCEDURE_PREFIXES = ['embeddingpresign.'];

export const DISABLED_TRPC_PROCEDURES = [
  'template.createdocumentfromdirecttemplate',
  'template.createtemplatedirectlink',
  'template.toggletemplatedirectlink',
  'document.share',
  'document.getdocumentbytoken',
];

export const isDisabledTrpcProcedure = (procedurePath: string) => {
  const normalized = procedurePath.replace(/^\/+|\/+$/g, '').toLowerCase();

  return (
    DISABLED_TRPC_PROCEDURE_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    DISABLED_TRPC_PROCEDURES.includes(normalized)
  );
};

/**
 * Called first in the loaders of switched-off pages, as a second layer behind the edge check.
 */
export const refuseDisabledSurface = (): void => {
  throw new Response('Not Found', { status: 404 });
};
