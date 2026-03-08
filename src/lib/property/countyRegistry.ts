export interface CountyRegistryEntry {
  state: string;
  county: string;
  propertySearchUrl: string;
  supportsAddressQuery: boolean;
  queryParam?: string;
}

export const COUNTY_REGISTRY: CountyRegistryEntry[] = [
  // Florida
  { state: "FL", county: "Miami-Dade", propertySearchUrl: "https://www.miamidade.gov/Apps/PA/propertysearch/", supportsAddressQuery: false },
  { state: "FL", county: "Broward", propertySearchUrl: "https://web.bcpa.net/BcpaClient/", supportsAddressQuery: false },
  { state: "FL", county: "Palm Beach", propertySearchUrl: "https://www.pbcgov.org/papa/", supportsAddressQuery: false },
  { state: "FL", county: "Orange", propertySearchUrl: "https://www.ocpafl.org/Searches/ParcelSearch.aspx", supportsAddressQuery: false },
  { state: "FL", county: "Hillsborough", propertySearchUrl: "https://gis.hcpafl.org/propertysearch/", supportsAddressQuery: false },
  { state: "FL", county: "Duval", propertySearchUrl: "https://paopropertysearch.coj.net/Basic/Search.aspx", supportsAddressQuery: false },
  { state: "FL", county: "Pinellas", propertySearchUrl: "https://www.pcpao.org/", supportsAddressQuery: false },
  // Texas
  { state: "TX", county: "Harris", propertySearchUrl: "https://public.hcad.org/records/Real.asp", supportsAddressQuery: false },
  { state: "TX", county: "Dallas", propertySearchUrl: "https://www.dallascad.org/SearchAddr.aspx", supportsAddressQuery: false },
  { state: "TX", county: "Tarrant", propertySearchUrl: "https://www.tad.org/property-search/", supportsAddressQuery: false },
  { state: "TX", county: "Bexar", propertySearchUrl: "https://bexar.trueautomation.com/clientdb/", supportsAddressQuery: false },
  { state: "TX", county: "Travis", propertySearchUrl: "https://www.traviscad.org/property-search", supportsAddressQuery: false },
  // California
  { state: "CA", county: "Los Angeles", propertySearchUrl: "https://portal.assessor.lacounty.gov/", supportsAddressQuery: false },
  { state: "CA", county: "San Diego", propertySearchUrl: "https://arcc-detail.sdcounty.ca.gov/", supportsAddressQuery: false },
  { state: "CA", county: "San Francisco", propertySearchUrl: "https://www.sfassessor.org/property-information/homeowners", supportsAddressQuery: false },
  // New York
  { state: "NY", county: "New York", propertySearchUrl: "https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address", supportsAddressQuery: false },
  { state: "NY", county: "Kings", propertySearchUrl: "https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address", supportsAddressQuery: false },
  // Georgia
  { state: "GA", county: "Fulton", propertySearchUrl: "https://iasworld.fultonassessor.org/", supportsAddressQuery: false },
  { state: "GA", county: "DeKalb", propertySearchUrl: "https://www.dekalbcountyga.gov/tax-commissioner/property-tax-search", supportsAddressQuery: false },
  // Ohio
  { state: "OH", county: "Cuyahoga", propertySearchUrl: "https://myplace.cuyahogacounty.gov/", supportsAddressQuery: false },
  { state: "OH", county: "Franklin", propertySearchUrl: "https://property.franklincountyauditor.com/", supportsAddressQuery: false },
  // Illinois
  { state: "IL", county: "Cook", propertySearchUrl: "https://www.cookcountyassessor.com/address-search", supportsAddressQuery: false },
  // Arizona
  { state: "AZ", county: "Maricopa", propertySearchUrl: "https://mcassessor.maricopa.gov/", supportsAddressQuery: false },
  // Nevada
  { state: "NV", county: "Clark", propertySearchUrl: "https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/", supportsAddressQuery: false },
  // North Carolina
  { state: "NC", county: "Mecklenburg", propertySearchUrl: "https://property.spatialest.com/nc/mecklenburg/", supportsAddressQuery: false },
  // Tennessee
  { state: "TN", county: "Davidson", propertySearchUrl: "https://www.padctn.org/prc/", supportsAddressQuery: false },
  // Colorado
  { state: "CO", county: "Denver", propertySearchUrl: "https://www.denvergov.org/property", supportsAddressQuery: false },
  // Michigan
  { state: "MI", county: "Wayne", propertySearchUrl: "https://www.waynecounty.com/elected/treasurer/tax-information.aspx", supportsAddressQuery: false },
  // Pennsylvania
  { state: "PA", county: "Philadelphia", propertySearchUrl: "https://property.phila.gov/", supportsAddressQuery: false },
  // Washington
  { state: "WA", county: "King", propertySearchUrl: "https://blue.kingcounty.com/Assessor/eRealProperty/default.aspx", supportsAddressQuery: false },
  // Maryland
  { state: "MD", county: "Baltimore", propertySearchUrl: "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx", supportsAddressQuery: false },
];

export function findCountyEntry(state: string, county: string): CountyRegistryEntry | undefined {
  const normState = state.trim().toUpperCase();
  const normCounty = county.trim().toLowerCase();
  return COUNTY_REGISTRY.find(
    (e) => e.state.toUpperCase() === normState && e.county.toLowerCase() === normCounty
  );
}
