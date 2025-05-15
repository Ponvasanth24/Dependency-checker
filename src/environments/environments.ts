export const environment = {
      production:false,
      baseLocaUrl: "http://localhost:",
      // getVulnerability: "http://localhost:8080/cvss/getVulnerabilities",
      fetchVulnerability: "/cvss/getVulnerabilities",
      getVulnerabilities: "/cvss/vulnerabilities",
      searchByKeyWordUrl: "http://localhost:8080/cvss/search/cve/keywords?keywords=",
      searchByCveid: "http://localhost:8080/cvss/search/cve/cveId?cveId=",
      searchByCpeName: "http://localhost:8080/cvss/search/cve/cpeName?cpe=",
      apiKey: "ca987215-dbe8-42f0-a656-e5da368c3c70",
      searchLikelyKeyword: "http://localhost:8080/cvss/search/cpe/keyword?keyword=",
      searchLikelyCpe: "http://localhost:8080/cvss/search/cpe/matchingCpeName?cpeName="
}