/**
 * GitHub OAuth Utility for ArtChain
 * Handles the handshake and profile retrieval
 */

const DEFAULT_ID = "Iv1.your_github_client_id_here";
const CLIENT_ID  = localStorage.getItem("GH_CLIENT_ID") || DEFAULT_ID;

export const hasRealClientId = () => CLIENT_ID !== DEFAULT_ID;

export const saveClientId = (id) => localStorage.setItem("GH_CLIENT_ID", id);

export const getGithubAuthUrl = () => {
  const rootUrl = "https://github.com/login/oauth/authorize";
  const options = {
    client_id: CLIENT_ID,
    redirect_uri: window.location.origin,
    scope: "read:user",
    state: Math.random().toString(36).substring(7),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const fetchGithubProfile = async (code) => {
  // Note: Client-side only OAuth has CORS limitations with GitHub.
  // In a real production app, this fetch would go through a serverless function.
  // For this demonstration, we'll implement a robust mock that allows 
  // the UI to reflect a successful connection.
  
  if (!code) return null;

  try {
    // Simulated fetch to ensure the 'Next Level' UI is testable 
    // without a backend or valid OAuth client secret.
    if (code === "simulated") {
       return {
         username: "AdityaSingh-VIT", 
         avatar: "https://github.com/identicons/aditya.png",
         profileUrl: "https://github.com/AdityaSingh-VIT",
       };
    }
    
    // In a real production scenario, you'd exchange code for token here
    return null;
  } catch (err) {
    console.error("GitHub fetch error:", err);
    return null;
  }
};
