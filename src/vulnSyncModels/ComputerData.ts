export interface Vulnerability {
  id: number;
  uuid: string;
  dependencyUuid: string;
  cveId: string;
  severity: string;
  description: string;
  cvssScore: string;
  publishedDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  id: number;
  uuid: string;
  applicationUuid: string;
  name: string;
  version: string;
  groupId: string;
  artifactId: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  vulnerabilities?: Vulnerability[]; 
}

export interface Application {
  [x: string]: any;
  id: number;
  uuid: string;
  name: string;
  version: string;
  vendorName: string;
  installedDate: string; 
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  select?: boolean;
  vulnerabilities: any[];
}


export interface storedApplications {
  id: number;
  uuid: string;
  name: string;
  version: string;
  vendorName: string;
  installDate: Date;
  createdAt: string;
  vulnerabilities: Vulnerabilities
}

export interface Computer {
  id: number;
  uuid: string;
  ipAddress: string;
  hostName: string;
  osName: string;
  osVersion: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  applications?: Application[];
  active: boolean;
}

export interface Vulnerabilities {
  id: number;
  uuid: string;
  cveId: string;
  cpeName: string,
  description: string;
  cvssScore: number;
  cvssVersion: string;
  vectorString: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  sourceIdentifier: string;
  createdAt: string;
  updatedAt: string | null;
  deleted: boolean;
  expanded: boolean
}

export interface InstalledSoftware {
  name: string;
  version: string;
  InstalledDate: string;
  VendorName: string;
}

export interface ComputerData {
  deviceId: string;
  machineName: string;
  ipAddress: string;
  osVersion: string;
  antivirusStatus: string;
  firewallStatus: string;
  loggedInUser: string;
  installedSoftware: InstalledSoftware[];
  lastUpdateCheck: string;
  timestamp: string;
}
export interface storedComputer {
  id: number;
  uuid: string;
  deviceId: string;
  ipAddress: string;
  machineName: string;
  osVersion: string;
  antivirusStatus: string;
  firewallStatus: string;
  loggedInUser: string;
  lastUpdateCheck: string;
  timestamp: string;  
  createdAt: string;
  updatedAt: string | null;
  deleted: boolean;
  active: boolean;
  // applications?: storedApplications[];
}

export interface ComputerDetailsResponse {
  computer: storedComputer;
  applications: Application[];
}


