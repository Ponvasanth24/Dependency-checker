export interface Evidence {
  evidenceType: string;
  evidenceTitle: string | null;
  evidence: string;
  resolvedValue: string | null;
}

export interface LikelyCPE {
  vendor: string;
  product: string;
  version: string;
  update: string;
  cpe23Uri: string;
  validCpe: boolean;
}

export interface DependencyData {
  dependencyName: string;
  artifact: any | null;
  vendorEvidences: Evidence[];
  productEvidences: Evidence[];
  versionEvidences: Evidence[];
  cpeEnumeration: any | null;
  vulnerabilities: any[];
  likelyCPEs: LikelyCPE[];
}
