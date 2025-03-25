import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";
dotenv.config();


const ZOOM_REDIRECT_URI = "http://localhost:5001/api/zoom/create-meeting";
const ZOOM_CLIENT_ID="AhNjBZ3Q1KAsdLQ0Gl06Q";
const ZOOM_CLIENT_SECRET="WnC5HuIPJbwy95o56EgQMKmcuRhYga3k";
const ZOOM_ACCOUNT_ID="4iqozWQxRb2oppRS2xMG6g";
const ZOOM_AUTH_URL="https://zoom.us/oauth/token";
const ZOOM_API_BASE_URL="https://api.zoom.us/v2"
const clientId = 'AhNjBZ3Q1KAsdLQ0Gi06Q'; // Replace with your actual Client ID
const clientSecret = 'WnC5HuIPJBwy95o56EgQMKmcuRhYga3k'; // Replace with your actual Client Secret
const basicAuthToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getAccessToken() {
  try {
    const tokenResponse = await axios.post(
      `${ZOOM_AUTH_URL}`,
      {},
      {
        params: {
          grant_type: 'account_credentials',
          account_id: ZOOM_ACCOUNT_ID,
        },
        headers: {
          Authorization: `Basic ${basicAuthToken}`,  // Basic Auth header
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('Access Token Response:', tokenResponse.data);  // Debugging log
    return tokenResponse.data.access_token;
  }catch (error) {
    console.error('Error fetching Zoom Access Token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Zoom.');
  }
}


// Step 1: Redirect to Zoom for Authorization
export const authorizeZoom = (req, res) => {
  const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${ZOOM_REDIRECT_URI}`;
  res.redirect(zoomAuthUrl);
};

// Step 2: Handle Zoom OAuth Callback and Get Access Token
export const zoomCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code not provided");
  }

  try {
      const authCode = await axios.post(
      "https://zoom.us/oauth/token",null,{
      params:{
        grant_type: "authorization_code",
        code: code,
        redirect_url: ZOOM_REDIRECT_URI,
        
      },
      
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
          ).toString("base64")}`
        },
      }
  );


    console.log("✅ Zoom Access Token:", accessToken);
    res.redirect("http://localhost:5001/api/zoom/create-meeting"); // Redirect to success page
  } catch (error) {
    console.error("❌ Error getting access token:", error.response.data);
    res.status(500).send("Error getting access token");
  }
};

// Step 3: Create a Meeting
export const createMeeting = async (req, res) => {
  const { topic, start_time, duration } = req.body;
  try {
  //const accessToken = await getAccessToken();
  accessToken = "eyJzdiI6IjAwMDAwMiIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6IjMyYTQ1OGIzLWM3MDAtNDBhYS1iZTkxLTIwYmVjNTEwOTg1NyJ9.eyJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiI1WE5rYm9EZ1E2YW1jdnpfV3R1Z3N3IiwidmVyIjoxMCwiYXVpZCI6IjFmYzFhNTJiNmJlYzRmNzA5ZGE3Y2EyYzU2ZGYyZTczZjI2NzIzNDQ4YmMwOTU2NDU4YzVmNDI1ZTA1N2YyMTAiLCJuYmYiOjE3NDI4ODM4NjYsImNvZGUiOiI0Uktua2dtMVJZZXdmYWFoUThkWTZRcHhUTUIzTDhvM2siLCJpc3MiOiJ6bTpjaWQ6QWhOamlCWjNRMUtBc2RMUTBHaTA2USIsImdubyI6MCwiZXhwIjoxNzQyODg3NDY2LCJ0eXBlIjozLCJpYXQiOjE3NDI4ODM4NjYsImFpZCI6IjRpcW96V1F4UmIyb3BwUlMyeE1HNmcifQ.LAOwfiL2-iatfMPtRts1gkI9MakadzUBLLVb97M7EZfeMV_uC9u_qJzFTm4yK_oMjwsK6ahCXa7XgNwjKIfGcA";
  
    if (!accessToken) {
      return res.status(500).send("Failed to retrieve access token from Zoom.");
    }


    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 2, // Scheduled Meeting
        start_time,
        duration,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,    
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(201).json({
      join_url: response.data.join_url,
      meeting_id: response.data.id,
      password: response.data.password,
    });
  } catch (error) {
    console.error("❌ Error creating Zoom meeting:", error.response ? error.response.data : error.message);
    res.status(500).send("Error creating Zoom meeting");
  }
};

// Step 4: Check if Zoom is Authorized
export const checkAuth = (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ authorized: false, msg: "Zoom not authorized" });
  }
  res.status(200).json({ authorized: true });
};
