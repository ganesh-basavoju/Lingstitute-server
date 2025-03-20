import axios from "axios";
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI;
let accessToken = '';

// Step 1: Redirect to Zoom for Authorization
export const authorizeZoom = (req, res) => {
  const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${ZOOM_REDIRECT_URI}`;
  res.redirect(zoomAuthUrl);
};

// Step 2: Handle Zoom OAuth Callback
export const zoomCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      querystring.stringify({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: ZOOM_REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    res.send('Zoom Authorization Successful! You can now create meetings.');
  } catch (error) {
    console.error('Error getting access token:', error.response.data);
    res.status(500).send('Error getting access token');
  }
};

// Step 3: Create a Meeting
export const createMeeting = async (req, res) => {
  const { topic, start_time, duration } = req.body;

  if (!accessToken) {
    return res.status(401).send('Access token not found. Please reauthorize the app.');
  }

  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled Meeting
        start_time,
        duration,
        timezone: 'Asia/Kolkata',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      join_url: response.data.join_url,
      meeting_id: response.data.id,
      password: response.data.password,
    });
  } catch (error) {
    console.error('Error creating Zoom meeting:', error.response.data);
    res.status(500).send('Error creating Zoom meeting');
  }
};
