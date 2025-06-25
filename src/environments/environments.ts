export const environment = {
  production: false,
  baseLocaUrl: "http://localhost:",
  fetchVulnerability: "/cvss/getVulnerabilities",
  getVulnerabilities: "/cvss/vulnerabilities",
  getScanVulnerabilities: "/api/file/vulnerabilities",
  uploadFile: "/api/file/upload",
  getFileUploadEventLog: "/api/file/events/status/",
  searchByKeyWordUrl: "/cvss/search/cve/keyword?keywords=",
  searchByCveid: "/cvss/search/cve/cveId?cveId=",
  searchByCpeName: "/cvss/search/cve/cpeName?cpe=",
  apiKey: "ca987215-dbe8-42f0-a656-e5da368c3c70",
  saveDependencyHint: "http://localhost:8081/api/hint/GAV/addHint",
  searchLikelyKeyword: "/cvss/search/cpe/keyword?keyword=",
  searchLikelyCpe: "/cvss/search/cpe/matchingCpeName?cpeName=",
  mainUrls: ["dependencies", "cpeSearchResults", "vulnerabilityList"]
}