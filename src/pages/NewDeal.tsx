import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDeal } from "@/hooks/useDeals";

const propertyTypes = ["Single Family", "Multi-Family", "Commercial", "Land", "Mixed Use"];
const strategies = ["Buy & Hold", "Fix & Flip", "Wholesale", "BRRRR", "Development"];

export default function NewDeal() {
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const [form, setForm] = useState({
    property_address: "",
    city: "",
    state: "",
    zip_code: "",
    property_type: "",
    purchase_price: "",
    estimated_arv: "",
    strategy_primary: "",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

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
      strategy_primary: form.strategy_primary || undefined,
    });
    navigate(`/analysis/${deal.id}`);
  };

  return (
    <SectionContainer>
      <PageHeader title="New Deal" description="Enter deal details to begin analysis" />
      <CardContainer className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address *</Label>
            <Input id="address" required value={form.property_address} onChange={e => set("property_address", e.target.value)} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" required value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" required value={form.state} onChange={e => set("state", e.target.value)} placeholder="TX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" value={form.zip_code} onChange={e => set("zip_code", e.target.value)} placeholder="75001" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={form.property_type} onValueChange={v => set("property_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select value={form.strategy_primary} onValueChange={v => set("strategy_primary", v)}>
                <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Purchase Price</Label>
              <Input id="price" type="number" value={form.purchase_price} onChange={e => set("purchase_price", e.target.value)} placeholder="250000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arv">Estimated ARV</Label>
              <Input id="arv" type="number" value={form.estimated_arv} onChange={e => set("estimated_arv", e.target.value)} placeholder="350000" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending ? "Creating…" : "Create Deal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/deals")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContainer>
    </SectionContainer>
  );
}
