import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  image?: string;
}

const SITE_URL = "https://brixrealestate.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function SEO({ title, description, path = "", noindex = false, image = DEFAULT_IMAGE }: SEOProps) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes("BRIX") ? title : `${title} | BRIX`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
