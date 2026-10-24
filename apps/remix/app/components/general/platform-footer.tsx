import { PLATFORM_LEGAL_NAME, SOURCE_CODE_URL } from '@documenso/lib/constants/app';
import { Trans } from '@lingui/react/macro';
import { Link } from 'react-router';

export const PlatformFooter = () => {
  return (
    <footer className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-6 text-muted-foreground text-xs print:hidden">
      <span>
        © {new Date().getFullYear()} {PLATFORM_LEGAL_NAME()}
      </span>
      <Link to="/articles/signature-disclosure" className="hover:text-foreground hover:underline">
        <Trans>Electronic records disclosure</Trans>
      </Link>
      <a href={SOURCE_CODE_URL()} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
        <Trans>Source code</Trans>
      </a>
    </footer>
  );
};
