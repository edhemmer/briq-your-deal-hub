import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              BRIX Real Estate
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Effective June 26, 2026. This policy explains what BRIX collects, why it is used, and how users can control or delete their account data.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Open BRIX</Link>
          </Button>
        </div>

        <PolicySection title="Data We Collect">
          BRIX collects account identifiers such as email address or Apple private relay email, property and deal information users enter or import, uploaded photos, documents, notes, contract files, field-capture metadata, and usage data needed to secure and operate the service.
        </PolicySection>

        <PolicySection title="How We Use Data">
          Data is used to provide acquisition intelligence, deal analysis, field capture, contract review, portfolio tracking, account management, security, support, and legally required records. BRIX does not sell personal data and does not track users across apps or websites for advertising.
        </PolicySection>

        <PolicySection title="Photos, Location, Microphone, and Documents">
          Camera, photo library, microphone, location, and document access are optional and used only when a user chooses to capture or upload property evidence. Visual findings are decision-support signals and do not replace inspections or professional review.
        </PolicySection>

        <PolicySection title="Third-Party Providers">
          BRIX uses infrastructure and service providers such as Supabase for authentication, database, storage, and backend functions. Future property, market, insurance, tax, or payment providers may be added only when needed to provide BRIX functionality and must protect user data consistently with this policy.
        </PolicySection>

        <PolicySection title="Account Deletion">
          Users can initiate account deletion from inside the app. Deletion removes the BRIX account and associated personal data unless BRIX is legally required to retain a limited record. Sign in with Apple token revocation is performed when token material is available to BRIX.
        </PolicySection>

        <PolicySection title="Security">
          BRIX uses authenticated API access, row-level security, private storage buckets, and service-role backend functions for privileged account operations. Users should not rely on estimates as verified facts; BRIX labels missing and estimated data to reduce false confidence.
        </PolicySection>

        <PolicySection title="Contact">
          For privacy, account deletion, or support questions, contact BRIX support from the Account screen or email support@brixrealestate.app.
        </PolicySection>
      </div>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: string }) {
  return (
    <CardContainer className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{children}</p>
    </CardContainer>
  );
}
