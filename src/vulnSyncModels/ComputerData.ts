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
  vulnerabilities?: Vulnerability[]; // Optional in case it's empty
}

export interface Application {
  id: number;
  uuid: string;
  computerUuid: string;
  name: string;
  version: string;
  vendor: string;
  installDate: Date;
  status: number;
  createdAt: string;
  updatedAt: string;
  dependencies?: Dependency[];
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
