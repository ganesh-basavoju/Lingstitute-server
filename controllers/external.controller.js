import axios from "axios";

const NEWS_API_KEY = "48327b349d0c401b83c83ca62f7dfcb4"; 
const NEWS_API_URL = "https://newsapi.org/v2/top-headlines";

const THOUGHT_API_URL = "https://zenquotes.io/api/random";



export const getDailyNews = async (req, res) => {
  try {
    const { country = "us", category = "general" } = req.query; // Allow dynamic filters

    // Fetch top news headlines
    const response = await axios.get(NEWS_API_URL, {
        params: {
            country, 
            category,
            apiKey: NEWS_API_KEY,
        },
    });

    const articles = response.data.articles;

    if (!articles.length) {
        return res.status(404).json({ message: "No news found" });
    }

    // Send only the required fields
    const formattedNews = articles.map((article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage, 
        source: article.source.name,
        publishedAt: article.publishedAt,
    }));

    res.status(200).json({ status: "success", articles: formattedNews });
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ message: "Failed to fetch daily news" });
    }
};


export const getDailyThoughts = async (req, res) => {
    try {
        const response = await axios.get(THOUGHT_API_URL);

        // Accessing the first object in the array
        const thoughtData = response.data[0];

        const thought = {
            content: thoughtData.q,   // Extract the quote content
            author: thoughtData.a,    // Extract the author name
        };

        res.status(200).json(thought);  // Send the thought object as JSON response
    } catch (error) {
        console.error("Error fetching thought:", error);
        res.status(500).json({ message: "Failed to fetch thought for the day" });
    }
};

