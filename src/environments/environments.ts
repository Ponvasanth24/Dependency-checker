export const environment = {
  production: false,
  baseLocaUrl: "http://localhost:",
  fetchVulnerability: "/cvss/getVulnerabilities",
  getVulnerabilities: "/cvss/vulnerabilities",
  searchByKeyWordUrl: "/cvss/search/cve/keyword?keywords=",
  searchByCveid: "/cvss/search/cve/cveId?cveId=",
  searchByCpeName: "/cvss/search/cve/cpeName?cpe=",
  apiKey: "ca987215-dbe8-42f0-a656-e5da368c3c70",
  searchLikelyKeyword: "/cvss/search/cpe/keyword?keyword=",
  searchLikelyCpe: "/cvss/search/cpe/matchingCpeName?cpeName=",
  mainUrls: ["dependencies", "cpeSearchResults", "vulnerabilityList"]
}

// export function getLocalIPAddress(): Promise<string | null> {
//   return new Promise((resolve, reject) => {
//     const peerConnection = new RTCPeerConnection({
//       iceServers: []
//     });
    
//     peerConnection.createDataChannel("");
//     peerConnection.onicecandidate = (event: any) => {
//       if (event.candidate && event.candidate.candidate) {
//         const candidate = event.candidate.candidate;
//         const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
//         if (ipMatch) {
//           resolve(ipMatch[0]);
//         }
//       }
//     };

//     peerConnection.createOffer().then((offer) => {
//       return peerConnection.setLocalDescription(offer);
//     }).catch((error) => {
//       reject('Error creating offer or setting local description: ' + error);
//     });
//   });
// }

// getLocalIPAddress().then(ip => {
//   console.log("Local IP Address:", ip);
//   if (ip) {
//     environment.baseLocaUrl = `http://${ip}:`;
//   }
// }).catch(err => {
//   console.error("Error fetching local IP:", err);
//   environment.baseLocaUrl = `http://${window.location.hostname}:`;
// });
