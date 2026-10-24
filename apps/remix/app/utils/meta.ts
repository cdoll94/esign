import { NEXT_PUBLIC_WEBAPP_URL, PLATFORM_LEGAL_NAME, PLATFORM_NAME } from '@documenso/lib/constants/app';
import { i18n, type MessageDescriptor } from '@lingui/core';

export const appMetaTags = (title?: MessageDescriptor) => {
  const platformName = PLATFORM_NAME();
  const description = `Secure electronic signatures from ${PLATFORM_LEGAL_NAME()}.`;

  return [
    {
      title: title ? `${i18n._(title)} - ${platformName}` : platformName,
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'author',
      content: PLATFORM_LEGAL_NAME(),
    },
    {
      // Signing links are private; keep every page out of search engines.
      name: 'robots',
      content: 'noindex, nofollow',
    },
    {
      property: 'og:title',
      content: platformName,
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
  ];
};
