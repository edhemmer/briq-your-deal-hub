import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Home, Lock } from "lucide-react";
import { useCreateDeal, useDeals } from "@/hooks/useDeals";
import { useProfile } from "@/hooks/useProfile";
import { evaluateBillingAccess, getUpgradeMessage } from "@/lib/billingAccess";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import { DEAL_INPUT_HELP } from "@/components/help/helpContent";
import { DealImageUpload, type ExtractedDeal } from "@/components/DealImageUpload";

const propertyTypes = ["Single Family", "Duplex", "Triplex", "Fourplex", "Small Multifamily", "Commercial", "Land", "Mixed Use"];
const strategies = ["Buy & Hold", "Fix & Flip", "Wholesale", "BRRRR", "Development", "Owner Occupant"];

export default function NewDeal() {
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const { data: profile } = useProfile();
  const { data: deals } = useDeals();
  const billingAccess = evaluateBillingAccess(profile ? {
    subscription_status: profile.subscription_status,
    free_deal_used: profile.free_deal_used,
    admin_override: profile.admin_override ?? false,
    manual_premium_override: profile.manual_premium_override ?? false,
    stripe_customer_id: profile.stripe_customer_id,
    stripe_subscription_id: profile.stripe_subscription_id,
  } : null, deals?.length ?? 0);

  const [form, setForm] = useState({
    property_address: "",
    city: "",
    state: "",
    zip_code: "",
    property_type: "",
    purchase_price: "",
    estimated_arv: "",
    monthly_rent: "",
    annual_property_tax: "",
    insurance: "",
    year_built: "",
    strategy_primary: "",
    asset_type: "investment",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleExtracted = useCallback((data: ExtractedDeal) => {
    setForm(f => ({
      property_address: data.property_address ?? f.property_address,
      city: data.city ?? f.city,
      state: data.state ?? f.state,
      zip_code: data.zip_code ?? f.zip_code,
      property_type: data.property_type ?? f.property_type,
      purchase_price: data.purchase_price != null ? String(data.purchase_price) : f.purchase_price,
      estimated_arv: data.estimated_arv != null ? String(data.estimated_arv) : f.estimated_arv,
      monthly_rent: data.monthly_rent != null ? String(data.monthly_rent) : f.monthly_rent,
      annual_property_tax: data.annual_property_tax != null ? String(data.annual_property_tax) : data.taxes != null ? String(data.taxes) : f.annual_property_tax,
      insurance: data.insurance != null ? String(data.insurance) : f.insurance,
      year_built: data.year_built != null ? String(data.year_built) : f.year_built,
      strategy_primary: data.strategy_primary ?? f.strategy_primary,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deal = await createDeal.mutateAsync({
      property_address: form.property_address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code || undefined,
      property_type: form.property_type || undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
      estimated_arv: form.estimated_arv ? Number(form.estimated_arv) : undefined,
      monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : undefined,
      annual_property_tax: form.annual_property_tax ? Number(form.annual_property_tax) : undefined,
      taxes: form.annual_property_tax ? Number(form.annual_property_tax) : undefined,
      insurance: form.insurance ? Number(form.insurance) : undefined,
      year_built: form.year_built ? Number(form.year_built) : undefined,
      strategy_primary: form.asset_type === "live_in" ? "Owner Occupant" : form.strategy_primary || undefined,
      asset_type: form.asset_type,
    });
    navigate(`/dealiq/${deal.id}`);
  };

  return (
    <SectionContainer>
      <PageHeader title="New Deal" description="Upload a listing, screen photos, and choose the right decision lens" />

      {!billingAccess.canCreateDeal && (
        <Alert className="max-w-2xl mb-4 border-border bg-muted/50">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm text-muted-foreground">
            {getUpgradeMessage(billingAccess)}
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl space-y-4">
        <DealImageUpload onExtracted={handleExtracted} />

        <CardContainer className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("asset_type", "investment")}
                className={`rounded-lg border p-4 text-left transition-colors ${form.asset_type === "investment" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/50"}`}
              >
                <Building2 className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Investment Deal</p>
                <p className="mt-1 text-xs text-muted-foreground">Rental, flip, BRRRR, wholesale, or small multifamily underwriting.</p>
              </button>
              <button
                type="button"
                onClick={() => set("asset_type", "live_in")}
                className={`rounded-lg border p-4 text-left transition-colors ${form.asset_type === "live_in" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/50"}`}
              >
                <Home className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold text-foreground">Live-In Home</p>
                <p className="mt-1 text-xs text-muted-foreground">Own-vs-rent, condition, pricing, area risk, and 5/10/15 year hold view.</p>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Property Address *</Label>
              <Input id="address" required value={form.property_address} onChange={e => set("property_address", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" required value={form.city} onChange={e => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input id="state" required value={form.state} onChange={e => set("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={form.zip_code} onChange={e => set("zip_code", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={form.property_type} onValueChange={v => set("property_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={form.strategy_primary} onValueChange={v => set("strategy_primary", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-1.5">Purchase Price <HelpTooltip content={DEAL_INPUT_HELP.purchase_price} /></Label>
                <Input id="price" type="number" value={form.purchase_price} onChange={e => set("purchase_price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arv" className="flex items-center gap-1.5">Estimated ARV <HelpTooltip content={DEAL_INPUT_HELP.arv} /></Label>
                <Input id="arv" type="number" value={form.estimated_arv} onChange={e => set("estimated_arv", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent">Market / Lease Rent</Label>
                <Input id="rent" type="number" value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Annual Tax</Label>
                <Input id="tax" type="number" value={form.annual_property_tax} onChange={e => set("annual_property_tax", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Annual Insurance</Label>
                <Input id="insurance" type="number" value={form.insurance} onChange={e => set("insurance", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-built">Year Built</Label>
                <Input id="year-built" type="number" value={form.year_built} onChange={e => set("year_built", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createDeal.isPending || !billingAccess.canCreateDeal}>
                {createDeal.isPending ? "Creating…" : "Create Deal"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/dealiq")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}
