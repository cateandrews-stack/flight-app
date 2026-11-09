// Netlify function: keeps the RapidAPI key on the server.
// Set RAPIDAPI_KEY in Netlify: Site configuration > Environment variables.
exports.handler = async (event) => {
  const { from, to, date } = event.queryStringParameters || {};
  if (!from || !to || !date) {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Missing from, to, or date" }) };
  }
  if (!process.env.RAPIDAPI_KEY) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "RAPIDAPI_KEY is not set on the server" }) };
  }

  const qs = new URLSearchParams({
    fromEntityId: from,
    toEntityId: to,
    departDate: date,
    adults: "1",
    currency: "USD",
  });
  const url = `https://flights-sky.p.rapidapi.com/flights/search-one-way?${qs}`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "flights-sky.p.rapidapi.com",
      },
    });
    const body = await res.text();
    const headers = { "Content-Type": "application/json" };
    // Cache good responses for a few minutes so repeat searches do not use up the quota.
    if (res.ok) {
      headers["Cache-Control"] = "public, max-age=300";
      headers["Netlify-CDN-Cache-Control"] = "public, s-maxage=600";
    }
    return { statusCode: res.status, headers, body };
  } catch (err) {
    return { statusCode: 502, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "API request failed" }) };
  }
};
